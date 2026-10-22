// Mesin deskripsi otomatis rapor (PERENCANAAN.md §4). Modul murni: tanpa Next/Supabase,
// supaya gampang di-unit-test dan dipakai ulang dari Server Action mana pun.

export type PredikatKode = "A" | "B" | "C" | "D";
export type BahasaUtama = "id" | "en" | "ar";
export type JenisKelamin = "L" | "P";

export type RentangPredikat = { kode: PredikatKode; min: number; max: number };

/** Lapis 0: predikat dari nilai 0-100, berdasar skala (urutan rentang bebas). Jatuh ke 'D' kalau tidak cocok. */
export function hitungPredikat(nilai: number, skala: RentangPredikat[]): PredikatKode {
  const cocok = skala.find((s) => nilai >= s.min && nilai <= s.max);
  return cocok?.kode ?? "D";
}

export type TeksTemplate = { teks: string | null; teks_terjemahan: string | null };

/** Lapis 1: kalimat Capaian Kompetensi untuk satu baris indikator (ambil dari template_deskripsi). */
export function capaianIndikator(
  template: TeksTemplate | undefined,
  fallback = "Belum ada deskripsi untuk predikat ini.",
): { teks: string; terjemahan: string | null } {
  const teks = template?.teks?.trim();
  return { teks: teks && teks !== "" ? teks : fallback, terjemahan: template?.teks_terjemahan?.trim() || null };
}

// ===== Lapis 2: Catatan Guru Program (narasi kekuatan -> perlu ditingkatkan -> saran) =====

export type IndikatorUntukNarasi = {
  /** Nama indikator (Latin). Dipakai di kalimat EN dan di terjemahan ID — EN/Latin TIDAK diterjemahkan ulang. */
  nama: string;
  /** Nama Arab, dipakai HANYA di kalimat utama saat bahasaUtama 'ar' (terjemahan ID tetap pakai `nama`). */
  namaArab?: string | null;
  predikat: PredikatKode;
  /** Teks SARAN (predikat_kode = 'SARAN') pada bahasa utama program, kalau ada. */
  saran?: string | null;
  /** Terjemahan Indonesia dari SARAN, kalau ada & program bilingual. */
  saranTerjemahan?: string | null;
};

export type SiswaUntukNarasi = { nama: string; namaArab?: string | null; jk: JenisKelamin };

function joinDaftarId(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} dan ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, dan ${items[items.length - 1]}`;
}

function joinDaftarEn(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/** Daftar kata benda Arab: "،" antar-item, dan "و" (tanpa spasi) menempel di kata terakhir. */
function joinDaftarAr(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join("، ")} و${items[items.length - 1]}`;
}

/** Gabung beberapa KLAUSA (bukan sekadar kata) Arab: "، و" di depan tiap klausa setelah yang pertama. */
function joinKlausaAr(items: string[]): string {
  return items.join("، و");
}

type TigaTingkat = { kuatSekali: string[]; kuat: string[]; perluPeningkatan: string[] };

function kelompokkan(indikator: IndikatorUntukNarasi[], namaUntuk: (i: IndikatorUntukNarasi) => string): TigaTingkat {
  return {
    kuatSekali: indikator.filter((i) => i.predikat === "A").map(namaUntuk),
    kuat: indikator.filter((i) => i.predikat === "B").map(namaUntuk),
    perluPeningkatan: indikator.filter((i) => i.predikat === "C" || i.predikat === "D").map(namaUntuk),
  };
}

const namaLatin = (i: IndikatorUntukNarasi) => i.nama;
const namaArabAtauLatin = (i: IndikatorUntukNarasi) => i.namaArab ?? i.nama;

/** Saran unik (urutan kemunculan pertama) dari indikator berpredikat C/D yang punya teks SARAN. */
function kumpulkanSaran(indikator: IndikatorUntukNarasi[], ambil: (i: IndikatorUntukNarasi) => string | null | undefined) {
  const hasil: string[] = [];
  for (const i of indikator) {
    if (i.predikat !== "C" && i.predikat !== "D") continue;
    const s = ambil(i)?.trim();
    if (s && !hasil.includes(s)) hasil.push(s);
  }
  return hasil;
}

function kalimatUtamaId(panggilanNama: string, t: TigaTingkat): string | null {
  const bagian: string[] = [];
  if (t.kuatSekali.length) bagian.push(`sangat baik dalam ${joinDaftarId(t.kuatSekali)}`);
  if (t.kuat.length) bagian.push(`baik dalam ${joinDaftarId(t.kuat)}`);
  if (t.perluPeningkatan.length) bagian.push(`perlu peningkatan dalam ${joinDaftarId(t.perluPeningkatan)}`);
  if (bagian.length === 0) return null;
  return `${panggilanNama} ${joinDaftarId(bagian)}.`;
}

