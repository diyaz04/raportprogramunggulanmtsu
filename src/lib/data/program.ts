import "server-only";
import { createClient } from "@/lib/supabase/server";

// Tipe ditulis manual (belum memakai `supabase gen types`).
export type JenisProgram = "standar" | "tahfidz" | "ksm" | "riset";
export type BahasaProgram = "id" | "en" | "ar";

export const JENIS_LABEL: Record<JenisProgram, string> = {
  standar: "Standar",
  tahfidz: "Tahfidz (hafalan per surat)",
  ksm: "KSM (+ prestasi lomba)",
  riset: "Riset (+ data proyek)",
};

export const BAHASA_LABEL: Record<BahasaProgram, string> = { id: "Indonesia", en: "Inggris", ar: "Arab" };

export type Rumpun = { id: string; kode: string; nama: string; urutan: number };

export type Program = {
  id: string;
  rumpun_id: string;
  kode: string;
  nama: string;
  nama_arab: string | null;
  jenis: JenisProgram;
  bahasa_utama: BahasaProgram;
  tampilkan_terjemahan: boolean;
  judul_rapor: string;
  urutan: number;
  kktp: number | null;
  bobot_hafalan: number | null;
};

export type ProgramDenganRumpun = Program & { rumpun: Pick<Rumpun, "id" | "kode" | "nama" | "urutan"> };
export type ProgramDenganJumlah = ProgramDenganRumpun & { jumlah_peserta: number; jumlah_guru: number };

export type Kelompok = { id: string; program_id: string; periode_id: string; nama: string };

export type SiswaRingkas = { id: string; nis: string; nisn: string | null; nama: string; jk: "L" | "P" };

export type PesertaProgram = {
  id: string;
  siswa: SiswaRingkas;
  kelas_nama: string | null;
  kelas_tingkat: number | null;
  kelompok_id: string | null;
  kelompok_nama: string | null;
};

export type GuruRingkas = { id: string; nama: string; nip: string | null };

export type PenugasanGuru = { id: string; guru: GuruRingkas; kelompok_id: string | null; kelompok_nama: string | null };

export type PenandaTangan = { id: string; guru: GuruRingkas; label_jabatan: string; urutan: number };

const KOLOM_PROGRAM =
  "id, rumpun_id, kode, nama, nama_arab, jenis, bahasa_utama, tampilkan_terjemahan, judul_rapor, urutan, kktp, bobot_hafalan";

function ambil<T>(data: T | null, error: { message: string } | null, konteks: string): T {
  if (error) throw new Error(`${konteks}: ${error.message}`);
  return data as T;
}

// ===== Rumpun & Program =====
export async function getRumpunList(): Promise<Rumpun[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("rumpun_program").select("id, kode, nama, urutan").order("urutan");
  return ambil(data, error, "Gagal memuat rumpun") ?? [];
}

export async function getProgramList(periodeId: string): Promise<ProgramDenganJumlah[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program")
    .select(`${KOLOM_PROGRAM}, rumpun:rumpun_id(id, kode, nama, urutan)`)
    .order("urutan");
  const programs = (ambil(data, error, "Gagal memuat program") ?? []) as unknown as ProgramDenganRumpun[];

  const [{ data: peserta, error: ep }, { data: guru, error: eg }] = await Promise.all([
    supabase.from("peserta_program").select("program_id").eq("periode_id", periodeId),
    supabase.from("penugasan_guru").select("program_id, guru_id").eq("periode_id", periodeId),
  ]);
  ambil(peserta, ep, "Gagal memuat jumlah peserta");
  ambil(guru, eg, "Gagal memuat jumlah guru");

  const jumlahPeserta = new Map<string, number>();
  for (const p of peserta ?? []) jumlahPeserta.set(p.program_id, (jumlahPeserta.get(p.program_id) ?? 0) + 1);

  const guruPerProgram = new Map<string, Set<string>>();
  for (const g of guru ?? []) {
    const set = guruPerProgram.get(g.program_id) ?? new Set<string>();
    set.add(g.guru_id);
    guruPerProgram.set(g.program_id, set);
  }

  return programs
    .map((p) => ({
      ...p,
      jumlah_peserta: jumlahPeserta.get(p.id) ?? 0,
      jumlah_guru: guruPerProgram.get(p.id)?.size ?? 0,
    }))
    .sort((a, b) => a.rumpun.urutan - b.rumpun.urutan || a.urutan - b.urutan);
}

export async function getProgramByKode(kode: string): Promise<ProgramDenganRumpun | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("program")
    .select(`${KOLOM_PROGRAM}, rumpun:rumpun_id(id, kode, nama, urutan)`)
    .eq("kode", kode)
    .maybeSingle();
  return ambil(data, error, "Gagal memuat program") as unknown as ProgramDenganRumpun | null;
}

// ===== Kelompok =====
export async function getKelompokProgram(programId: string, periodeId: string): Promise<Kelompok[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kelompok_program")
    .select("id, program_id, periode_id, nama")
    .eq("program_id", programId)
    .eq("periode_id", periodeId)
    .order("nama");
  return ambil(data, error, "Gagal memuat kelompok") ?? [];
}

// ===== Peserta (lintas kelas) =====
export async function getPesertaProgramById(id: string): Promise<{ id: string; periode_id: string; siswa: SiswaRingkas } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("peserta_program")
    .select("id, periode_id, siswa:siswa_id(id, nis, nisn, nama, jk)")
    .eq("id", id)
    .maybeSingle();
  return ambil(data, error, "Gagal memuat peserta") as unknown as { id: string; periode_id: string; siswa: SiswaRingkas } | null;
}

