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

async function prosesUploadFoto(formData: FormData, userId: string): Promise<string | null | undefined> {
  const hapusFoto = formData.get("hapus_foto") === "1";
  if (hapusFoto) return null;

  // Jika sudah ada URL hasil upload langsung dari browser (client-side upload) atau input URL
  const urlInput = String(formData.get("foto_url") ?? "").trim();
  if (urlInput) return urlInput;

  const file = formData.get("foto_file") as File | null;
  if (file && file.size > 0) {
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      throw new Error("Format foto harus PNG, JPG, WebP, atau GIF");
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("Ukuran file foto maksimal 10 MB");
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `foto-${userId}-${Date.now()}.${ext}`;

    const supabase = adaSecretKey ? createAdminClient() : await createClient();

    const { error: errGuru } = await supabase.storage
      .from("guru")
      .upload(path, file, { contentType: file.type, upsert: true });

    if (errGuru) {
      // Fallback ke bucket 'pengaturan' jika bucket 'guru' belum dibuat di storage
      const { error: errPengaturan } = await supabase.storage
        .from("pengaturan")
        .upload(`guru-${path}`, file, { contentType: file.type, upsert: true });

      if (errPengaturan) {
        throw new Error(`Gagal mengunggah foto: ${errGuru.message}`);
      }
      const { data } = supabase.storage.from("pengaturan").getPublicUrl(`guru-${path}`);
      return data.publicUrl;
    }

    const { data } = supabase.storage.from("guru").getPublicUrl(path);
    return data.publicUrl;
  }

  return undefined;
}

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

  let fotoUrl: string | null | undefined;
  try {
    fotoUrl = await prosesUploadFoto(formData, id);
  } catch (err) {
    return gagal(err instanceof Error ? err.message : "Gagal memproses foto");
  }

  const supabase = await createClient();
  const updatePayload: Record<string, unknown> = { ...parsed.data, aktif };
  if (fotoUrl !== undefined) {
    updatePayload.foto_url = fotoUrl;
  }

  let { error } = await supabase.from("profiles").update(updatePayload).eq("id", id);
  if (error && /foto_url/i.test(error.message)) {
    delete updatePayload.foto_url;
    const retry = await supabase.from("profiles").update(updatePayload).eq("id", id);
    error = retry.error;
    if (!error) {
      revalidatePath("/master/guru");
      revalidatePath("/dashboard");
      return sukses("Profil disimpan (Catatan: jalankan file migrasi SQL agar foto dapat disimpan)");
    }
  }
  if (error) return gagal(pesanError(error));

  revalidatePath("/master/guru");
  revalidatePath("/dashboard");
  return sukses("Profil berhasil diperbarui");
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

  let fotoUrl: string | null | undefined;
  try {
    fotoUrl = await prosesUploadFoto(formData, data.user.id);
  } catch {
    // Foto opsional saat pembuatan akun awal
  }

  // Trigger database sudah membuat profil (nonaktif); lengkapi dan aktifkan.
  const supabase = await createClient();
  const updatePayload: Record<string, unknown> = { ...profil.data, aktif: true };
  if (fotoUrl !== undefined) {
    updatePayload.foto_url = fotoUrl;
  }

  let { error: e2 } = await supabase.from("profiles").update(updatePayload).eq("id", data.user.id);
  if (e2 && /foto_url/i.test(e2.message)) {
    delete updatePayload.foto_url;
    const retry = await supabase.from("profiles").update(updatePayload).eq("id", data.user.id);
    e2 = retry.error;
  }
  if (e2) {
    return gagal(
      `Akun dibuat, tetapi profil belum bisa diaktifkan (${e2.message}). Atur lewat tombol Ubah di daftar.`,
    );
  }

  revalidatePath("/master/guru");
  revalidatePath("/dashboard");
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
