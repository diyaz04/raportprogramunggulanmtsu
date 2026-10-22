"use server";

import { revalidatePath } from "next/cache";
import ExcelJS from "exceljs";
import { z } from "zod";
import { gagal, pesanError, sukses, type ActionState } from "@/lib/action";
import { getCurrentUser, requireNilaiPeserta } from "@/lib/auth";
import { getIndikatorProgram } from "@/lib/data/indikator";
import { filterBarisKelompok } from "@/lib/data/nilai";
import { parseNilaiSheet } from "@/lib/nilai-import";
import { getKelompokIzinGuru, getPesertaProgram } from "@/lib/data/program";
import { createClient } from "@/lib/supabase/server";

const nilaiSchema = z.coerce.number().int().min(0, "Nilai 0-100").max(100, "Nilai 0-100");
const MAKS_UKURAN_IMPORT = 2 * 1024 * 1024; // 2 MB

export async function simpanNilai(
  pesertaProgramId: string,
  indikatorId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireNilaiPeserta(pesertaProgramId);

  const parsed = nilaiSchema.safeParse(formData.get("nilai"));
  if (!parsed.success) return gagal(parsed.error.issues[0].message);

  const supabase = await createClient();
  const { error } = await supabase
    .from("nilai")
    .upsert(
      { peserta_program_id: pesertaProgramId, indikator_id: indikatorId, nilai: parsed.data },
      { onConflict: "peserta_program_id,indikator_id" },
    );
  if (error) return gagal(pesanError(error));

  revalidatePath("/nilai", "layout");
  return sukses();
}

// ===== Import Excel =====
const CHUNK = 500;

export async function importNilaiExcel(
  programId: string,
  periodeId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!["admin", "koordinator", "guru"].includes(user.role)) return gagal("Anda tidak punya akses untuk mengimpor nilai.");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return gagal("Pilih file Excel (.xlsx) terlebih dahulu");
  if (!file.name.toLowerCase().endsWith(".xlsx")) return gagal("Format file harus .xlsx");
  if (file.size > MAKS_UKURAN_IMPORT) return gagal("Ukuran file maksimal 2 MB");

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    return gagal("File tidak bisa dibaca. Pastikan itu file .xlsx yang valid.");
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) return gagal("File Excel kosong");

  const [indikatorSemua, kelompokIzin, semuaPeserta] = await Promise.all([
    getIndikatorProgram(programId, periodeId),
    user.role === "guru" ? getKelompokIzinGuru(programId, periodeId, user.id) : Promise.resolve("semua" as const),
    getPesertaProgram(programId, periodeId),
  ]);
  const indikatorAktif = indikatorSemua.filter((i) => i.aktif).map((i) => ({ id: i.id, nama: i.nama }));
  const pesertaDiizinkan = filterBarisKelompok(semuaPeserta, kelompokIzin);
  const idPesertaPerNis = new Map(pesertaDiizinkan.map((p) => [p.siswa.nis, p.id]));

  const hasil = parseNilaiSheet(sheet, indikatorAktif);
  if (hasil.fatal) return gagal(hasil.fatal);
  if (hasil.baris.length === 0) return gagal("Tidak ada baris data yang ditemukan di file");

  const peringatan = [...hasil.peringatan];
  if (hasil.kolomTakDikenali.length > 0) {
    peringatan.push(`kolom tidak dikenali (diabaikan): ${hasil.kolomTakDikenali.join(", ")}`);
  }

  const nisTakDitemukan = new Set<string>();
  const payload: { peserta_program_id: string; indikator_id: string; nilai: number }[] = [];
  for (const b of hasil.baris) {
    const pesertaId = idPesertaPerNis.get(b.nis);
    if (!pesertaId) {
      nisTakDitemukan.add(b.nis);
      continue;
    }
    for (const [indikatorId, nilai] of Object.entries(b.nilai)) {
      payload.push({ peserta_program_id: pesertaId, indikator_id: indikatorId, nilai });
    }
  }
  if (nisTakDitemukan.size > 0) {
    peringatan.push(`NIS tidak ditemukan di program ini (dilewati): ${[...nisTakDitemukan].join(", ")}`);
  }

  if (payload.length === 0) return gagal("Tidak ada nilai valid yang bisa diimpor.", peringatan);

  const supabase = await createClient();
  for (let i = 0; i < payload.length; i += CHUNK) {
    const { error } = await supabase
      .from("nilai")
      .upsert(payload.slice(i, i + CHUNK), { onConflict: "peserta_program_id,indikator_id" });
    if (error) return gagal(pesanError(error), peringatan);
  }

  revalidatePath("/nilai", "layout");
  return sukses(`${payload.length} nilai diimpor/diperbarui.${peringatan.length ? ` Catatan: ${peringatan.slice(0, 10).join("; ")}.` : ""}`);
}