function kalimatUtamaEn(nama: string, t: TigaTingkat): string | null {
  const bagian: string[] = [];
  if (t.kuatSekali.length) bagian.push(`excellent ability in ${joinDaftarEn(t.kuatSekali)}`);
  if (t.kuat.length) bagian.push(`good ability in ${joinDaftarEn(t.kuat)}`);
  if (t.perluPeningkatan.length) bagian.push(`a need for improvement in ${joinDaftarEn(t.perluPeningkatan)}`);
  if (bagian.length === 0) return null;
  return `${nama} shows ${joinDaftarEn(bagian)}.`;
}

function kalimatUtamaAr(panggilanNama: string, t: TigaTingkat): string | null {
  const klausa: string[] = [];
  if (t.kuatSekali.length) klausa.push(`ممتاز في ${joinDaftarAr(t.kuatSekali)}`);
  if (t.kuat.length) klausa.push(`جيد جدا في ${joinDaftarAr(t.kuat)}`);
  if (t.perluPeningkatan.length) klausa.push(`يحتاج إلى التحسين في ${joinDaftarAr(t.perluPeningkatan)}`);
  if (klausa.length === 0) return null;
  return `${panggilanNama} ${joinKlausaAr(klausa)}.`;
}

function kalimatSaranId(saran: string[]): string | null {
  return saran.length ? `Disarankan untuk ${joinDaftarId(saran)}.` : null;
}

function kalimatSaranEn(saran: string[]): string | null {
  return saran.length ? `It is recommended to ${joinDaftarEn(saran)}.` : null;
}

function kalimatSaranAr(saran: string[]): string | null {
  return saran.length ? `ويُنصح ب${joinDaftarAr(saran)}.` : null;
}

/** "Ananda {Nama}" (ID, netral) / "{Nama}" (EN, tanpa sapaan) / "الطالب(ة) {NamaArab?}" (AR, bergender). */
function panggilanDanNama(bahasa: BahasaUtama, siswa: SiswaUntukNarasi): string {
  if (bahasa === "en") return siswa.nama;
  if (bahasa === "ar") {
    const panggilan = siswa.jk === "P" ? "الطالبة" : "الطالب";
    return siswa.namaArab ? `${panggilan} ${siswa.namaArab}` : panggilan;
  }
  return `Ananda ${siswa.nama}`;
}

export type HasilNarasi = { teks: string | null; terjemahan: string | null };

/**
 * Susun Catatan Guru Program: draf otomatis (bisa di-override guru lewat `Generate ulang`).
 * `terjemahan` hanya diisi kalau `tampilkanTerjemahan` true DAN bahasa utama program bukan 'id'.
 */
export function susunCatatanNarasi(params: {
  bahasaUtama: BahasaUtama;
  tampilkanTerjemahan: boolean;
  siswa: SiswaUntukNarasi;
  indikator: IndikatorUntukNarasi[];
}): HasilNarasi {
  const { bahasaUtama, tampilkanTerjemahan, siswa, indikator } = params;

  let teks: string | null;
  if (bahasaUtama === "en") {
    const tingkat = kelompokkan(indikator, namaLatin);
    const utama = kalimatUtamaEn(siswa.nama, tingkat);
    const saranTeks = kalimatSaranEn(kumpulkanSaran(indikator, (i) => i.saran));
    teks = [utama, saranTeks].filter(Boolean).join(" ") || null;
  } else if (bahasaUtama === "ar") {
    const tingkat = kelompokkan(indikator, namaArabAtauLatin);
    const utama = kalimatUtamaAr(panggilanDanNama("ar", siswa), tingkat);
    const saranTeks = kalimatSaranAr(kumpulkanSaran(indikator, (i) => i.saran));
    teks = [utama, saranTeks].filter(Boolean).join(" ") || null;
  } else {
    const tingkat = kelompokkan(indikator, namaLatin);
    const utama = kalimatUtamaId(panggilanDanNama("id", siswa), tingkat);
    const saranTeks = kalimatSaranId(kumpulkanSaran(indikator, (i) => i.saran));
    teks = [utama, saranTeks].filter(Boolean).join(" ") || null;
  }

  // Terjemahan ID selalu pakai nama Latin (nama asli indikator), bukan nama Arab — lihat §4.3 PERENCANAAN.
  let terjemahan: string | null = null;
  if (tampilkanTerjemahan && bahasaUtama !== "id") {
    const tingkatId = kelompokkan(indikator, namaLatin);
    const utamaId = kalimatUtamaId(panggilanDanNama("id", siswa), tingkatId);
    const saranIdDariTerjemahan = kumpulkanSaran(indikator, (i) => i.saranTerjemahan ?? i.saran);
    const saranTeksId = kalimatSaranId(saranIdDariTerjemahan);
    terjemahan = [utamaId, saranTeksId].filter(Boolean).join(" ") || null;
  }

  return { teks, terjemahan };
}
