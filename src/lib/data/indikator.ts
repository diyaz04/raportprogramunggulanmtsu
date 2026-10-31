import "server-only";
import { createClient } from "@/lib/supabase/server";

export type PredikatKode = "A" | "B" | "C" | "D" | "SARAN";
export const PREDIKAT_KODE: PredikatKode[] = ["A", "B", "C", "D", "SARAN"];

export type Indikator = {
  id: string;
  program_id: string;
  periode_id: string;
  tingkat: number | null;
  nama: string;
  nama_terjemahan: string | null;
  nama_arab: string | null;
  keterangan: string | null;
  bobot: number;
  urutan: number;
  aktif: boolean;
};

export type TemplateDeskripsi = { predikat_kode: PredikatKode; teks: string | null; teks_terjemahan: string | null };

export type IndikatorDenganTemplate = Indikator & { template: Record<PredikatKode, TemplateDeskripsi | undefined> };

export type SkalaPredikat = {
  kode: "A" | "B" | "C" | "D";
  min: number;
  max: number;
  label: string;
  label_en: string;
  label_ar: string;
};

function ambil<T>(data: T | null, error: { message: string } | null, konteks: string): T {
  if (error) throw new Error(`${konteks}: ${error.message}`);
  return data as T;
}

export async function getSkalaPredikatGlobal(): Promise<SkalaPredikat[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("skala_predikat")
    .select("kode, min, max, label, label_en, label_ar")
    .is("program_id", null)
    .order("kode");
  return (ambil(data, error, "Gagal memuat skala predikat") ?? []) as SkalaPredikat[];
}

export async function getIndikatorProgram(programId: string, periodeId: string): Promise<Indikator[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("indikator")
    .select("id, program_id, periode_id, tingkat, nama, nama_terjemahan, nama_arab, keterangan, bobot, urutan, aktif")
    .eq("program_id", programId)
    .eq("periode_id", periodeId)
    .order("urutan");
  return ambil(data, error, "Gagal memuat indikator") ?? [];
}

/** Indikator program ini + template deskripsinya, untuk halaman /template. */
export async function getIndikatorDenganTemplate(programId: string, periodeId: string): Promise<IndikatorDenganTemplate[]> {
  const indikator = await getIndikatorProgram(programId, periodeId);
  if (indikator.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("template_deskripsi")
    .select("indikator_id, predikat_kode, teks, teks_terjemahan")
    .in("indikator_id", indikator.map((i) => i.id));
  const rows = (ambil(data, error, "Gagal memuat template") ?? []) as (TemplateDeskripsi & { indikator_id: string })[];

  const perIndikator = new Map<string, Record<PredikatKode, TemplateDeskripsi | undefined>>();
  for (const i of indikator) perIndikator.set(i.id, {} as Record<PredikatKode, TemplateDeskripsi | undefined>);
  for (const r of rows) {
    const map = perIndikator.get(r.indikator_id);
    if (map) map[r.predikat_kode] = r;
  }

  return indikator.map((i) => ({ ...i, template: perIndikator.get(i.id)! }));
}

/** Periode lain (selain periodeId saat ini) yang paling baru punya indikator untuk program ini. */
export async function getPeriodeSumberIndikator(
  programId: string,
  periodeIdSaatIni: string,
): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("indikator")
    .select("periode_id, periode:periode_id(tahun_ajaran, semester)")
    .eq("program_id", programId)
    .neq("periode_id", periodeIdSaatIni);
  const rows = (ambil(data, error, "Gagal memuat riwayat indikator") ?? []) as unknown as {
    periode_id: string;
    periode: { tahun_ajaran: string; semester: string } | null;
  }[];
  if (rows.length === 0) return null;

  const unik = new Map(rows.map((r) => [r.periode_id, r.periode]));
  const terbaru = [...unik.entries()].sort((a, b) => {
    const ka = `${a[1]?.tahun_ajaran ?? ""}${a[1]?.semester ?? ""}`;
    const kb = `${b[1]?.tahun_ajaran ?? ""}${b[1]?.semester ?? ""}`;
    return kb.localeCompare(ka);
  })[0];

  return terbaru ? { id: terbaru[0] } : null;
}
