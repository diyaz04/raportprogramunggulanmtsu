"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { gagal, pesanError, sukses, type ActionState } from "@/lib/action";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  tahun_ajaran: z
    .string()
    .regex(/^\d{4}\/\d{4}$/, "Format tahun ajaran harus seperti 2026/2027")
    .refine((v) => {
      const [a, b] = v.split("/").map(Number);
      return b === a + 1;
    }, "Tahun kedua harus satu tahun setelah tahun pertama"),
  semester: z.enum(["ganjil", "genap"], { error: "Pilih semester" }),
  tanggal_rapor: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid")
    .nullable(),
});

export async function simpanPeriode(id: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");

  const parsed = schema.safeParse({
    tahun_ajaran: String(formData.get("tahun_ajaran") ?? "").trim(),
    semester: formData.get("semester"),
    tanggal_rapor: String(formData.get("tanggal_rapor") ?? "") || null,
  });
  if (!parsed.success) return gagal(parsed.error.issues[0].message);

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("periode").update(parsed.data).eq("id", id)
    : await supabase.from("periode").insert(parsed.data);

  if (error) {
    return gagal(pesanError(error, { duplikat: "Periode dengan tahun ajaran dan semester tersebut sudah ada." }));
  }

  revalidatePath("/", "layout");
  return sukses();
}

export async function aktifkanPeriode(id: string, _prev: ActionState): Promise<ActionState> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.rpc("aktifkan_periode", { p_id: id });
  if (error) return gagal(pesanError(error));

  revalidatePath("/", "layout");
  return sukses("Periode diaktifkan");
}

export async function hapusPeriode(id: string, _prev: ActionState): Promise<ActionState> {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: periode, error: e1 } = await supabase.from("periode").select("aktif").eq("id", id).maybeSingle();
  if (e1) return gagal(pesanError(e1));
  if (periode?.aktif) return gagal("Periode aktif tidak bisa dihapus. Aktifkan periode lain terlebih dahulu.");

  const { error } = await supabase.from("periode").delete().eq("id", id);
  if (error) return gagal(pesanError(error));

  revalidatePath("/", "layout");
  return sukses("Periode dihapus");
}
