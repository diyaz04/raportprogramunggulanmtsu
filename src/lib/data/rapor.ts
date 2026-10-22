import "server-only";
import { createClient } from "@/lib/supabase/server";
import { capaianIndikator, hitungPredikat, susunCatatanNarasi, type PredikatKode } from "@/lib/deskripsi/engine";
import { getIndikatorDenganTemplate, getSkalaPredikatGlobal } from "@/lib/data/indikator";
import { getPengaturan, type Pengaturan } from "@/lib/data/master";
import {
  getPenandaTangan,
  getPesertaProgram,
  getPesertaProgramById,
  type BahasaProgram,
  type JenisProgram,
} from "@/lib/data/program";
import { getPrestasiProgram, getKehadiranProgram, getRisetProyekProgram, TAHAP_RISET_LABEL, type TahapRiset } from "@/lib/data/modul-khusus";
import { getHafalanSiswa, getSemuaSuratPerJuz, hitungRekapHafalan } from "@/lib/data/tahfidz";
import { buatIndeksPeriode, hitungNilaiAkhirStandar, hitungNilaiAkhirTahfidz } from "@/lib/rapor/hitung";

export type RaporIndikatorBaris = {
  nama: string;
  nama_terjemahan: string | null;
  nama_arab: string | null;
  bobot: number;
  nilai: number | null;
  predikat: PredikatKode | null;
  capaian: string;
  capaian_terjemahan: string | null;
};

export type RaporData = {
  siswa: { nama: string; nis: string; nisn: string | null; jk: "L" | "P" };
  kelas_nama: string | null;
  kelompok_nama: string | null;
  program: {
    kode: string;
    nama: string;
    nama_arab: string | null;
    judul_rapor: string;
    jenis: JenisProgram;
    bahasa_utama: BahasaProgram;
    tampilkan_terjemahan: boolean;
  };
  periode: { tahun_ajaran: string; semester: "ganjil" | "genap"; tanggal_rapor: string | null };
  pengaturan: Pengaturan;
  indikator: RaporIndikatorBaris[];
  nilai_akhir: number | null;
  predikat: PredikatKode | null;
  catatan_auto: string | null;
  catatan_auto_terjemahan: string | null;
  prestasi: { nama_lomba: string; tingkat: string; peringkat: string | null; tanggal: string | null }[];
  kehadiran: { hadir: number; sakit: number; izin: number; alpa: number } | null;
  penanda_tangan: { nama: string; nip: string | null; label_jabatan: string; urutan: number }[];
  tahfidz?: {
    hafalan: { juz: number; surat_no: number; nama_latin: string; nama_arab: string; ayat_awal: number; ayat_akhir: number; nilai: number | null; baru: boolean }[];
    rekap: { juzPenuh: number; juzSebagian: number; jumlahSurat: number; totalAyat: number; rataRata: number | null };
  };
  riset?: { judul: string | null; tahap: TahapRiset; tahapLabel: string };
};

function ambil<T>(data: T | null, error: { message: string } | null, konteks: string): T {
  if (error) throw new Error(`${konteks}: ${error.message}`);
  return data as T;
}

