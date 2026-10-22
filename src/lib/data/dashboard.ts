import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getIndikatorProgram } from "@/lib/data/indikator";
import { getPesertaProgram } from "@/lib/data/program";

function ambil<T>(data: T | null, error: { message: string } | null, konteks: string): T {
  if (error) throw new Error(`${konteks}: ${error.message}`);
  return data as T;
}

export type StatistikSekolah = { totalSiswa: number; totalGuru: number; jumlahProgramAktif: number; totalKelas: number };

/** Hitung statistik global (buat dashboard admin): siswa & guru aktif, kelas periode ini,
 * dan jumlah program yang punya minimal 1 peserta pada periode ini. */
export async function getStatistikSekolah(periodeId: string): Promise<StatistikSekolah> {
  const supabase = await createClient();
  const [{ count: totalSiswa }, { count: totalGuru }, { count: totalKelas }, { data: pesertaProgramIds }] = await Promise.all([
    supabase.from("siswa").select("id", { count: "exact", head: true }).eq("aktif", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "guru").eq("aktif", true),
    supabase.from("kelas").select("id", { count: "exact", head: true }).eq("periode_id", periodeId),
    supabase.from("peserta_program").select("program_id").eq("periode_id", periodeId),
  ]);

  const jumlahProgramAktif = new Set((pesertaProgramIds ?? []).map((p) => p.program_id)).size;

  return {
    totalSiswa: totalSiswa ?? 0,
    totalGuru: totalGuru ?? 0,
    jumlahProgramAktif,
    totalKelas: totalKelas ?? 0,
  };
}

export type TuntasProgram = { programId: string; tuntas: number; belumTuntas: number };

/** Per program: berapa peserta yang SEMUA indikator aktifnya sudah terisi nilai (tuntas) vs belum. */
export async function getTuntasPerProgram(programIds: string[], periodeId: string): Promise<TuntasProgram[]> {
  const supabase = await createClient();

  return Promise.all(
    programIds.map(async (programId): Promise<TuntasProgram> => {
      const [peserta, indikatorSemua] = await Promise.all([
        getPesertaProgram(programId, periodeId),
        getIndikatorProgram(programId, periodeId),
      ]);
      const indikatorAktif = indikatorSemua.filter((i) => i.aktif);
      if (peserta.length === 0 || indikatorAktif.length === 0) return { programId, tuntas: 0, belumTuntas: peserta.length };

      const { data: nilaiRows, error } = await supabase
        .from("nilai")
        .select("peserta_program_id")
        .in("peserta_program_id", peserta.map((p) => p.id))
        .in("indikator_id", indikatorAktif.map((i) => i.id));
      const rows = ambil(nilaiRows, error, "Gagal memuat nilai");

      const jumlahPerPeserta = new Map<string, number>();
      for (const r of rows) jumlahPerPeserta.set(r.peserta_program_id, (jumlahPerPeserta.get(r.peserta_program_id) ?? 0) + 1);

      const tuntas = peserta.filter((p) => (jumlahPerPeserta.get(p.id) ?? 0) >= indikatorAktif.length).length;
      return { programId, tuntas, belumTuntas: peserta.length - tuntas };
    }),
  );
}

export type AktivitasItem = {
  id: string;
  jenis: "rapor" | "leger";
  judul: string;
  keterangan: string;
  waktu: string;
};

/** Aktivitas terbaru NYATA dari audit_log (perubahan status rapor + unduhan leger) — bukan data contoh. */
export async function getAktivitasTerbaru(limit = 6): Promise<AktivitasItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, tabel, aksi, data_baru, waktu")
    .order("waktu", { ascending: false })
    .limit(limit);
  const rows = ambil(data, error, "Gagal memuat aktivitas");
  if (rows.length === 0) return [];

  const idPeserta = [
    ...new Set(
      rows
        .filter((r) => r.tabel === "rapor")
        .map((r) => (r.data_baru as { peserta_program_id?: string } | null)?.peserta_program_id)
        .filter((x): x is string => !!x),
    ),
  ];

  const konteksPerPeserta = new Map<string, { siswaNama: string; programNama: string }>();
  if (idPeserta.length > 0) {
    const { data: konteks } = await supabase
      .from("peserta_program")
      .select("id, siswa:siswa_id(nama), program:program_id(nama)")
      .in("id", idPeserta);
    for (const k of (konteks ?? []) as unknown as { id: string; siswa: { nama: string } | null; program: { nama: string } | null }[]) {
      konteksPerPeserta.set(k.id, { siswaNama: k.siswa?.nama ?? "—", programNama: k.program?.nama ?? "—" });
    }
  }

  const LABEL_STATUS: Record<string, string> = { review: "diajukan", disetujui: "disetujui", terkunci: "dikunci & diterbitkan", draft: "dikembalikan ke draf" };

  return rows.map((r) => {
    if (r.tabel === "rapor") {
      const baru = r.data_baru as { peserta_program_id?: string; status?: string } | null;
      const k = baru?.peserta_program_id ? konteksPerPeserta.get(baru.peserta_program_id) : undefined;
      const status = baru?.status ? (LABEL_STATUS[baru.status] ?? baru.status) : "diperbarui";
      return {
        id: r.id,
        jenis: "rapor" as const,
        judul: `Rapor ${status}`,
        keterangan: k ? `${k.programNama} — ${k.siswaNama}` : "—",
        waktu: r.waktu,
      };
    }
    const baru = r.data_baru as { program?: string } | null;
    return {
      id: r.id,
      jenis: "leger" as const,
      judul: "Leger diunduh",
      keterangan: baru?.program && baru.program !== "semua" ? `Program ${baru.program}` : "Semua program",
      waktu: r.waktu,
    };
  });
}
