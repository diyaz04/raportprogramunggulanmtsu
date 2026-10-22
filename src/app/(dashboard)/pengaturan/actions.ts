"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { gagal, pesanError, sukses, type ActionState } from "@/lib/action";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const teks = (maks: number, wajib: boolean, nama: string) => {
  const dasar = z.string().transform((s) => s.replace(/\s+/g, " ").trim());
  return wajib
    ? dasar.pipe(z.string().min(1, `${nama} wajib diisi`).max(maks, `${nama} terlalu panjang`))
    : dasar.pipe(z.string().max(maks, `${nama} terlalu panjang`)).transform((s) => (s === "" ? null : s));
};

const schema = z.object({
  instansi_induk: teks(100, true, "Instansi induk"),
  nama_madrasah: teks(120, true, "Nama madrasah"),
  alamat: teks(200, true, "Alamat"),
  wilayah: teks(200, true, "Kecamatan/Kabupaten"),
  kota: teks(60, true, "Kota"),
  kepala_nama: teks(120, false, "Nama kepala madrasah"),
  kepala_nip: teks(30, false, "NIP kepala madrasah"),
  watermark_teks: teks(150, true, "Teks watermark"),
});

export async function simpanPengaturan(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");

  const parsed = schema.safeParse(
    Object.fromEntries(
      ["instansi_induk", "nama_madrasah", "alamat", "wilayah", "kota", "kepala_nama", "kepala_nip", "watermark_teks"].map((k) => [
        k,
        String(formData.get(k) ?? ""),
      ]),
    ),
  );
  if (!parsed.success) return gagal(parsed.error.issues[0].message);
  const watermark_aktif = formData.get("watermark_aktif") === "1";

  const supabase = await createClient();
  const { error } = await supabase.from("pengaturan").update({ ...parsed.data, watermark_aktif }).eq("id", true);
  if (error) return gagal(pesanError(error));

  revalidatePath("/pengaturan");
  return sukses("Pengaturan disimpan");
}

const FRASE_KONFIRMASI = "reset nilai sekarang";

export async function resetDataPeriode(periodeId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");

  const konfirmasi = String(formData.get("konfirmasi") ?? "").trim().toLowerCase();
  if (konfirmasi !== FRASE_KONFIRMASI) {
    return gagal(`Ketik persis "${FRASE_KONFIRMASI}" (huruf kecil semua) untuk konfirmasi.`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reset_data_periode", { p_periode_id: periodeId });
  if (error) return gagal(pesanError(error));

  const d = data as {
    nilai: number;
    rapor: number;
    kehadiran: number;
    riset_proyek: number;
    tahfidz_hafalan: number;
    prestasi: number;
  };

  revalidatePath("/", "layout");
  return sukses(
    `Data periode direset: ${d.nilai} nilai, ${d.rapor} rapor, ${d.kehadiran} kehadiran, ${d.riset_proyek} proyek riset, ${d.tahfidz_hafalan} hafalan, ${d.prestasi} prestasi dihapus.`,
  );
}

export async function simpanLogo(slot: "kiri" | "kanan", url: string): Promise<ActionState> {
  await requireRole("admin");

  if (slot !== "kiri" && slot !== "kanan") return gagal("Posisi logo tidak valid");

  // Hanya terima URL dari bucket publik milik project ini.
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/pengaturan/`;
  if (!url.startsWith(prefix)) return gagal("URL logo tidak valid");

  const supabase = await createClient();
  const { error } = await supabase
    .from("pengaturan")
    .update(slot === "kiri" ? { logo_kiri_url: url } : { logo_kanan_url: url })
    .eq("id", true);
  if (error) return gagal(pesanError(error));

  revalidatePath("/pengaturan");
  return sukses("Logo disimpan");
}