/** Rakit seluruh data 1 lembar rapor (1 siswa x 1 program) langsung dari data terkini. */
export async function rakitDataRapor(pesertaProgramId: string): Promise<RaporData | null> {
  const peserta = await getPesertaProgramById(pesertaProgramId);
  if (!peserta) return null;

  const supabase = await createClient();
  const { data: ppLengkap, error: ep } = await supabase
    .from("peserta_program")
    .select("program_id, kelompok:kelompok_id(nama)")
    .eq("id", pesertaProgramId)
    .single();
  if (ep) throw new Error(`Gagal memuat peserta: ${ep.message}`);

  const [{ data: program, error: eprog }, { data: periode, error: eper }, { data: kelasSiswa, error: ek }] = await Promise.all([
    supabase
      .from("program")
      .select("kode, nama, nama_arab, judul_rapor, jenis, bahasa_utama, tampilkan_terjemahan, bobot_hafalan")
      .eq("id", ppLengkap.program_id)
      .single(),
    supabase.from("periode").select("id, tahun_ajaran, semester, tanggal_rapor").eq("id", peserta.periode_id).single(),
    supabase
      .from("kelas_siswa")
      .select("kelas:kelas_id(nama)")
      .eq("periode_id", peserta.periode_id)
      .eq("siswa_id", peserta.siswa.id)
      .maybeSingle(),
  ]);
  if (eprog) throw new Error(`Gagal memuat program: ${eprog.message}`);
  if (eper) throw new Error(`Gagal memuat periode: ${eper.message}`);
  if (ek) throw new Error(`Gagal memuat kelas: ${ek.message}`);

  const [indikatorDenganTemplate, skala, pengaturan, prestasiSemua, kehadiranSemua, penandaTangan] = await Promise.all([
    getIndikatorDenganTemplate(ppLengkap.program_id, peserta.periode_id),
    getSkalaPredikatGlobal(),
    getPengaturan(),
    getPrestasiProgram(ppLengkap.program_id),
    getKehadiranProgram(ppLengkap.program_id, peserta.periode_id),
    getPenandaTangan(ppLengkap.program_id, peserta.periode_id),
  ]);

  const { data: nilaiRows, error: en } = await supabase
    .from("nilai")
    .select("indikator_id, nilai")
    .eq("peserta_program_id", pesertaProgramId);
  const nilaiPerIndikator = new Map((ambil(nilaiRows, en, "Gagal memuat nilai") ?? []).map((n) => [n.indikator_id, n.nilai]));

  const indikatorAktif = indikatorDenganTemplate.filter((i) => i.aktif);
  const indikatorBaris: RaporIndikatorBaris[] = indikatorAktif.map((ind) => {
    const nilai = nilaiPerIndikator.get(ind.id) ?? null;
    const predikat = nilai != null ? hitungPredikat(nilai, skala) : null;
    const { teks, terjemahan } = predikat ? capaianIndikator(ind.template[predikat]) : { teks: "Belum dinilai.", terjemahan: null };
    return {
      nama: ind.nama,
      nama_terjemahan: ind.nama_terjemahan,
      nama_arab: ind.nama_arab,
      bobot: ind.bobot,
      nilai,
      predikat,
      capaian: teks,
      capaian_terjemahan: terjemahan,
    };
  });

  const siswaUntukNarasi = { nama: peserta.siswa.nama, jk: peserta.siswa.jk };
  const indikatorUntukNarasi = indikatorBaris
    .filter((i): i is RaporIndikatorBaris & { predikat: PredikatKode } => i.predikat !== null)
    .map((i) => {
      const asli = indikatorAktif.find((a) => a.nama === i.nama)!;
      return {
        nama: i.nama,
        namaArab: i.nama_arab,
        predikat: i.predikat,
        saran: asli.template.SARAN?.teks,
        saranTerjemahan: asli.template.SARAN?.teks_terjemahan,
      };
    });

  let nilaiAkhir: number | null;
  let tahfidzData: RaporData["tahfidz"];
  if (program.jenis === "tahfidz") {
    const [hafalan, semuaSuratPerJuz, semuaPeriode] = await Promise.all([
      getHafalanSiswa(peserta.siswa.id),
      getSemuaSuratPerJuz(),
      (async () => {
        const { data, error } = await supabase.from("periode").select("id, tahun_ajaran, semester");
        return ambil(data, error, "Gagal memuat periode");
      })(),
    ]);
    const indeks = buatIndeksPeriode(semuaPeriode);
    const batasIni = indeks.get(peserta.periode_id) ?? Infinity;
    const hafalanSampaiPeriodeIni = hafalan.filter((h) => (indeks.get(h.periode_setor_id) ?? Infinity) <= batasIni);
    const rekap = hitungRekapHafalan(hafalanSampaiPeriodeIni, semuaSuratPerJuz);

    const rataRataKualitas = hitungNilaiAkhirStandar(indikatorBaris.filter((i) => i.nilai != null).map((i) => ({ nilai: i.nilai!, bobot: i.bobot })));
    nilaiAkhir = hitungNilaiAkhirTahfidz(rekap.rataRata, rataRataKualitas, program.bobot_hafalan ?? 60);
    tahfidzData = {
      hafalan: hafalanSampaiPeriodeIni.map((h) => ({
        juz: h.juz,
        surat_no: h.surat_no,
        nama_latin: h.nama_latin,
        nama_arab: h.nama_arab,
        ayat_awal: h.ayat_awal,
        ayat_akhir: h.ayat_akhir,
        nilai: h.nilai,
        baru: h.periode_setor_id === peserta.periode_id,
      })),
      rekap,
    };
  } else {
    nilaiAkhir = hitungNilaiAkhirStandar(indikatorBaris.filter((i) => i.nilai != null).map((i) => ({ nilai: i.nilai!, bobot: i.bobot })));
  }
  const predikatAkhir = nilaiAkhir != null ? hitungPredikat(nilaiAkhir, skala) : null;

  const narasi = susunCatatanNarasi({
    bahasaUtama: program.bahasa_utama,
    tampilkanTerjemahan: program.tampilkan_terjemahan,
    siswa: siswaUntukNarasi,
    indikator: indikatorUntukNarasi,
  });

  let risetData: RaporData["riset"];
  if (program.jenis === "riset") {
    const proyekSemua = await getRisetProyekProgram(ppLengkap.program_id, peserta.periode_id);
    const milikSaya = proyekSemua.find((p) => p.peserta.id === pesertaProgramId);
    if (milikSaya) risetData = { judul: milikSaya.proyek.judul, tahap: milikSaya.proyek.tahap, tahapLabel: TAHAP_RISET_LABEL[milikSaya.proyek.tahap] };
  }

  const prestasiSiswa = prestasiSemua.filter((p) => p.siswa_id === peserta.siswa.id);
  const kehadiranSaya = kehadiranSemua.find((k) => k.peserta.id === pesertaProgramId)?.kehadiran ?? null;

  return {
    siswa: peserta.siswa,
    kelas_nama: (kelasSiswa as unknown as { kelas: { nama: string } | null } | null)?.kelas?.nama ?? null,
    kelompok_nama: (ppLengkap as unknown as { kelompok: { nama: string } | null }).kelompok?.nama ?? null,
    program: {
      kode: program.kode,
      nama: program.nama,
      nama_arab: program.nama_arab,
      judul_rapor: program.judul_rapor,
      jenis: program.jenis,
      bahasa_utama: program.bahasa_utama,
      tampilkan_terjemahan: program.tampilkan_terjemahan,
    },
    periode,
    pengaturan,
    indikator: indikatorBaris,
    nilai_akhir: nilaiAkhir,
    predikat: predikatAkhir,
    catatan_auto: narasi.teks,
    catatan_auto_terjemahan: narasi.terjemahan,
    prestasi: prestasiSiswa.map((p) => ({ nama_lomba: p.nama_lomba, tingkat: p.tingkat, peringkat: p.peringkat, tanggal: p.tanggal })),
    kehadiran: kehadiranSaya ? { hadir: kehadiranSaya.hadir, sakit: kehadiranSaya.sakit, izin: kehadiranSaya.izin, alpa: kehadiranSaya.alpa } : null,
    penanda_tangan: penandaTangan.map((p) => ({ nama: p.guru.nama, nip: p.guru.nip, label_jabatan: p.label_jabatan, urutan: p.urutan })),
    tahfidz: tahfidzData,
    riset: risetData,
  };
}

