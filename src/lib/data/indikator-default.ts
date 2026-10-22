// Nilai awal (seed) indikator per kode program, hasil riset di PERENCANAAN.md §2.
// Guru/koordinator bebas menambah, mengubah, atau menghapusnya lewat menu Indikator.
export type IndikatorSeed = { nama: string; nama_terjemahan?: string; nama_arab?: string; keterangan: string };

const KSM_SEED: IndikatorSeed[] = [
  { nama: "Penguasaan Konsep", keterangan: "Pemahaman materi inti bidang" },
  { nama: "Pemecahan Masalah (HOTS)", keterangan: "Analisis, penalaran, dan soal non-rutin" },
  { nama: "Integrasi Sains–Keislaman", keterangan: "Menghubungkan konsep sains dengan nilai/teks keislaman" },
  { nama: "Ketelitian & Manajemen Waktu", keterangan: "Akurasi dan kecepatan saat simulasi" },
  { nama: "Hasil Try Out / Simulasi", keterangan: "Rata-rata skor try out selama semester" },
  { nama: "Keaktifan Pembinaan", keterangan: "Kehadiran dan keaktifan di sesi pembinaan" },
];

const RISET_SEED: IndikatorSeed[] = [
  { nama: "Identifikasi Masalah & Orisinalitas", keterangan: "Kepekaan melihat masalah dan kebaruan ide" },
  { nama: "Kajian Pustaka", keterangan: "Mencari dan memakai referensi yang relevan" },
  { nama: "Metodologi", keterangan: "Ketepatan rancangan dan prosedur penelitian" },
  { nama: "Pengumpulan & Analisis Data", keterangan: "Ketelitian mengambil dan mengolah data" },
  { nama: "Penulisan Ilmiah", keterangan: "Sistematika, koherensi, dan teknik penulisan" },
  { nama: "Presentasi & Penguasaan Materi", keterangan: "Kepercayaan diri, etika, dan kemampuan menjawab pertanyaan" },
  { nama: "Kolaborasi & Etika Penelitian", keterangan: "Kerja tim dan kejujuran ilmiah" },
];

export const INDIKATOR_DEFAULT: Record<string, IndikatorSeed[]> = {
  ING: [
    { nama: "Fluency", nama_terjemahan: "Kelancaran", keterangan: "Kelancaran berbicara, jeda/keraguan, alur ujaran" },
    { nama: "Grammar", nama_terjemahan: "Tata Bahasa", keterangan: "Ketepatan dan variasi struktur kalimat" },
    { nama: "Vocabulary", nama_terjemahan: "Kosakata", keterangan: "Keluasan dan ketepatan pilihan kata" },
    { nama: "Pronunciation", nama_terjemahan: "Pelafalan", keterangan: "Pelafalan, intonasi, word stress, kejelasan" },
    { nama: "Comprehension", nama_terjemahan: "Pemahaman", keterangan: "Memahami teks/ujaran lalu merespons dengan tepat" },
  ],
  ARB: [
    { nama: "Maharah Istima'", nama_arab: "مهارة الاستماع", keterangan: "Memahami ujaran/teks lisan berbahasa Arab" },
    {
      nama: "Maharah Kalam (Muhadatsah)",
      nama_arab: "مهارة الكلام",
      keterangan: "Berbicara: kelancaran, ketepatan, respons dalam dialog",
    },
    {
      nama: "Maharah Qira'ah",
      nama_arab: "مهارة القراءة",
      keterangan: "Membaca teks: ketepatan baca, harakat, dan pemahaman isi",
    },
    {
      nama: "Maharah Kitabah (Insya')",
      nama_arab: "مهارة الكتابة",
      keterangan: "Menulis kalimat/paragraf: imla' dan susunan kalimat",
    },
    { nama: "Mufradat", nama_arab: "المفردات", keterangan: "Penguasaan dan penggunaan kosakata" },
    { nama: "Qawa'id", nama_arab: "القواعد", keterangan: "Penerapan kaidah tata bahasa (nahwu-sharaf)" },
  ],
  THF: [
    { nama: "Kelancaran Hafalan", keterangan: "Minim tawaqquf, tardid, dan sabqul lisan" },
    { nama: "Tajwid", keterangan: "Hukum nun/mim sukun, mad, ghunnah, waqaf-ibtida'" },
    { nama: "Makharijul Huruf & Sifat Huruf", keterangan: "Ketepatan tempat keluar dan sifat huruf" },
    { nama: "Fashahah", keterangan: "Kefasihan: harakat, panjang-pendek, kejelasan" },
    { nama: "Muraja'ah", keterangan: "Kekuatan dan kekonsistenan menjaga hafalan lama" },
    { nama: "Adab & Kedisiplinan Setoran", keterangan: "Kehadiran, kesiapan, dan adab terhadap Al-Qur'an" },
  ],
  AGM: [
    { nama: "Praktik Ibadah", keterangan: "Wudhu, shalat fardhu/sunnah, tata cara dan bacaan" },
    { nama: "Hafalan Doa & Dzikir Harian", keterangan: "Doa sehari-hari, dzikir ba'da shalat, wirid" },
    { nama: "Pemahaman Fiqih Ibadah", keterangan: "Pemahaman dasar thaharah, shalat, dan puasa" },
    { nama: "Baca Kitab", keterangan: "Membaca dan memahami kitab dasar sesuai kurikulum" },
    { nama: "Khithabah / Muhadharah", keterangan: "Kemampuan menyampaikan ceramah singkat" },
    { nama: "Akhlak & Adab", keterangan: "Adab kepada guru, teman, dan lingkungan" },
    { nama: "Kedisiplinan Ibadah", keterangan: "Shalat berjamaah, kehadiran kegiatan keagamaan" },
  ],
  "KSM-MAT": KSM_SEED,
  "KSM-IPA": KSM_SEED,
  "KSM-IPS": KSM_SEED,
  "RST-AGM": RISET_SEED,
  "RST-HUM": RISET_SEED,
  "RST-SNS": RISET_SEED,
};

/** Kalimat default "Menunjukkan penguasaan ... dalam {keterangan}" (PERENCANAAN.md §4.1). Hanya untuk program berbahasa Indonesia. */
export function templateFormulaId(keterangan: string): Record<"A" | "B" | "C" | "D", string> {
  const materi = keterangan.charAt(0).toLowerCase() + keterangan.slice(1);
  return {
    A: `Menunjukkan penguasaan yang sangat baik dalam ${materi}.`,
    B: `Menunjukkan penguasaan yang baik dalam ${materi}.`,
    C: `Menunjukkan penguasaan yang cukup baik dalam ${materi}.`,
    D: `Masih perlu bimbingan dalam ${materi}.`,
  };
}
