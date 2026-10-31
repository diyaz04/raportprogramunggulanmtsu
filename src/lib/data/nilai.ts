import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getIndikatorProgram, type Indikator, type TemplateDeskripsi, type PredikatKode } from "@/lib/data/indikator";
import { getPesertaProgram, type PesertaProgram } from "@/lib/data/program";

export type NilaiSel = { nilai: number; capaian_override: string | null; capaian_override_terjemahan: string | null };

export type BarisNilai = PesertaProgram & { nilai: Record<string, NilaiSel | undefined> };

export type KolomIndikator = Indikator & { template: Record<PredikatKode, TemplateDeskripsi | undefined> };

function ambil<T>(data: T | null, error: { message: string } | null, konteks: string): T {
  if (error) throw new Error(`${konteks}: ${error.message}`);
  return data as T;
}

/** Grid input nilai: baris = peserta, kolom = indikator aktif. Bisa difilter per tingkatan kelas (7, 8, 9). */
export async function getGridNilai(
  programId: string,
  periodeId: string,
  tingkatFilter?: number | null,
): Promise<{ baris: BarisNilai[]; kolom: KolomIndikator[] }> {
  const [semuaPeserta, indikatorSemua] = await Promise.all([
    getPesertaProgram(programId, periodeId),
    getIndikatorProgram(programId, periodeId),
  ]);

  const peserta = tingkatFilter
    ? semuaPeserta.filter((p) => p.kelas_tingkat === tingkatFilter)
    : semuaPeserta;

  const indikator = indikatorSemua.filter(
    (i) => i.aktif && (tingkatFilter ? i.tingkat === null || i.tingkat === tingkatFilter : true),
  );

  const supabase = await createClient();
  const [{ data: templateRows, error: et }, { data: nilaiRows, error: en }] = await Promise.all([
    indikator.length > 0
      ? supabase
          .from("template_deskripsi")
          .select("indikator_id, predikat_kode, teks, teks_terjemahan")
          .in("indikator_id", indikator.map((i) => i.id))
      : Promise.resolve({ data: [], error: null }),
    peserta.length > 0 && indikator.length > 0
      ? supabase
          .from("nilai")
          .select("peserta_program_id, indikator_id, nilai, capaian_override, capaian_override_terjemahan")
          .in("peserta_program_id", peserta.map((p) => p.id))
          .in("indikator_id", indikator.map((i) => i.id))
      : Promise.resolve({ data: [], error: null }),
  ]);
  const templates = (ambil(templateRows, et, "Gagal memuat template") ?? []) as (TemplateDeskripsi & {
    indikator_id: string;
  })[];
  const nilai = (ambil(nilaiRows, en, "Gagal memuat nilai") ?? []) as (NilaiSel & {
    peserta_program_id: string;
    indikator_id: string;
  })[];

  const templatePerIndikator = new Map<string, Record<PredikatKode, TemplateDeskripsi | undefined>>();
  for (const i of indikator) templatePerIndikator.set(i.id, {} as Record<PredikatKode, TemplateDeskripsi | undefined>);
  for (const t of templates) {
    const map = templatePerIndikator.get(t.indikator_id);
    if (map) map[t.predikat_kode] = t;
  }

  const nilaiPerPeserta = new Map<string, Record<string, NilaiSel>>();
  for (const n of nilai) {
    const map = nilaiPerPeserta.get(n.peserta_program_id) ?? {};
    map[n.indikator_id] = { nilai: n.nilai, capaian_override: n.capaian_override, capaian_override_terjemahan: n.capaian_override_terjemahan };
    nilaiPerPeserta.set(n.peserta_program_id, map);
  }

  return {
    baris: peserta.map((p) => ({ ...p, nilai: nilaiPerPeserta.get(p.id) ?? {} })),
    kolom: indikator.map((i) => ({ ...i, template: templatePerIndikator.get(i.id)! })),
  };
}

/** Batasi baris ke kelompok yang diizinkan (hasil `getKelompokIzinGuru`) — dipakai di halaman grid, unduh, dan import. */
export function filterBarisKelompok<T extends { kelompok_id: string | null }>(baris: T[], kelompokIzin: "semua" | string[]): T[] {
  return kelompokIzin === "semua" ? baris : baris.filter((b) => b.kelompok_id !== null && kelompokIzin.includes(b.kelompok_id));
}
