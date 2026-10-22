import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/auth";

// Tipe ditulis manual (belum memakai `supabase gen types`).
export type Semester = "ganjil" | "genap";

export type Periode = {
  id: string;
  tahun_ajaran: string;
  semester: Semester;
  aktif: boolean;
  tanggal_rapor: string | null;
};

export type Kelas = { id: string; periode_id: string; nama: string; tingkat: number };
export type KelasDenganJumlah = Kelas & { jumlah_siswa: number };

export type Siswa = {
  id: string;
  nis: string;
  nisn: string | null;
  nama: string;
  nama_arab: string | null;
  jk: "L" | "P";
  aktif: boolean;
};

export type Profil = {
  id: string;
  nama: string;
  nip: string | null;
  email: string | null;
  role: Role;
  aktif: boolean;
};

export type Pengaturan = {
  instansi_induk: string;
  nama_madrasah: string;
  alamat: string;
  wilayah: string;
  kota: string;
  kepala_nama: string | null;
  kepala_nip: string | null;
  logo_kiri_url: string | null;
  logo_kanan_url: string | null;
  watermark_aktif: boolean;
  watermark_teks: string;
};

export const SEMESTER_LABEL: Record<Semester, string> = { ganjil: "Ganjil", genap: "Genap" };
export const labelPeriode = (p: Pick<Periode, "tahun_ajaran" | "semester">) =>
  `${p.tahun_ajaran} · ${SEMESTER_LABEL[p.semester]}`;

function ambil<T>(data: T | null, error: { message: string } | null, konteks: string): T {
  if (error) throw new Error(`${konteks}: ${error.message}`);
  return data as T;
}

// ===== Periode =====
export async function getPeriodeList(): Promise<Periode[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("periode")
    .select("id, tahun_ajaran, semester, aktif, tanggal_rapor")
    .order("tahun_ajaran", { ascending: false })
    .order("semester", { ascending: false });
  return ambil(data, error, "Gagal memuat periode") ?? [];
}

export async function getPeriodeAktif(): Promise<Periode | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("periode")
    .select("id, tahun_ajaran, semester, aktif, tanggal_rapor")
    .eq("aktif", true)
    .maybeSingle();
  return ambil(data, error, "Gagal memuat periode aktif");
}

// ===== Kelas =====
export async function getKelasByPeriode(periodeId: string): Promise<KelasDenganJumlah[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kelas")
    .select("id, periode_id, nama, tingkat, kelas_siswa(count)")
    .eq("periode_id", periodeId)
    .order("tingkat")
    .order("nama");
  const rows = ambil(data, error, "Gagal memuat kelas") ?? [];
  return rows.map(({ kelas_siswa, ...k }) => ({
    ...k,
    jumlah_siswa: (kelas_siswa as { count: number }[] | null)?.[0]?.count ?? 0,
  }));
}

export async function getKelas(id: string): Promise<Kelas | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kelas")
    .select("id, periode_id, nama, tingkat")
    .eq("id", id)
    .maybeSingle();
  return ambil(data, error, "Gagal memuat kelas");
}

export async function getAnggotaKelas(kelasId: string): Promise<Siswa[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kelas_siswa")
    .select("siswa:siswa_id(id, nis, nisn, nama, nama_arab, jk, aktif)")
    .eq("kelas_id", kelasId);
  const rows = (ambil(data, error, "Gagal memuat anggota kelas") ?? []) as unknown as { siswa: Siswa }[];
  return rows.map((r) => r.siswa).sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}

/** Siswa aktif yang belum punya kelas di periode tersebut. */
export async function getSiswaTanpaKelas(periodeId: string): Promise<Siswa[]> {
  const supabase = await createClient();
  const [{ data: semua, error: e1 }, { data: terpakai, error: e2 }] = await Promise.all([
    supabase.from("siswa").select("id, nis, nisn, nama, nama_arab, jk, aktif").eq("aktif", true).order("nama"),
    supabase.from("kelas_siswa").select("siswa_id").eq("periode_id", periodeId),
  ]);
  const siswa = ambil(semua, e1, "Gagal memuat siswa") ?? [];
  const dipakai = new Set((ambil(terpakai, e2, "Gagal memuat keanggotaan") ?? []).map((r) => r.siswa_id));
  return siswa.filter((s) => !dipakai.has(s.id));
}

// ===== Siswa =====
export const SISWA_PER_HALAMAN = 50;

export async function getSiswaPage(opts: { q?: string; halaman: number; periodeAktifId?: string }) {
  const supabase = await createClient();
  const dari = (opts.halaman - 1) * SISWA_PER_HALAMAN;

  let query = supabase
    .from("siswa")
    .select("id, nis, nisn, nama, nama_arab, jk, aktif", { count: "exact" })
    .order("nama")
    .range(dari, dari + SISWA_PER_HALAMAN - 1);

  const q = opts.q?.trim().replace(/[%,()]/g, " ");
  if (q) query = query.or(`nama.ilike.%${q}%,nis.ilike.%${q}%,nisn.ilike.%${q}%`);

  const { data, count, error } = await query;
  const siswa = ambil(data, error, "Gagal memuat siswa") ?? [];

  // Kelas di periode aktif untuk siswa pada halaman ini.
  const kelasPerSiswa = new Map<string, string>();
  if (opts.periodeAktifId && siswa.length > 0) {
    const { data: ks, error: ke } = await supabase
      .from("kelas_siswa")
      .select("siswa_id, kelas:kelas_id(nama)")
      .eq("periode_id", opts.periodeAktifId)
      .in("siswa_id", siswa.map((s) => s.id));
    const rows = (ambil(ks, ke, "Gagal memuat kelas siswa") ?? []) as unknown as {
      siswa_id: string;
      kelas: { nama: string } | null;
    }[];
    for (const r of rows) if (r.kelas) kelasPerSiswa.set(r.siswa_id, r.kelas.nama);
  }

  return {
    siswa: siswa.map((s) => ({ ...s, kelas: kelasPerSiswa.get(s.id) ?? null })),
    total: count ?? 0,
  };
}

// ===== Guru & akun =====
export async function getProfilList(): Promise<Profil[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nama, nip, email, role, aktif")
    .order("aktif", { ascending: false })
    .order("nama");
  return (ambil(data, error, "Gagal memuat akun") ?? []) as Profil[];
}

// ===== Pengaturan =====
export async function getPengaturan(): Promise<Pengaturan> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pengaturan")
    .select(
      "instansi_induk, nama_madrasah, alamat, wilayah, kota, kepala_nama, kepala_nip, logo_kiri_url, logo_kanan_url, watermark_aktif, watermark_teks",
    )
    .eq("id", true)
    .single();
  return ambil(data, error, "Gagal memuat pengaturan");
}
