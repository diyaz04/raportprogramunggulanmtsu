"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { gagal, pesanError, sukses, type ActionState } from "@/lib/action";
import { requireKelolaTahfidz } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function revalidateTahfidz() {
  revalidatePath("/tahfidz/hafalan", "layout");
}

const nilaiOpsional = z
  .string()
  .trim()
  .transform((s) => (s === "" ? null : Number(s)))
  .pipe(z.number().int().min(0).max(100).nullable());

const hafalanSchema = z.object({
  juz: z.coerce.number().int().min(1).max(30),
  surat_no: z.coerce.number().int().min(1).max(114),
  ayat_awal: z.coerce.number().int().min(1),
  ayat_akhir: z.coerce.number().int().min(1),
  nilai: nilaiOpsional,
  catatan: z
    .string()
    .trim()
    .max(300)
    .transform((s) => (s === "" ? null : s)),
});

/** Tambah 1 surat. Kalau (siswa, juz, surat) sudah ada, dianggap muraja'ah: update nilai/rentang
 * TANPA mengubah `periode_setor_id` (supaya tanda "(baru)" tetap menunjuk setoran pertama). */
export async function tambahHafalan(
  siswaId: string,
  periodeSetorId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireKelolaTahfidz(siswaId);

  const parsed = hafalanSchema.safeParse({
    juz: formData.get("juz"),
    surat_no: formData.get("surat_no"),
    ayat_awal: formData.get("ayat_awal"),
    ayat_akhir: formData.get("ayat_akhir"),
    nilai: String(formData.get("nilai") ?? ""),
    catatan: String(formData.get("catatan") ?? ""),
  });
  if (!parsed.success) return gagal(parsed.error.issues[0].message);
  if (parsed.data.ayat_akhir < parsed.data.ayat_awal) return gagal("Ayat akhir harus >= ayat awal");

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("tahfidz_hafalan")
    .select("id")
    .eq("siswa_id", siswaId)
    .eq("juz", parsed.data.juz)
    .eq("surat_no", parsed.data.surat_no)
    .maybeSingle();

  const { ayat_awal, ayat_akhir, nilai, catatan } = parsed.data;
  const { error } = existing
    ? await supabase.from("tahfidz_hafalan").update({ ayat_awal, ayat_akhir, nilai, catatan }).eq("id", existing.id)
    : await supabase.from("tahfidz_hafalan").insert({
        siswa_id: siswaId,
        ...parsed.data,
        periode_setor_id: periodeSetorId,
      });
  if (error) return gagal(pesanError(error));

  revalidateTahfidz();
  return sukses(existing ? "Hafalan diperbarui (muraja'ah)" : "Hafalan ditambahkan");
}

/**
 * Tandai 1 juz sekaligus sebagai hafal: surat yang belum tercatat ditambahkan (ayat penuh),
 * surat yang sudah tercatat tapi belum dinilai ikut diisi. Kalau `nilaiSeragam` dikosongkan,
 * nilainya dibiarkan kosong seperti sebelumnya (guru tinggal menilai satu per satu / per surat).
 */
export async function tambahJuzPenuh(
  siswaId: string,
  periodeSetorId: string,
  juz: number,
  nilaiSeragam: number | null,
  _prev: ActionState,
): Promise<ActionState> {
  await requireKelolaTahfidz(siswaId);

  if (nilaiSeragam !== null && (!Number.isInteger(nilaiSeragam) || nilaiSeragam < 0 || nilaiSeragam > 100)) {
    return gagal("Nilai seragam harus angka bulat 0-100");
  }

  const supabase = await createClient();
  const [{ data: suratJuz, error: e1 }, { data: sudahAda, error: e2 }] = await Promise.all([
    supabase.from("quran_juz_surat").select("surat_no, ayat_awal, ayat_akhir").eq("juz", juz),
    supabase.from("tahfidz_hafalan").select("id, surat_no, nilai").eq("siswa_id", siswaId).eq("juz", juz),
  ]);
  if (e1) return gagal(pesanError(e1));
  if (e2) return gagal(pesanError(e2));

  const petaSudahAda = new Map((sudahAda ?? []).map((r) => [r.surat_no, r]));
  const baru = (suratJuz ?? []).filter((s) => !petaSudahAda.has(s.surat_no));

  if (baru.length > 0) {
    const { error } = await supabase.from("tahfidz_hafalan").insert(
      baru.map((s) => ({
        siswa_id: siswaId,
        juz,
        surat_no: s.surat_no,
        ayat_awal: s.ayat_awal,
        ayat_akhir: s.ayat_akhir,
        nilai: nilaiSeragam,
        periode_setor_id: periodeSetorId,
      })),
    );
    if (error) return gagal(pesanError(error));
  }

  // Surat yang sudah tercatat tapi belum punya nilai ikut diisi nilai seragam (kalau diminta).
  let diperbarui = 0;
  if (nilaiSeragam !== null) {
    const idBelumDinilai = (sudahAda ?? []).filter((r) => r.nilai == null).map((r) => r.id);
    if (idBelumDinilai.length > 0) {
      const { error } = await supabase.from("tahfidz_hafalan").update({ nilai: nilaiSeragam }).in("id", idBelumDinilai);
      if (error) return gagal(pesanError(error));
      diperbarui = idBelumDinilai.length;
    }
  }

  if (baru.length === 0 && diperbarui === 0) return gagal("Semua surat di juz ini sudah tercatat dan sudah ada nilainya.");

  revalidateTahfidz();
  const bagian: string[] = [];
  if (baru.length > 0) bagian.push(`${baru.length} surat ditambahkan`);
  if (diperbarui > 0) bagian.push(`${diperbarui} surat diisi nilainya`);
  return sukses(`Juz ${juz}: ${bagian.join(", ")}${nilaiSeragam != null ? ` (nilai seragam ${nilaiSeragam})` : ", tinggal diisi nilainya"}.`);
}

const nilaiWajibSchema = z.coerce.number().int().min(0, "Nilai 0-100").max(100, "Nilai 0-100");

export async function ubahNilaiHafalan(siswaId: string, id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireKelolaTahfidz(siswaId);

  const parsed = nilaiWajibSchema.safeParse(formData.get("nilai"));
  if (!parsed.success) return gagal(parsed.error.issues[0].message);

  const supabase = await createClient();
  const { error } = await supabase.from("tahfidz_hafalan").update({ nilai: parsed.data }).eq("id", id);
  if (error) return gagal(pesanError(error));

  revalidateTahfidz();
  return sukses();
}

export async function hapusHafalan(siswaId: string, id: string, _prev: ActionState): Promise<ActionState> {
  await requireKelolaTahfidz(siswaId);
  const supabase = await createClient();
  const { error } = await supabase.from("tahfidz_hafalan").delete().eq("id", id);
  if (error) return gagal(pesanError(error));

  revalidateTahfidz();
  return sukses("Hafalan dihapus");
}
