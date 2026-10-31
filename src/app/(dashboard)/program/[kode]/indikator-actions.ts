"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { gagal, pesanError, sukses, type ActionState } from "@/lib/action";
import { requireKelolaProgram } from "@/lib/auth";
import { INDIKATOR_DEFAULT, templateFormulaId } from "@/lib/data/indikator-default";
import { PREDIKAT_KODE, type PredikatKode } from "@/lib/data/indikator";
import { createClient } from "@/lib/supabase/server";

function revalidateProgram() {
  revalidatePath("/program", "layout");
}

const indikatorSchema = z.object({
  nama: z.string().trim().min(1, "Nama indikator wajib diisi").max(100, "Nama terlalu panjang"),
  nama_terjemahan: z
    .string()
    .trim()
    .max(100)
    .transform((s) => (s === "" ? null : s)),
  nama_arab: z
    .string()
    .trim()
    .max(100)
    .transform((s) => (s === "" ? null : s)),
  keterangan: z
    .string()
    .trim()
    .max(300)
    .transform((s) => (s === "" ? null : s)),
  bobot: z.coerce.number().int().min(1, "Bobot minimal 1").max(100, "Bobot maksimal 100"),
  tingkat: z
    .preprocess(
      (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
      z.number().int().min(7, "Tingkat kelas harus 7, 8, atau 9").max(9, "Tingkat kelas harus 7, 8, atau 9").nullable(),
    )
    .optional()
    .transform((v) => (v === undefined ? null : v)),
});

export async function simpanIndikator(
  programId: string,
  periodeId: string,
  id: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireKelolaProgram(programId, periodeId);

  const parsed = indikatorSchema.safeParse({
    nama: formData.get("nama"),
    nama_terjemahan: String(formData.get("nama_terjemahan") ?? ""),
    nama_arab: String(formData.get("nama_arab") ?? ""),
    keterangan: String(formData.get("keterangan") ?? ""),
    bobot: formData.get("bobot"),
    tingkat: formData.get("tingkat"),
  });
  if (!parsed.success) return gagal(parsed.error.issues[0].message);

  const supabase = await createClient();

  if (id) {
    const { error } = await supabase.from("indikator").update(parsed.data).eq("id", id);
    if (error) return gagal(pesanError(error, { duplikat: "Nama indikator tersebut sudah ada di tingkatan kelas ini pada program tersebut." }));
  } else {
    let query = supabase
      .from("indikator")
      .select("id", { count: "exact", head: true })
      .eq("program_id", programId)
      .eq("periode_id", periodeId);

    if (parsed.data.tingkat !== null) {
      query = query.eq("tingkat", parsed.data.tingkat);
    } else {
      query = query.is("tingkat", null);
    }

    const { count } = await query;
    const { error } = await supabase
      .from("indikator")
      .insert({ ...parsed.data, program_id: programId, periode_id: periodeId, urutan: (count ?? 0) + 1 });
    if (error) return gagal(pesanError(error, { duplikat: "Nama indikator tersebut sudah ada di tingkatan kelas ini pada program tersebut." }));
  }

  revalidateProgram();
  return sukses();
}

export async function hapusIndikator(programId: string, periodeId: string, id: string, _prev: ActionState): Promise<ActionState> {
  await requireKelolaProgram(programId, periodeId);
  const supabase = await createClient();
  const { error } = await supabase.from("indikator").delete().eq("id", id);
  if (error) return gagal(pesanError(error));

  revalidateProgram();
  return sukses("Indikator dihapus");
}

export async function ubahAktifIndikator(
  programId: string,
  periodeId: string,
  id: string,
  aktif: boolean,
  _prev: ActionState,
): Promise<ActionState> {
  await requireKelolaProgram(programId, periodeId);
  const supabase = await createClient();
  const { error } = await supabase.from("indikator").update({ aktif }).eq("id", id);
  if (error) return gagal(pesanError(error));

  revalidateProgram();
  return sukses();
}

export async function ubahUrutanIndikator(
  programId: string,
  periodeId: string,
  id: string,
  arah: "naik" | "turun",
  _prev: ActionState,
): Promise<ActionState> {
  await requireKelolaProgram(programId, periodeId);
  const supabase = await createClient();

  // Cari tingkat indikator yang ingin dipindah agar pergeseran urutan hanya terjadi di tingkat yang sama
  const { data: item, error: ei } = await supabase
    .from("indikator")
    .select("id, tingkat")
    .eq("id", id)
    .single();
  if (ei || !item) return gagal("Indikator tidak ditemukan");

  let query = supabase
    .from("indikator")
    .select("id, urutan")
    .eq("program_id", programId)
    .eq("periode_id", periodeId);

  if (item.tingkat !== null) {
    query = query.eq("tingkat", item.tingkat);
  } else {
    query = query.is("tingkat", null);
  }

  const { data: daftar, error } = await query.order("urutan");
  if (error) return gagal(pesanError(error));

  const idx = (daftar ?? []).findIndex((d) => d.id === id);
  const idxLawan = arah === "naik" ? idx - 1 : idx + 1;
  if (idx === -1 || idxLawan < 0 || idxLawan >= (daftar?.length ?? 0)) return gagal("Tidak bisa dipindah");

  const a = daftar![idx];
  const b = daftar![idxLawan];
  const { error: e1 } = await supabase.from("indikator").update({ urutan: b.urutan }).eq("id", a.id);
  if (e1) return gagal(pesanError(e1));
  const { error: e2 } = await supabase.from("indikator").update({ urutan: a.urutan }).eq("id", b.id);
  if (e2) return gagal(pesanError(e2));

  revalidateProgram();
  return sukses();
}

/** Isi indikator bawaan (nilai awal riset) untuk program ini. Hanya untuk periode yang masih kosong. */
export async function isiIndikatorBawaan(programId: string, periodeId: string, _prev: ActionState): Promise<ActionState> {
  await requireKelolaProgram(programId, periodeId);
  const supabase = await createClient();

  const { data: program, error: ep } = await supabase
    .from("program")
    .select("kode, bahasa_utama")
    .eq("id", programId)
    .single();
  if (ep) return gagal(pesanError(ep));

  const seed = INDIKATOR_DEFAULT[program.kode];
  if (!seed) return gagal("Belum ada indikator bawaan untuk program ini.");

  const { count } = await supabase
    .from("indikator")
    .select("id", { count: "exact", head: true })
    .eq("program_id", programId)
    .eq("periode_id", periodeId);
  if (count && count > 0) return gagal("Program ini sudah punya indikator di periode ini.");

  const { data: dibuat, error } = await supabase
    .from("indikator")
    .insert(
      seed.map((s, i) => ({
        program_id: programId,
        periode_id: periodeId,
        nama: s.nama,
        nama_terjemahan: s.nama_terjemahan ?? null,
        nama_arab: s.nama_arab ?? null,
        keterangan: s.keterangan,
        urutan: i + 1,
      })),
    )
    .select("id, keterangan");
  if (error) return gagal(pesanError(error));

  // Template default (formula ID) hanya untuk program berbahasa Indonesia.
  if (program.bahasa_utama === "id" && dibuat) {
    const rows = dibuat.flatMap((d) => {
      const f = templateFormulaId(d.keterangan ?? d.id);
      return (["A", "B", "C", "D"] as const).map((kode) => ({ indikator_id: d.id, predikat_kode: kode, teks: f[kode] }));
    });
    const { error: et } = await supabase.from("template_deskripsi").insert(rows);
    if (et) return gagal(`Indikator dibuat, tetapi template bawaan gagal disimpan: ${et.message}`);
  }

  revalidateProgram();
  return sukses(`${seed.length} indikator bawaan ditambahkan`);
}

/** Salin indikator + template dari periode lain ke periode ini (untuk lanjutan semester). */
export async function salinIndikatorDariPeriode(
  programId: string,
  periodeIdTujuan: string,
  periodeIdSumber: string,
  _prev: ActionState,
): Promise<ActionState> {
  await requireKelolaProgram(programId, periodeIdTujuan);
  const supabase = await createClient();

  const { count } = await supabase
    .from("indikator")
    .select("id", { count: "exact", head: true })
    .eq("program_id", programId)
    .eq("periode_id", periodeIdTujuan);
  if (count && count > 0) return gagal("Program ini sudah punya indikator di periode ini.");

  const { data: sumber, error: es } = await supabase
    .from("indikator")
    .select("nama, nama_terjemahan, nama_arab, keterangan, bobot, urutan, aktif, tingkat")
    .eq("program_id", programId)
    .eq("periode_id", periodeIdSumber)
    .order("urutan");
  if (es) return gagal(pesanError(es));
  if (!sumber || sumber.length === 0) return gagal("Periode sumber tidak punya indikator.");

  const { data: dibuat, error } = await supabase
    .from("indikator")
    .insert(sumber.map((s) => ({ ...s, program_id: programId, periode_id: periodeIdTujuan })))
    .select("id, nama, tingkat");
  if (error) return gagal(pesanError(error));

  // Peta (nama + tingkat) -> template lama untuk menyalin template berdasarkan indikator sumber.
  const { data: indikatorSumber, error: eis } = await supabase
    .from("indikator")
    .select("id, nama, tingkat, template:template_deskripsi(predikat_kode, teks, teks_terjemahan)")
    .eq("program_id", programId)
    .eq("periode_id", periodeIdSumber);
  if (eis || !indikatorSumber) {
    revalidateProgram();
    return sukses(`${sumber.length} indikator disalin (template tidak ikut tersalin: ${eis?.message ?? "data tidak ditemukan"})`);
  }

  const kunciIndikator = (nama: string, tingkat: number | null) => `${nama}__${tingkat ?? "semua"}`;
  const templatePerKunci = new Map(
    indikatorSumber.map((i) => [
      kunciIndikator(i.nama, i.tingkat),
      i.template as { predikat_kode: PredikatKode; teks: string | null; teks_terjemahan: string | null }[],
    ]),
  );
  const templateBaru = (dibuat ?? []).flatMap((baru) =>
    (templatePerKunci.get(kunciIndikator(baru.nama, baru.tingkat)) ?? []).map((t) => ({
      indikator_id: baru.id,
      predikat_kode: t.predikat_kode,
      teks: t.teks,
      teks_terjemahan: t.teks_terjemahan,
    })),
  );
  if (templateBaru.length > 0) {
    const { error: et } = await supabase.from("template_deskripsi").insert(templateBaru);
    if (et) {
      revalidateProgram();
      return sukses(`${sumber.length} indikator disalin, tetapi template gagal disalin: ${et.message}`);
    }
  }

  revalidateProgram();
  return sukses(`${sumber.length} indikator + template disalin dari periode sebelumnya`);
}

export async function simpanTemplateDeskripsi(
  programId: string,
  periodeId: string,
  indikatorId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireKelolaProgram(programId, periodeId);
  const supabase = await createClient();

  const diisi: { indikator_id: string; predikat_kode: PredikatKode; teks: string; teks_terjemahan: string | null }[] = [];
  const kosong: PredikatKode[] = [];

  for (const kode of PREDIKAT_KODE) {
    const teks = String(formData.get(`teks_${kode}`) ?? "").trim();
    const terjemahan = String(formData.get(`terjemahan_${kode}`) ?? "").trim();
    if (teks === "") kosong.push(kode);
    else diisi.push({ indikator_id: indikatorId, predikat_kode: kode, teks, teks_terjemahan: terjemahan === "" ? null : terjemahan });
  }

  if (diisi.length > 0) {
    const { error } = await supabase.from("template_deskripsi").upsert(diisi, { onConflict: "indikator_id,predikat_kode" });
    if (error) return gagal(pesanError(error));
  }
  if (kosong.length > 0) {
    const { error } = await supabase
      .from("template_deskripsi")
      .delete()
      .eq("indikator_id", indikatorId)
      .in("predikat_kode", kosong);
    if (error) return gagal(pesanError(error));
  }

  revalidateProgram();
  return sukses("Template deskripsi disimpan");
}