export type StatusRapor = "draft" | "review" | "disetujui" | "terkunci";
export const STATUS_RAPOR_LABEL: Record<StatusRapor, string> = {
  draft: "Draf",
  review: "Diajukan",
  disetujui: "Disetujui",
  terkunci: "Terkunci",
};

export type RaporRingkas = {
  peserta_program_id: string;
  siswa_nama: string;
  kelas_nama: string | null;
  status: StatusRapor | null;
  nilai_akhir: number | null;
  predikat: PredikatKode | null;
  kode_verifikasi: string | null;
};

/** Daftar rapor 1 program x 1 periode, buat halaman ringkasan status. Baris tanpa rapor dianggap belum dihitung sama sekali. */
export async function getRaporProgram(programId: string, periodeId: string): Promise<RaporRingkas[]> {
  const peserta = await getPesertaProgram(programId, periodeId);
  if (peserta.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rapor")
    .select("peserta_program_id, status, nilai_akhir, predikat, kode_verifikasi")
    .in("peserta_program_id", peserta.map((p) => p.id));
  const raporPerPeserta = new Map((ambil(data, error, "Gagal memuat rapor") ?? []).map((r) => [r.peserta_program_id, r]));

  return peserta.map((p) => {
    const r = raporPerPeserta.get(p.id);
    return {
      peserta_program_id: p.id,
      siswa_nama: p.siswa.nama,
      kelas_nama: p.kelas_nama,
      status: (r?.status as StatusRapor | undefined) ?? null,
      nilai_akhir: r?.nilai_akhir ?? null,
      predikat: (r?.predikat as PredikatKode | null | undefined) ?? null,
      kode_verifikasi: r?.kode_verifikasi ?? null,
    };
  });
}

export type RaporLengkap = {
  status: StatusRapor;
  nilai_akhir: number | null;
  predikat: PredikatKode | null;
  catatan_final: string | null;
  catatan_final_terjemahan: string | null;
  catatan_auto: string | null;
  catatan_auto_terjemahan: string | null;
  diedit_manual: boolean;
  kode_verifikasi: string | null;
  snapshot: RaporData | null;
};

export async function getRaporSatu(pesertaProgramId: string): Promise<RaporLengkap | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rapor")
    .select("status, nilai_akhir, predikat, catatan_final, catatan_final_terjemahan, catatan_auto, catatan_auto_terjemahan, diedit_manual, kode_verifikasi, snapshot")
    .eq("peserta_program_id", pesertaProgramId)
    .maybeSingle();
  if (error) throw new Error(`Gagal memuat rapor: ${error.message}`);
  if (!data) return null;
  return { ...data, predikat: data.predikat as PredikatKode | null, snapshot: data.snapshot as RaporData | null };
}

