"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { gagal, pesanError, sukses, type ActionState } from "@/lib/action";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const PENGELOLA = ["admin", "koordinator"] as const;

function revalidateProgram() {
  revalidatePath("/program", "layout");
}

const namaKelompokSchema = z.string().trim().min(1, "Nama kelompok wajib diisi").max(50, "Nama kelompok terlalu panjang");

// ===== Kelompok =====
export async function simpanKelompok(
  programId: string,
  periodeId: string,
  id: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(...PENGELOLA);

  const parsed = namaKelompokSchema.safeParse(formData.get("nama"));
  if (!parsed.success) return gagal(parsed.error.issues[0].message);

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("kelompok_program").update({ nama: parsed.data }).eq("id", id)
    : await supabase.from("kelompok_program").insert({ program_id: programId, periode_id: periodeId, nama: parsed.data });

  if (error) return gagal(pesanError(error, { duplikat: "Nama kelompok tersebut sudah ada di program ini." }));

  revalidateProgram();
  return sukses();
}

export async function hapusKelompok(id: string, _prev: ActionState): Promise<ActionState> {
  await requireRole(...PENGELOLA);
  const supabase = await createClient();
  const { error } = await supabase.from("kelompok_program").delete().eq("id", id);
  if (error) return gagal(pesanError(error));

  revalidateProgram();
  return sukses("Kelompok dihapus. Peserta di kelompok ini kembali jadi tanpa kelompok.");
}

// ===== Peserta =====
export async function tambahPeserta(
  programId: string,
  periodeId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(...PENGELOLA);

  const ids = formData.getAll("siswa_id").map(String).filter(Boolean);
  if (ids.length === 0) return gagal("Pilih minimal satu siswa");

  const kelompokRaw = String(formData.get("kelompok_id") ?? "");
  const kelompok_id = kelompokRaw === "" ? null : kelompokRaw;

  const supabase = await createClient();
  const { error } = await supabase
    .from("peserta_program")
    .insert(ids.map((siswa_id) => ({ program_id: programId, periode_id: periodeId, siswa_id, kelompok_id })));

  if (error) {
    return gagal(pesanError(error, { duplikat: "Ada siswa yang sudah terdaftar di program ini. Muat ulang halaman." }));
  }

  revalidateProgram();
  return sukses(`${ids.length} siswa ditambahkan sebagai peserta`);
}

export async function ubahKelompokPeserta(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireRole(...PENGELOLA);

  const kelompokRaw = String(formData.get("kelompok_id") ?? "");
  const kelompok_id = kelompokRaw === "" ? null : kelompokRaw;

  const supabase = await createClient();
  const { error } = await supabase.from("peserta_program").update({ kelompok_id }).eq("id", id);
  if (error) return gagal(pesanError(error));

  revalidateProgram();
  return sukses("Kelompok peserta diperbarui");
}

export async function keluarkanPeserta(id: string, _prev: ActionState): Promise<ActionState> {
  await requireRole(...PENGELOLA);
  const supabase = await createClient();
  const { error } = await supabase.from("peserta_program").delete().eq("id", id);
  if (error) return gagal(pesanError(error));

  revalidateProgram();
  return sukses("Peserta dikeluarkan dari program");
}

// ===== Guru program =====
export async function tambahGuruProgram(
  programId: string,
  periodeId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(...PENGELOLA);

  const guru_id = String(formData.get("guru_id") ?? "");
  if (!guru_id) return gagal("Pilih guru");

  const kelompokRaw = String(formData.get("kelompok_id") ?? "");
  const kelompok_id = kelompokRaw === "" ? null : kelompokRaw;

  const supabase = await createClient();
  const { error } = await supabase
    .from("penugasan_guru")
    .insert({ program_id: programId, periode_id: periodeId, guru_id, kelompok_id });

  if (error) {
    return gagal(pesanError(error, { duplikat: "Guru tersebut sudah ditugaskan ke program/kelompok ini." }));
  }

  revalidateProgram();
  return sukses("Guru ditugaskan ke program");
}

