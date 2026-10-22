import "server-only";
import { createClient } from "@/lib/supabase/server";

export type QuranSurat = { no: number; nama_latin: string; nama_arab: string; jumlah_ayat: number };
export type QuranJuzSurat = { juz: number; surat_no: number; ayat_awal: number; ayat_akhir: number };

/** Gabungan master data Al-Qur'an: dipakai client buat cascading Juz -> Surat. */
export type SuratDiJuz = QuranJuzSurat & { nama_latin: string; nama_arab: string };

export type HafalanRow = {
  id: string;
  juz: number;
  surat_no: number;
  nama_latin: string;
  nama_arab: string;
  ayat_awal: number;
  ayat_akhir: number;
  nilai: number | null;
  periode_setor_id: string;
  catatan: string | null;
};

function ambil<T>(data: T | null, error: { message: string } | null, konteks: string): T {
  if (error) throw new Error(`${konteks}: ${error.message}`);
  return data as T;
}

/** Seluruh peta juz<->surat (±145 baris) — diambil sekali, cascading Juz->Surat dilakukan di client. */
export async function getSemuaSuratPerJuz(): Promise<SuratDiJuz[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quran_juz_surat")
    .select("juz, surat_no, ayat_awal, ayat_akhir, surat:surat_no(nama_latin, nama_arab)")
    .order("juz")
    .order("ayat_awal");
  const rows = (ambil(data, error, "Gagal memuat master data Al-Qur'an") ?? []) as unknown as {
    juz: number;
    surat_no: number;
    ayat_awal: number;
    ayat_akhir: number;
    surat: { nama_latin: string; nama_arab: string } | null;
  }[];
  return rows.map((r) => ({
    juz: r.juz,
    surat_no: r.surat_no,
    ayat_awal: r.ayat_awal,
    ayat_akhir: r.ayat_akhir,
    nama_latin: r.surat?.nama_latin ?? `Surat ${r.surat_no}`,
    nama_arab: r.surat?.nama_arab ?? "",
  }));
}

export async function getHafalanSiswa(siswaId: string): Promise<HafalanRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tahfidz_hafalan")
    .select("id, juz, surat_no, ayat_awal, ayat_akhir, nilai, periode_setor_id, catatan, surat:surat_no(nama_latin, nama_arab)")
    .eq("siswa_id", siswaId)
    .order("juz")
    .order("ayat_awal");
  const rows = (ambil(data, error, "Gagal memuat hafalan") ?? []) as unknown as {
    id: string;
    juz: number;
    surat_no: number;
    ayat_awal: number;
    ayat_akhir: number;
    nilai: number | null;
    periode_setor_id: string;
    catatan: string | null;
    surat: { nama_latin: string; nama_arab: string } | null;
  }[];
  return rows.map((r) => ({ ...r, nama_latin: r.surat?.nama_latin ?? `Surat ${r.surat_no}`, nama_arab: r.surat?.nama_arab ?? "" }));
}

/** Rekap kumulatif: jumlah juz (penuh/sebagian), jumlah surat, total ayat, rata-rata nilai. */
export function hitungRekapHafalan(baris: HafalanRow[], semuaSuratPerJuz: SuratDiJuz[]) {
  const jumlahSurat = baris.length;
  const totalAyat = baris.reduce((t, b) => t + (b.ayat_akhir - b.ayat_awal + 1), 0);
  const dinilai = baris.filter((b) => b.nilai != null);
  const rataRata = dinilai.length > 0 ? Math.round(dinilai.reduce((t, b) => t + (b.nilai ?? 0), 0) / dinilai.length) : null;

  const suratPerJuzUtuh = new Map<number, number>();
  for (const s of semuaSuratPerJuz) suratPerJuzUtuh.set(s.juz, (suratPerJuzUtuh.get(s.juz) ?? 0) + 1);
  const dicatatPerJuz = new Map<number, number>();
  for (const b of baris) dicatatPerJuz.set(b.juz, (dicatatPerJuz.get(b.juz) ?? 0) + 1);

  let juzPenuh = 0;
  let juzSebagian = 0;
  for (const [juz, jumlah] of dicatatPerJuz) {
    if (jumlah >= (suratPerJuzUtuh.get(juz) ?? Infinity)) juzPenuh++;
    else juzSebagian++;
  }

  return { juzPenuh, juzSebagian, jumlahSurat, totalAyat, rataRata };
}
