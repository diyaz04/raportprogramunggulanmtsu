import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "koordinator" | "guru" | "kepala";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin / Operator",
  koordinator: "Koordinator Program",
  guru: "Guru Program",
  kepala: "Kepala Madrasah",
};

export type CurrentUser = {
  id: string;
  email: string;
  nama: string;
  nip: string | null;
  role: Role;
};

/**
 * Data Access Layer: satu-satunya tempat membaca sesi + profil.
 * - Membaca cookies, jadi HARUS dipanggil dari dalam <Suspense> (Cache Components).
 * - Ini pengecekan sungguhan (bukan optimistik seperti proxy.ts).
 * - `cache` hanya menghilangkan duplikasi panggilan dalam satu request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  // connection() sudah dipanggil di dalam createClient() (lib/supabase/server.ts) — satu tempat
  // buat semua pemanggil, jadi tidak perlu diulang di sini.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (!claims) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("nama, nip, role, aktif")
    .eq("id", claims.sub)
    .maybeSingle();

  // Error query (mis. tabel belum ada / RLS) beda dengan "profil tidak ada": jangan disamarkan.
  if (error) throw new Error(`Gagal membaca profil: ${error.message}`);

  // Akun baru dibuat nonaktif sampai admin mengaktifkannya.
  if (!profile || !profile.aktif) redirect("/auth/nonaktif");

  return {
    id: claims.sub,
    email: claims.email ?? "",
    nama: profile.nama,
    nip: profile.nip,
    role: profile.role as Role,
  };
});

export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

/** Admin & koordinator selalu boleh. Guru hanya boleh jika ditugaskan ke program+periode ini. */
export async function bisaKelolaProgram(user: CurrentUser, programId: string, periodeId: string): Promise<boolean> {
  if (user.role === "admin" || user.role === "koordinator") return true;
  if (user.role !== "guru") return false;

  const supabase = await createClient();
  const { count } = await supabase
    .from("penugasan_guru")
    .select("id", { count: "exact", head: true })
    .eq("program_id", programId)
    .eq("periode_id", periodeId)
    .eq("guru_id", user.id);
  return !!count && count > 0;
}

/**
 * Sama seperti `bisaKelolaProgram`, tapi untuk Server Action: redirect kalau tidak boleh
 * (sinkron dengan RLS `guru_ditugaskan`, supaya pesan error di UI jelas sebelum ditolak database).
 */
export async function requireKelolaProgram(programId: string, periodeId: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!(await bisaKelolaProgram(user, programId, periodeId))) redirect("/program");
  return user;
}

/**
 * Admin & koordinator selalu boleh. Guru boleh isi nilai peserta ini kalau ditugaskan ke SELURUH
 * program, atau ditugaskan khusus ke kelompok tempat peserta itu berada (sinkron dengan RLS `guru_bisa_nilai`).
 */
export async function bisaNilaiPeserta(user: CurrentUser, pesertaProgramId: string): Promise<boolean> {
  if (user.role === "admin" || user.role === "koordinator") return true;
  if (user.role !== "guru") return false;

  const supabase = await createClient();
  const { data: peserta } = await supabase
    .from("peserta_program")
    .select("program_id, periode_id, kelompok_id")
    .eq("id", pesertaProgramId)
    .maybeSingle();
  if (!peserta) return false;

  const { count: seluruhProgram } = await supabase
    .from("penugasan_guru")
    .select("id", { count: "exact", head: true })
    .eq("program_id", peserta.program_id)
    .eq("periode_id", peserta.periode_id)
    .eq("guru_id", user.id)
    .is("kelompok_id", null);
  if (seluruhProgram && seluruhProgram > 0) return true;

  if (!peserta.kelompok_id) return false;

  const { count: kelompokIni } = await supabase
    .from("penugasan_guru")
    .select("id", { count: "exact", head: true })
    .eq("program_id", peserta.program_id)
    .eq("periode_id", peserta.periode_id)
    .eq("guru_id", user.id)
    .eq("kelompok_id", peserta.kelompok_id);
  return !!kelompokIni && kelompokIni > 0;
}

export async function requireNilaiPeserta(pesertaProgramId: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!(await bisaNilaiPeserta(user, pesertaProgramId))) redirect("/nilai");
  return user;
}

/**
 * Prestasi tidak terikat periode/kelompok, jadi cukup cek guru PERNAH/SEDANG ditugaskan ke
 * program itu (di periode mana pun) — beda dengan `bisaKelolaProgram` yang terikat 1 periode.
 */
export async function bisaKelolaPrestasi(user: CurrentUser, programId: string): Promise<boolean> {
  if (user.role === "admin" || user.role === "koordinator") return true;
  if (user.role !== "guru") return false;

  const supabase = await createClient();
  const { count } = await supabase
    .from("penugasan_guru")
    .select("id", { count: "exact", head: true })
    .eq("program_id", programId)
    .eq("guru_id", user.id);
  return !!count && count > 0;
}

export async function requireKelolaPrestasi(programId: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!(await bisaKelolaPrestasi(user, programId))) redirect("/program");
  return user;
}

/**
 * Hafalan tahfidz melekat ke siswa (bukan peserta_program), jadi otorisasinya dicek lewat
 * keikutsertaan siswa di program Tahfidz pada periode AKTIF + penugasan guru di periode itu
 * (sinkron dengan RLS `guru_bisa_tahfidz`).
 */
export async function bisaKelolaTahfidz(user: CurrentUser, siswaId: string): Promise<boolean> {
  if (user.role === "admin" || user.role === "koordinator") return true;
  if (user.role !== "guru") return false;

  const supabase = await createClient();
  const { data: periodeAktif } = await supabase.from("periode").select("id").eq("aktif", true).maybeSingle();
  if (!periodeAktif) return false;

  const { data: program } = await supabase.from("program").select("id").eq("kode", "THF").maybeSingle();
  if (!program) return false;

  const { data: peserta } = await supabase
    .from("peserta_program")
    .select("kelompok_id")
    .eq("program_id", program.id)
    .eq("periode_id", periodeAktif.id)
    .eq("siswa_id", siswaId)
    .maybeSingle();
  if (!peserta) return false;

  const { count: seluruhProgram } = await supabase
    .from("penugasan_guru")
    .select("id", { count: "exact", head: true })
    .eq("program_id", program.id)
    .eq("periode_id", periodeAktif.id)
    .eq("guru_id", user.id)
    .is("kelompok_id", null);
  if (seluruhProgram && seluruhProgram > 0) return true;

  if (!peserta.kelompok_id) return false;

  const { count: kelompokIni } = await supabase
    .from("penugasan_guru")
    .select("id", { count: "exact", head: true })
    .eq("program_id", program.id)
    .eq("periode_id", periodeAktif.id)
    .eq("guru_id", user.id)
    .eq("kelompok_id", peserta.kelompok_id);
  return !!kelompokIni && kelompokIni > 0;
}

export async function requireKelolaTahfidz(siswaId: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!(await bisaKelolaTahfidz(user, siswaId))) redirect("/tahfidz/hafalan");
  return user;
}
