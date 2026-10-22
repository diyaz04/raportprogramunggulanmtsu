"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { gagal, pesanError, sukses, type ActionState } from "@/lib/action";
import { bisaNilaiPeserta, getCurrentUser } from "@/lib/auth";
import { getPesertaProgram } from "@/lib/data/program";
import { rakitDataRapor } from "@/lib/data/rapor";
import { createClient } from "@/lib/supabase/server";

function revalidateRapor() {
  revalidatePath("/rapor", "layout");
}

async function ambilStatus(pesertaProgramId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("rapor").select("status").eq("peserta_program_id", pesertaProgramId).maybeSingle();
  return data?.status ?? null;
}

/** Hitung ulang nilai akhir, predikat, dan draf Catatan Guru Program — dari data terkini. */
export async function buatUlangDraf(pesertaProgramId: string, _prev: ActionState): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!(await bisaNilaiPeserta(user, pesertaProgramId))) return gagal("Anda tidak punya akses ke peserta ini.");

  const status = await ambilStatus(pesertaProgramId);
  if (status && status !== "draft" && status !== "review" && user.role !== "admin") {
    return gagal("Rapor sudah disetujui/terkunci. Hubungi admin untuk membuka kembali.");
  }

  const data = await rakitDataRapor(pesertaProgramId);
  if (!data) return gagal("Peserta tidak ditemukan.");

  const supabase = await createClient();
  const { error } = await supabase.from("rapor").upsert(
    {
      peserta_program_id: pesertaProgramId,
      nilai_akhir: data.nilai_akhir,
      predikat: data.predikat,
      catatan_auto: data.catatan_auto,
      catatan_auto_terjemahan: data.catatan_auto_terjemahan,
    },
    { onConflict: "peserta_program_id" },
  );
  if (error) return gagal(pesanError(error));

  revalidateRapor();
  return sukses("Nilai akhir & draf deskripsi dihitung ulang");
}

const catatanSchema = z.object({
  catatan_final: z
    .string()
    .trim()
    .max(2000)
    .transform((s) => (s === "" ? null : s)),
  catatan_final_terjemahan: z
    .string()
    .trim()
    .max(2000)
    .transform((s) => (s === "" ? null : s)),
});

export async function simpanCatatanFinal(pesertaProgramId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!(await bisaNilaiPeserta(user, pesertaProgramId))) return gagal("Anda tidak punya akses ke peserta ini.");

  const status = await ambilStatus(pesertaProgramId);
  if (status && status !== "draft" && status !== "review" && user.role !== "admin") {
    return gagal("Rapor sudah disetujui/terkunci.");
  }

  const parsed = catatanSchema.safeParse({
    catatan_final: String(formData.get("catatan_final") ?? ""),
    catatan_final_terjemahan: String(formData.get("catatan_final_terjemahan") ?? ""),
  });
  if (!parsed.success) return gagal(parsed.error.issues[0].message);

  const supabase = await createClient();
  const { error } = await supabase
    .from("rapor")
    .upsert({ peserta_program_id: pesertaProgramId, ...parsed.data, diedit_manual: true }, { onConflict: "peserta_program_id" });
  if (error) return gagal(pesanError(error));

  revalidateRapor();
  return sukses("Catatan disimpan");
}

export async function ajukanReview(pesertaProgramId: string, _prev: ActionState): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!(await bisaNilaiPeserta(user, pesertaProgramId))) return gagal("Anda tidak punya akses ke peserta ini.");

  const supabase = await createClient();
  const { data: rapor } = await supabase.from("rapor").select("status, nilai_akhir").eq("peserta_program_id", pesertaProgramId).maybeSingle();
  if (!rapor) return gagal("Hitung nilai akhir dulu sebelum mengajukan.");
  if (rapor.status !== "draft") return gagal("Rapor ini sudah diajukan/diproses.");
  if (rapor.nilai_akhir == null) return gagal("Nilai akhir belum lengkap, belum bisa diajukan.");

  const { error } = await supabase.from("rapor").update({ status: "review" }).eq("peserta_program_id", pesertaProgramId);
  if (error) return gagal(pesanError(error));

  revalidateRapor();
  return sukses("Rapor diajukan untuk ditinjau");
}

export async function setujuiRapor(pesertaProgramId: string, _prev: ActionState): Promise<ActionState> {
  const user = await getCurrentUser();
  if (user.role !== "admin" && user.role !== "koordinator" && user.role !== "kepala") return gagal("Anda tidak punya akses untuk menyetujui.");

  const supabase = await createClient();
  const { data: rapor } = await supabase.from("rapor").select("status").eq("peserta_program_id", pesertaProgramId).maybeSingle();
  if (!rapor || rapor.status !== "review") return gagal("Rapor ini belum diajukan untuk ditinjau.");

  const { error } = await supabase
    .from("rapor")
    .update({ status: "disetujui", disetujui_oleh: user.id })
    .eq("peserta_program_id", pesertaProgramId);
  if (error) return gagal(pesanError(error));

  revalidateRapor();
  return sukses("Rapor disetujui");
}