export async function getPesertaProgram(programId: string, periodeId: string): Promise<PesertaProgram[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("peserta_program")
    .select(
      "id, kelompok_id, siswa:siswa_id(id, nis, nisn, nama, jk), kelompok:kelompok_id(nama)",
    )
    .eq("program_id", programId)
    .eq("periode_id", periodeId);
  const rows = (ambil(data, error, "Gagal memuat peserta") ?? []) as unknown as {
    id: string;
    kelompok_id: string | null;
    siswa: SiswaRingkas;
    kelompok: { nama: string } | null;
  }[];

  if (rows.length === 0) return [];

  const { data: ks, error: ke } = await supabase
    .from("kelas_siswa")
    .select("siswa_id, kelas:kelas_id(nama, tingkat)")
    .eq("periode_id", periodeId)
    .in("siswa_id", rows.map((r) => r.siswa.id));
  const kelasRows = (ambil(ks, ke, "Gagal memuat kelas siswa") ?? []) as unknown as {
    siswa_id: string;
    kelas: { nama: string; tingkat: number } | null;
  }[];
  const kelasPerSiswa = new Map(kelasRows.map((k) => [k.siswa_id, k.kelas]));

  return rows
    .map((r) => {
      const k = kelasPerSiswa.get(r.siswa.id);
      return {
        id: r.id,
        siswa: r.siswa,
        kelas_nama: k?.nama ?? null,
        kelas_tingkat: k?.tingkat ?? null,
        kelompok_id: r.kelompok_id,
        kelompok_nama: r.kelompok?.nama ?? null,
      };
    })
    .sort((a, b) => a.siswa.nama.localeCompare(b.siswa.nama, "id"));
}

/** Siswa aktif yang belum terdaftar sebagai peserta program ini di periode tersebut, lengkap dengan nama kelasnya. */
export async function getCalonPeserta(
  programId: string,
  periodeId: string,
): Promise<{ id: string; nis: string; nama: string; kelas_nama: string | null }[]> {
  const supabase = await createClient();
  const [{ data: siswa, error: e1 }, { data: terdaftar, error: e2 }, { data: ks, error: e3 }] = await Promise.all([
    supabase.from("siswa").select("id, nis, nama").eq("aktif", true).order("nama"),
    supabase.from("peserta_program").select("siswa_id").eq("program_id", programId).eq("periode_id", periodeId),
    supabase.from("kelas_siswa").select("siswa_id, kelas:kelas_id(nama)").eq("periode_id", periodeId),
  ]);
  const semua = ambil(siswa, e1, "Gagal memuat siswa") ?? [];
  const sudah = new Set((ambil(terdaftar, e2, "Gagal memuat peserta") ?? []).map((r) => r.siswa_id));
  const kelasRows = (ambil(ks, e3, "Gagal memuat kelas siswa") ?? []) as unknown as {
    siswa_id: string;
    kelas: { nama: string } | null;
  }[];
  const kelasPerSiswa = new Map(kelasRows.map((k) => [k.siswa_id, k.kelas?.nama ?? null]));

  return semua.filter((s) => !sudah.has(s.id)).map((s) => ({ ...s, kelas_nama: kelasPerSiswa.get(s.id) ?? null }));
}

// ===== Guru program & penanda tangan =====
export async function getProfilAktif(): Promise<GuruRingkas[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("id, nama, nip").eq("aktif", true).order("nama");
  return ambil(data, error, "Gagal memuat akun aktif") ?? [];
}

/** Program-program (id) yang guru ini ditugaskan padanya, pada periode tertentu. */
export async function getProgramIdUntukGuru(guruId: string, periodeId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("penugasan_guru")
    .select("program_id")
    .eq("periode_id", periodeId)
    .eq("guru_id", guruId);
  const rows = ambil(data, error, "Gagal memuat penugasan guru") ?? [];
  return [...new Set(rows.map((r) => r.program_id))];
}

/** "semua" = guru ditugaskan ke seluruh program; array = hanya kelompok-kelompok ini yang boleh diakses. */
export async function getKelompokIzinGuru(
  programId: string,
  periodeId: string,
  guruId: string,
): Promise<"semua" | string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("penugasan_guru")
    .select("kelompok_id")
    .eq("program_id", programId)
    .eq("periode_id", periodeId)
    .eq("guru_id", guruId);
  const rows = ambil(data, error, "Gagal memuat penugasan guru") ?? [];
  if (rows.some((r) => r.kelompok_id === null)) return "semua";
  return rows.map((r) => r.kelompok_id).filter((id): id is string => id !== null);
}

export async function getPenugasanGuru(programId: string, periodeId: string): Promise<PenugasanGuru[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("penugasan_guru")
    .select("id, kelompok_id, guru:guru_id(id, nama, nip), kelompok:kelompok_id(nama)")
    .eq("program_id", programId)
    .eq("periode_id", periodeId);
  const rows = (ambil(data, error, "Gagal memuat penugasan guru") ?? []) as unknown as {
    id: string;
    kelompok_id: string | null;
    guru: GuruRingkas;
    kelompok: { nama: string } | null;
  }[];
  return rows
    .map((r) => ({ id: r.id, guru: r.guru, kelompok_id: r.kelompok_id, kelompok_nama: r.kelompok?.nama ?? null }))
    .sort((a, b) => a.guru.nama.localeCompare(b.guru.nama, "id"));
}

export async function getPenandaTangan(programId: string, periodeId: string): Promise<PenandaTangan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("penanda_tangan")
    .select("id, label_jabatan, urutan, guru:guru_id(id, nama, nip)")
    .eq("program_id", programId)
    .eq("periode_id", periodeId)
    .order("urutan");
  return (ambil(data, error, "Gagal memuat penanda tangan") ?? []) as unknown as PenandaTangan[];
}