export async function hapusGuruProgram(id: string, _prev: ActionState): Promise<ActionState> {
  await requireRole(...PENGELOLA);
  const supabase = await createClient();
  const { error } = await supabase.from("penugasan_guru").delete().eq("id", id);
  if (error) return gagal(pesanError(error));

  revalidateProgram();
  return sukses("Penugasan guru dihapus");
}

// ===== Penanda tangan (maks 3, urutan 1-3) =====
const labelJabatanSchema = z
  .string()
  .trim()
  .min(1, "Label jabatan wajib diisi")
  .max(50, "Label jabatan terlalu panjang");

export async function tambahPenandaTangan(
  programId: string,
  periodeId: string,
  urutanBerikutnya: number,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRole(...PENGELOLA);

  if (urutanBerikutnya > 3) return gagal("Maksimal 3 penanda tangan per program.");

  const guru_id = String(formData.get("guru_id") ?? "");
  if (!guru_id) return gagal("Pilih guru");

  const label = labelJabatanSchema.safeParse(formData.get("label_jabatan"));
  if (!label.success) return gagal(label.error.issues[0].message);

  const supabase = await createClient();
  const { error } = await supabase.from("penanda_tangan").insert({
    program_id: programId,
    periode_id: periodeId,
    guru_id,
    label_jabatan: label.data,
    urutan: urutanBerikutnya,
  });

  if (error) {
    return gagal(pesanError(error, { duplikat: "Guru tersebut sudah jadi penanda tangan program ini." }));
  }

  revalidateProgram();
  return sukses("Penanda tangan ditambahkan");
}

export async function hapusPenandaTangan(
  programId: string,
  periodeId: string,
  id: string,
  _prev: ActionState,
): Promise<ActionState> {
  await requireRole(...PENGELOLA);
  const supabase = await createClient();

  const { error } = await supabase.from("penanda_tangan").delete().eq("id", id);
  if (error) return gagal(pesanError(error));

  // Rapatkan urutan supaya tidak ada celah (mis. 1,3 jadi 1,2).
  const { data: sisa, error: e2 } = await supabase
    .from("penanda_tangan")
    .select("id, urutan")
    .eq("program_id", programId)
    .eq("periode_id", periodeId)
    .order("urutan");
  if (!e2 && sisa) {
    for (let i = 0; i < sisa.length; i++) {
      if (sisa[i].urutan !== i + 1) {
        await supabase.from("penanda_tangan").update({ urutan: i + 1 }).eq("id", sisa[i].id);
      }
    }
  }

  revalidateProgram();
  return sukses("Penanda tangan dihapus");
}

export async function ubahUrutanPenandaTangan(
  programId: string,
  periodeId: string,
  id: string,
  arah: "naik" | "turun",
  _prev: ActionState,
): Promise<ActionState> {
  await requireRole(...PENGELOLA);
  const supabase = await createClient();

  const { data: daftar, error } = await supabase
    .from("penanda_tangan")
    .select("id, urutan")
    .eq("program_id", programId)
    .eq("periode_id", periodeId)
    .order("urutan");
  if (error) return gagal(pesanError(error));

  const idx = (daftar ?? []).findIndex((d) => d.id === id);
  const idxLawan = arah === "naik" ? idx - 1 : idx + 1;
  if (idx === -1 || idxLawan < 0 || idxLawan >= (daftar?.length ?? 0)) return gagal("Tidak bisa dipindah");

  const a = daftar![idx];
  const b = daftar![idxLawan];

  // Tukar lewat satu statement UPSERT: unique(program, periode, urutan) dicek setelah statement selesai,
  // jadi kedua baris boleh "bertukar" nilai tanpa melalui nilai sementara yang konflik.
  const { error: e1 } = await supabase
    .from("penanda_tangan")
    .upsert([{ id: a.id, urutan: b.urutan }, { id: b.id, urutan: a.urutan }], { onConflict: "id" });
  if (e1) return gagal(pesanError(e1));

  revalidateProgram();
  return sukses();
}
