"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { gagal, pesanError, sukses, type ActionState } from "@/lib/action";
import { requireRole } from "@/lib/auth";
import { adaSecretKey, createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ROLE = z.enum(["admin", "koordinator", "guru", "kepala"], { error: "Pilih role" });

const profilSchema = z.object({
  nama: z.string().transform((s) => s.replace(/\s+/g, " ").trim()).pipe(z.string().min(1, "Nama wajib diisi").max(100)),
  nip: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().max(30, "NIP terlalu panjang"))
    .transform((s) => (s === "" ? null : s)),
  role: ROLE,
});

const sandiSchema = z.string().min(8, "Kata sandi minimal 8 karakter").max(72, "Kata sandi maksimal 72 karakter");

export async function simpanProfil(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireRole("admin");

  const parsed = profilSchema.safeParse({
    nama: String(formData.get("nama") ?? ""),
    nip: String(formData.get("nip") ?? ""),
    role: formData.get("role"),
  });
  if (!parsed.success) return gagal(parsed.error.issues[0].message);

  const aktif = formData.get("aktif") !== "0";

  // Cegah admin mengunci dirinya sendiri.
  if (id === me.id && (parsed.data.role !== "admin" || !aktif)) {
    return gagal("Anda tidak bisa menurunkan role atau menonaktifkan akun Anda sendiri.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ ...parsed.data, aktif }).eq("id", id);
  if (error) return gagal(pesanError(error));

  revalidatePath("/master/guru");
  return sukses();
}

export async function buatAkun(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");
  if (!adaSecretKey) return gagal("SUPABASE_SECRET_KEY belum diisi di .env.local, jadi akun belum bisa dibuat dari sini.");

  const email = z.email("Format email tidak valid").safeParse(String(formData.get("email") ?? "").trim());
  if (!email.success) return gagal(email.error.issues[0].message);

  const sandi = sandiSchema.safeParse(String(formData.get("password") ?? ""));
  if (!sandi.success) return gagal(sandi.error.issues[0].message);

  const profil = profilSchema.safeParse({
    nama: String(formData.get("nama") ?? ""),
    nip: String(formData.get("nip") ?? ""),
    role: formData.get("role"),
  });
  if (!profil.success) return gagal(profil.error.issues[0].message);

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: email.data,
    password: sandi.data,
    email_confirm: true,
    user_metadata: { nama: profil.data.nama },
  });

  if (error || !data.user) {
    const sudahAda = /already|registered|exists/i.test(error?.message ?? "");
    return gagal(sudahAda ? "Email tersebut sudah terdaftar." : `Gagal membuat akun: ${error?.message ?? "tidak diketahui"}`);
  }

  // Trigger database sudah membuat profil (nonaktif); lengkapi dan aktifkan.
  const supabase = await createClient();
  const { error: e2 } = await supabase.from("profiles").update({ ...profil.data, aktif: true }).eq("id", data.user.id);
  if (e2) {
    return gagal(
      `Akun dibuat, tetapi profil belum bisa diaktifkan (${e2.message}). Atur lewat tombol Ubah di daftar.`,
    );
  }

  revalidatePath("/master/guru");
  return sukses("Akun berhasil dibuat dan diaktifkan");
}

export async function resetSandi(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");
  if (!adaSecretKey) return gagal("SUPABASE_SECRET_KEY belum diisi di .env.local.");

  const sandi = sandiSchema.safeParse(String(formData.get("password") ?? ""));
  if (!sandi.success) return gagal(sandi.error.issues[0].message);

  const { error } = await createAdminClient().auth.admin.updateUserById(id, { password: sandi.data });
  if (error) return gagal(`Gagal mengubah kata sandi: ${error.message}`);

  return sukses("Kata sandi diubah");
}
