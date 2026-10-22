"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { gagal, pesanError, sukses, type ActionState } from "@/lib/action";
import { requireRole } from "@/lib/auth";
import { getPeriodeAktif } from "@/lib/data/master";
import { deteksiTingkatKelas, parseSiswaSheet } from "@/lib/siswa-import";
import { siswaSchema } from "@/lib/siswa-schema";
import { createClient } from "@/lib/supabase/server";

const MAKS_UKURAN = 2 * 1024 * 1024; // 2 MB
const CHUNK = 200;

export async function simpanSiswa(id: string | null, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");

  const parsed = siswaSchema.safeParse({
    nis: String(formData.get("nis") ?? ""),
    nisn: String(formData.get("nisn") ?? ""),
    nama: String(formData.get("nama") ?? ""),
    jk: formData.get("jk"),
    nama_arab: String(formData.get("nama_arab") ?? ""),
  });
  if (!parsed.success) return gagal(parsed.error.issues[0].message);

  const supabase = await createClient();
  const { error } = id
    ? await supabase
        .from("siswa")
        .update({ ...parsed.data, aktif: formData.get("aktif") !== "0" })
        .eq("id", id)
    : await supabase.from("siswa").insert(parsed.data);

  if (error) return gagal(pesanError(error, { duplikat: "NIS atau NISN tersebut sudah dipakai siswa lain." }));

  revalidatePath("/master", "layout");
  return sukses();
}

export async function hapusSiswa(id: string, _prev: ActionState): Promise<ActionState> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("siswa").delete().eq("id", id);
  if (error) return gagal(pesanError(error));

  revalidatePath("/master", "layout");
  return sukses("Siswa dihapus");
}

// ===== Import Excel =====

export async function importSiswa(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole("admin");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return gagal("Pilih file Excel (.xlsx) terlebih dahulu");
  if (!file.name.toLowerCase().endsWith(".xlsx")) return gagal("Format file harus .xlsx");
  if (file.size > MAKS_UKURAN) return gagal("Ukuran file maksimal 2 MB");

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    return gagal("File tidak bisa dibaca. Pastikan itu file .xlsx yang valid.");
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) return gagal("File Excel kosong");

  const hasil = parseSiswaSheet(sheet);
  if (hasil.fatal) return gagal(hasil.fatal);

  const { baris, galat, adaKolomKelas } = hasil;
  if (galat.length > 0) {
    return gagal(`Import dibatalkan: ${galat.length} baris bermasalah. Tidak ada data yang disimpan.`, galat.slice(0, 20));
  }
  if (baris.length === 0) return gagal("Tidak ada baris data yang ditemukan di file");

  const supabase = await createClient();

  // Hitung siswa baru vs yang diperbarui.
  const daftarNis = baris.map((b) => b.data.nis);
  const sudahAda = new Set<string>();
  for (let i = 0; i < daftarNis.length; i += CHUNK) {
    const { data, error } = await supabase.from("siswa").select("nis").in("nis", daftarNis.slice(i, i + CHUNK));
    if (error) return gagal(pesanError(error));
    data?.forEach((d) => sudahAda.add(d.nis));
  }

  for (let i = 0; i < baris.length; i += CHUNK) {
    const { error } = await supabase
      .from("siswa")
      .upsert(
        baris.slice(i, i + CHUNK).map((b) => b.data),
        { onConflict: "nis" },
      );
    if (error) {
      return gagal(pesanError(error, { duplikat: "Ada NISN yang sudah dipakai siswa lain. Periksa kolom NISN." }));
    }
  }

  // Penempatan kelas (opsional) pada periode aktif.
  const peringatan: string[] = [];

  if (adaKolomKelas) {
    const aktif = await getPeriodeAktif();
    if (!aktif) {
      peringatan.push("kolom Kelas diabaikan karena belum ada periode aktif");
    } else {
      const { data: kelasList, error: ke } = await supabase.from("kelas").select("id, nama").eq("periode_id", aktif.id);
      if (ke) return gagal(pesanError(ke));
      const idKelas = new Map((kelasList ?? []).map((k) => [k.nama.toLowerCase(), k.id]));

      const idSiswa = new Map<string, string>();
      for (let i = 0; i < daftarNis.length; i += CHUNK) {
        const { data, error } = await supabase.from("siswa").select("id, nis").in("nis", daftarNis.slice(i, i + CHUNK));
        if (error) return gagal(pesanError(error));
        data?.forEach((d) => idSiswa.set(d.nis, d.id));
      }

      const kelasBaru = new Set<string>();
      const kelasTakDikenali = new Set<string>();
      const penempatan: { periode_id: string; kelas_id: string; siswa_id: string }[] = [];

      for (const b of baris) {
        if (!b.kelas) continue;

        let kelasId = idKelas.get(b.kelas.toLowerCase());
        if (!kelasId) {
          // Kelas belum ada di periode aktif -> coba tebak tingkat dari namanya lalu buat otomatis.
          const tingkat = deteksiTingkatKelas(b.kelas);
          if (tingkat === null) {
            kelasTakDikenali.add(b.kelas);
            continue;
          }
          const { data: dibuat, error: be } = await supabase
            .from("kelas")
            .insert({ periode_id: aktif.id, nama: b.kelas, tingkat })
            .select("id")
            .single();
          if (be) return gagal(pesanError(be, { duplikat: `Nama kelas "${b.kelas}" sudah ada di periode ini.` }));
          kelasId = dibuat.id;
          idKelas.set(b.kelas.toLowerCase(), kelasId);
          kelasBaru.add(b.kelas);
        }

        const siswaId = idSiswa.get(b.data.nis);
        if (siswaId) penempatan.push({ periode_id: aktif.id, kelas_id: kelasId, siswa_id: siswaId });
      }

      for (let i = 0; i < penempatan.length; i += CHUNK) {
        const { error } = await supabase
          .from("kelas_siswa")
          .upsert(penempatan.slice(i, i + CHUNK), { onConflict: "periode_id,siswa_id" });
        if (error) return gagal(pesanError(error));
      }
      if (kelasBaru.size > 0) {
        peringatan.push(`kelas baru dibuat otomatis: ${[...kelasBaru].join(", ")}`);
      }
      if (kelasTakDikenali.size > 0) {
        peringatan.push(
          `nama kelas tidak dikenali (harus diawali VII/VIII/IX atau 7/8/9): ${[...kelasTakDikenali].join(", ")} — siswa tetap diimpor tanpa kelas`,
        );
      }
    }
  }

  const baru = baris.filter((b) => !sudahAda.has(b.data.nis)).length;
  const diperbarui = baris.length - baru;
  revalidatePath("/master", "layout");

  return sukses(
    `${baru} siswa baru, ${diperbarui} diperbarui.${peringatan.length ? ` Catatan: ${peringatan.join("; ")}.` : ""}`,
  );
}