export type ProgresProgram = {
  jumlahPeserta: number;
  jumlahIndikatorAktif: number;
  nilaiTerisi: number;
  nilaiTotal: number;
  statusRapor: Record<StatusRapor, number>;
};

/** Ringkasan progres 1 program (buat dashboard): kelengkapan nilai & sebaran status rapor. */
export async function getProgresProgram(programId: string, periodeId: string): Promise<ProgresProgram> {
  const [peserta, indikatorSemua] = await Promise.all([getPesertaProgram(programId, periodeId), getIndikatorDenganTemplate(programId, periodeId)]);
  const pesertaIds = peserta.map((p) => p.id);
  const indikatorIds = indikatorSemua.filter((i) => i.aktif).map((i) => i.id);

  const supabase = await createClient();
  let nilaiTerisi = 0;
  if (pesertaIds.length > 0 && indikatorIds.length > 0) {
    const { count } = await supabase
      .from("nilai")
      .select("id", { count: "exact", head: true })
      .in("peserta_program_id", pesertaIds)
      .in("indikator_id", indikatorIds);
    nilaiTerisi = count ?? 0;
  }

  const statusRapor: Record<StatusRapor, number> = { draft: 0, review: 0, disetujui: 0, terkunci: 0 };
  if (pesertaIds.length > 0) {
    const { data } = await supabase.from("rapor").select("status").in("peserta_program_id", pesertaIds);
    for (const r of data ?? []) statusRapor[r.status as StatusRapor]++;
  }

  return {
    jumlahPeserta: peserta.length,
    jumlahIndikatorAktif: indikatorIds.length,
    nilaiTerisi,
    nilaiTotal: pesertaIds.length * indikatorIds.length,
    statusRapor,
  };
}
