"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { gagal, pesanError, sukses, type ActionState } from "@/lib/action";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const kelasSchema = z.object({
  nama: z.string().trim().min(1, "Nama kelas wajib diisi").max(30, "Nama kelas terlalu panjang"),
  tingkat: z.coerce.number().int().min(7, "Pilih tingkat").max(9, "Pilih tingkat"),
});

export async function simpanKelas(
  periodeId: string,
  id: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("admin");

  const parsed = kelasSchema.safeParse({ nama: formData.get("nama"), tingkat: formData.get("tingkat") });
  if (!parsed.success) return gagal(parsed.error.issues[0].message);

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("kelas").update(parsed.data).eq("id", id)
    : await supabase.from("kelas").insert({ ...parsed.data, periode_id: periodeId });

  if (error) return gagal(pesanError(error, { duplikat: "Nama kelas tersebut sudah ada di periode ini." }));

  revalidatePath("/master/kelas", "layout");
  return sukses();
}

export async function hapusKelas(id: string, _prev: ActionState): Promise<ActionState> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("kelas").delete().eq("id", id);
  if (error) return gagal(pesanError(error));

  revalidatePath("/master/kelas", "layout");
  return sukses("Kelas dihapus");
}

export async function tambahAnggota(
  kelasId: string,
  periodeId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole("admin");

  const ids = formData.getAll("siswa_id").map(String).filter(Boolean);
  if (ids.length === 0) return gagal("Pilih minimal satu siswa");

  const supabase = await createClient();
  const { error } = await supabase
    .from("kelas_siswa")
    .insert(ids.map((siswa_id) => ({ kelas_id: kelasId, periode_id: periodeId, siswa_id })));

  if (error) {
    return gagal(pesanError(error, { duplikat: "Ada siswa yang sudah punya kelas di periode ini. Muat ulang halaman." }));
  }

  revalidatePath("/master/kelas", "layout");
  return sukses(`${ids.length} siswa ditambahkan ke kelas`);
}

export async function keluarkanAnggota(kelasId: string, siswaId: string, _prev: ActionState): Promise<ActionState> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("kelas_siswa").delete().eq("kelas_id", kelasId).eq("siswa_id", siswaId);
  if (error) return gagal(pesanError(error));

  revalidatePath("/master/kelas", "layout");
  return sukses("Siswa dikeluarkan dari kelas");
}