export async function kunciRapor(pesertaProgramId: string, _prev: ActionState): Promise<ActionState> {
  const user = await getCurrentUser();
  if (user.role !== "admin" && user.role !== "koordinator" && user.role !== "kepala") return gagal("Anda tidak punya akses untuk mengunci.");

  const supabase = await createClient();
  const { data: rapor } = await supabase.from("rapor").select("status").eq("peserta_program_id", pesertaProgramId).maybeSingle();
  if (!rapor || rapor.status !== "disetujui") return gagal("Rapor harus disetujui dulu sebelum dikunci.");

  const data = await rakitDataRapor(pesertaProgramId);
  if (!data) return gagal("Peserta tidak ditemukan.");

  const kodeVerifikasi = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const { error } = await supabase
    .from("rapor")
    .update({
      status: "terkunci",
      snapshot: data,
      kode_verifikasi: kodeVerifikasi,
      dikunci_oleh: user.id,
      diterbitkan_at: new Date().toISOString(),
    })
    .eq("peserta_program_id", pesertaProgramId);
  if (error) return gagal(pesanError(error));

  revalidateRapor();
  return sukses("Rapor dikunci dan diterbitkan");
}

/**
 * Khusus admin: buat semua peserta program+periode ini yang BELUM terkunci, hitung ulang nilai
 * akhir, validasi kelengkapan nilai, lalu langsung kunci & terbitkan (melompati review/disetujui
 * satu per satu — admin memang punya wewenang penuh di tiap status, lihat RLS `rapor`).
 * Rapor yang SUDAH terkunci tidak disentuh (dokumen final dianggap tidak boleh diubah diam-diam).
 */
export async function prosesMassalKunci(programId: string, periodeId: string, _prev: ActionState): Promise<ActionState> {
  const user = await getCurrentUser();
  if (user.role !== "admin") return gagal("Hanya admin yang bisa memproses rapor secara massal.");

  const supabase = await createClient();
  const peserta = await getPesertaProgram(programId, periodeId);
  if (peserta.length === 0) return gagal("Belum ada peserta di program ini.");

  const { data: raporSemua } = await supabase
    .from("rapor")
    .select("peserta_program_id, status")
    .in("peserta_program_id", peserta.map((p) => p.id));
  const statusPerPeserta = new Map((raporSemua ?? []).map((r) => [r.peserta_program_id, r.status]));

  let dikunci = 0;
  let dilewatiTidakLengkap = 0;
  let sudahTerkunci = 0;
  const gagalDiproses: string[] = [];

  for (const p of peserta) {
    if (statusPerPeserta.get(p.id) === "terkunci") {
      sudahTerkunci++;
      continue;
    }

    const data = await rakitDataRapor(p.id);
    if (!data) continue;

    const lengkap = data.indikator.length > 0 && data.indikator.every((i) => i.nilai != null);
    if (!lengkap) {
      dilewatiTidakLengkap++;
      continue;
    }

    const kodeVerifikasi = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    const { error } = await supabase.from("rapor").upsert(
      {
        peserta_program_id: p.id,
        nilai_akhir: data.nilai_akhir,
        predikat: data.predikat,
        catatan_auto: data.catatan_auto,
        catatan_auto_terjemahan: data.catatan_auto_terjemahan,
        status: "terkunci",
        snapshot: data,
        kode_verifikasi: kodeVerifikasi,
        disetujui_oleh: user.id,
        dikunci_oleh: user.id,
        diterbitkan_at: new Date().toISOString(),
      },
      { onConflict: "peserta_program_id" },
    );
    if (error) gagalDiproses.push(p.siswa.nama);
    else dikunci++;
  }

  revalidateRapor();
  return sukses(
    `${dikunci} rapor dikunci & diterbitkan. ${dilewatiTidakLengkap} dilewati (nilai belum lengkap). ${sudahTerkunci} sudah terkunci sebelumnya.${
      gagalDiproses.length ? ` Gagal: ${gagalDiproses.join(", ")}.` : ""
    }`,
  );
}

export async function bukaKembaliRapor(pesertaProgramId: string, _prev: ActionState): Promise<ActionState> {
  const user = await getCurrentUser();
  if (user.role !== "admin") return gagal("Hanya admin yang bisa membuka kembali rapor.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("rapor")
    .update({ status: "draft", snapshot: null, kode_verifikasi: null, diterbitkan_at: null })
    .eq("peserta_program_id", pesertaProgramId);
  if (error) return gagal(pesanError(error));

  revalidateRapor();
  return sukses("Rapor dibuka kembali ke status draft");
}
