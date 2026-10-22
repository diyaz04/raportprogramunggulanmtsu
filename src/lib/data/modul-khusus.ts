import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getPesertaProgram } from "@/lib/data/program";

export type TingkatLomba = "madrasah" | "kabupaten" | "provinsi" | "nasional";
export const TINGKAT_LOMBA_LABEL: Record<TingkatLomba, string> = {
  madrasah: "Madrasah",
  kabupaten: "Kabupaten",
  provinsi: "Provinsi",
  nasional: "Nasional",
};

export type TahapRiset = "proposal" | "pengambilan_data" | "laporan" | "presentasi";
export const TAHAP_RISET_LABEL: Record<TahapRiset, string> = {
  proposal: "Proposal",
  pengambilan_data: "Pengambilan Data",
  laporan: "Laporan",
  presentasi: "Presentasi",
};

export type Prestasi = {
  id: string;
  siswa_id: string;
  siswa_nama: string;
  nama_lomba: string;
  tingkat: TingkatLomba;
  peringkat: string | null;
  tanggal: string | null;
};

export type RisetProyek = { id: string | null; peserta_program_id: string; judul: string | null; tahap: TahapRiset };

export type Kehadiran = { id: string | null; peserta_program_id: string; hadir: number; sakit: number; izin: number; alpa: number };

function ambil<T>(data: T | null, error: { message: string } | null, konteks: string): T {
  if (error) throw new Error(`${konteks}: ${error.message}`);
  return data as T;
}

// ===== Prestasi =====
export async function getPrestasiProgram(programId: string): Promise<Prestasi[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prestasi")
    .select("id, siswa_id, nama_lomba, tingkat, peringkat, tanggal, siswa:siswa_id(nama)")
    .eq("program_id", programId)
    .order("tanggal", { ascending: false });
  const rows = (ambil(data, error, "Gagal memuat prestasi") ?? []) as unknown as {
    id: string;
    siswa_id: string;
    nama_lomba: string;
    tingkat: TingkatLomba;
    peringkat: string | null;
    tanggal: string | null;
    siswa: { nama: string } | null;
  }[];
  return rows.map((r) => ({ ...r, siswa_nama: r.siswa?.nama ?? "—" }));
}

// ===== Proyek riset =====
export async function getRisetProyekProgram(programId: string, periodeId: string) {
  const peserta = await getPesertaProgram(programId, periodeId);
  if (peserta.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("riset_proyek")
    .select("id, peserta_program_id, judul, tahap")
    .in("peserta_program_id", peserta.map((p) => p.id));
  const proyek = ambil(data, error, "Gagal memuat proyek riset") ?? [];

  const proyekPerPeserta = new Map(proyek.map((p) => [p.peserta_program_id, p]));
  return peserta.map((p) => ({
    peserta: p,
    proyek: (proyekPerPeserta.get(p.id) as RisetProyek | undefined) ?? {
      id: null,
      peserta_program_id: p.id,
      judul: null,
      tahap: "proposal" as const,
    },
  }));
}

// ===== Kehadiran =====
export async function getKehadiranProgram(programId: string, periodeId: string) {
  const peserta = await getPesertaProgram(programId, periodeId);
  if (peserta.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("kehadiran_program")
    .select("id, peserta_program_id, hadir, sakit, izin, alpa")
    .in("peserta_program_id", peserta.map((p) => p.id));
  const rows = (ambil(data, error, "Gagal memuat kehadiran") ?? []) as Kehadiran[];
  const perPeserta = new Map(rows.map((r) => [r.peserta_program_id, r]));

  return peserta.map((p) => ({
    peserta: p,
    kehadiran: perPeserta.get(p.id) ?? { id: null, peserta_program_id: p.id, hadir: 0, sakit: 0, izin: 0, alpa: 0 },
  }));
}
