"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { gagal, pesanError, sukses, type ActionState } from "@/lib/action";
import { requireKelolaPrestasi, requireNilaiPeserta } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function revalidateProgram() {
  revalidatePath("/program", "layout");
}

// ===== Prestasi =====
const prestasiSchema = z.object({
  siswa_id: z.string().min(1, "Pilih siswa"),
  nama_lomba: z.string().trim().min(1, "Nama lomba wajib diisi").max(150),
  tingkat: z.enum(["madrasah", "kabupaten", "provinsi", "nasional"], { error: "Pilih tingkat" }),
  peringkat: z
    .string()
    .trim()
    .max(50)
    .transform((s) => (s === "" ? null : s)),
  tanggal: z
    .string()
    .trim()
    .transform((s) => (s === "" ? null : s)),
});

export async function simpanPrestasi(
  programId: string,
  id: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireKelolaPrestasi(programId);

  const parsed = prestasiSchema.safeParse({
    siswa_id: formData.get("siswa_id"),
    nama_lomba: formData.get("nama_lomba"),
    tingkat: formData.get("tingkat"),
    peringkat: String(formData.get("peringkat") ?? ""),
    tanggal: String(formData.get("tanggal") ?? ""),
  });
  if (!parsed.success) return gagal(parsed.error.issues[0].message);

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("prestasi").update(parsed.data).eq("id", id)
    : await supabase.from("prestasi").insert({ ...parsed.data, program_id: programId });
  if (error) return gagal(pesanError(error));

  revalidateProgram();
  return sukses();
}

export async function hapusPrestasi(programId: string, id: string, _prev: ActionState): Promise<ActionState> {
  await requireKelolaPrestasi(programId);
  const supabase = await createClient();
  const { error } = await supabase.from("prestasi").delete().eq("id", id);
  if (error) return gagal(pesanError(error));

  revalidateProgram();
  return sukses("Prestasi dihapus");
}

// ===== Proyek riset =====
const risetSchema = z.object({
  judul: z
    .string()
    .trim()
    .max(200)
    .transform((s) => (s === "" ? null : s)),
  tahap: z.enum(["proposal", "pengambilan_data", "laporan", "presentasi"], { error: "Pilih tahap" }),
});

export async function simpanRisetProyek(pesertaProgramId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireNilaiPeserta(pesertaProgramId);

  const parsed = risetSchema.safeParse({ judul: String(formData.get("judul") ?? ""), tahap: formData.get("tahap") });
  if (!parsed.success) return gagal(parsed.error.issues[0].message);

  const supabase = await createClient();
  const { error } = await supabase
    .from("riset_proyek")
    .upsert({ peserta_program_id: pesertaProgramId, ...parsed.data }, { onConflict: "peserta_program_id" });
  if (error) return gagal(pesanError(error));

  revalidateProgram();
  return sukses();
}

// ===== Kehadiran =====
const angkaHadirSchema = z.coerce.number().int().min(0, "Tidak boleh negatif").max(366, "Terlalu besar");
const kehadiranSchema = z.object({
  hadir: angkaHadirSchema,
  sakit: angkaHadirSchema,
  izin: angkaHadirSchema,
  alpa: angkaHadirSchema,
});

export async function simpanKehadiran(pesertaProgramId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireNilaiPeserta(pesertaProgramId);

  const parsed = kehadiranSchema.safeParse({
    hadir: formData.get("hadir"),
    sakit: formData.get("sakit"),
    izin: formData.get("izin"),
    alpa: formData.get("alpa"),
  });
  if (!parsed.success) return gagal(parsed.error.issues[0].message);

  const supabase = await createClient();
  const { error } = await supabase
    .from("kehadiran_program")
    .upsert({ peserta_program_id: pesertaProgramId, ...parsed.data }, { onConflict: "peserta_program_id" });
  if (error) return gagal(pesanError(error));

  revalidateProgram();
  return sukses();
}
