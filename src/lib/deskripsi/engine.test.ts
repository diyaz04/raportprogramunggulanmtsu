import { describe, expect, it } from "vitest";
import { capaianIndikator, hitungPredikat, susunCatatanNarasi, type RentangPredikat } from "./engine";

const SKALA: RentangPredikat[] = [
  { kode: "A", min: 90, max: 100 },
  { kode: "B", min: 80, max: 89 },
  { kode: "C", min: 70, max: 79 },
  { kode: "D", min: 0, max: 69 },
];

describe("hitungPredikat", () => {
  it("memetakan nilai ke predikat sesuai rentang", () => {
    expect(hitungPredikat(95, SKALA)).toBe("A");
    expect(hitungPredikat(90, SKALA)).toBe("A");
    expect(hitungPredikat(85, SKALA)).toBe("B");
    expect(hitungPredikat(75, SKALA)).toBe("C");
    expect(hitungPredikat(40, SKALA)).toBe("D");
  });

  it("jatuh ke D kalau tidak ada rentang yang cocok", () => {
    expect(hitungPredikat(150, SKALA)).toBe("D");
  });
});

describe("capaianIndikator", () => {
  it("mengembalikan teks template apa adanya", () => {
    const hasil = capaianIndikator({ teks: "Sangat baik.", teks_terjemahan: "Excellent." });
    expect(hasil).toEqual({ teks: "Sangat baik.", terjemahan: "Excellent." });
  });

  it("memakai fallback kalau template kosong/belum ada", () => {
    expect(capaianIndikator(undefined).teks).toBe("Belum ada deskripsi untuk predikat ini.");
    expect(capaianIndikator({ teks: "", teks_terjemahan: null }).teks).toBe("Belum ada deskripsi untuk predikat ini.");
  });
});

describe("susunCatatanNarasi — ID (program non-bilingual)", () => {
  it("mengelompokkan A/B sebagai kekuatan dan C/D jadi satu kelompok perlu peningkatan", () => {
    const hasil = susunCatatanNarasi({
      bahasaUtama: "id",
      tampilkanTerjemahan: false,
      siswa: { nama: "Budi", jk: "L" },
      indikator: [
        { nama: "Penguasaan Konsep", predikat: "A" },
        { nama: "Pemecahan Masalah", predikat: "B" },
        { nama: "Ketelitian", predikat: "C", saran: "lebih teliti membaca soal" },
      ],
    });

    expect(hasil.teks).toBe(
      "Ananda Budi sangat baik dalam Penguasaan Konsep, baik dalam Pemecahan Masalah, dan perlu peningkatan dalam Ketelitian. Disarankan untuk lebih teliti membaca soal.",
    );
    expect(hasil.terjemahan).toBeNull();
  });

  it("tidak bikin kalimat saran kalau tidak ada teks SARAN yang cocok", () => {
    const hasil = susunCatatanNarasi({
      bahasaUtama: "id",
      tampilkanTerjemahan: false,
      siswa: { nama: "Citra", jk: "P" },
      indikator: [{ nama: "Konsep", predikat: "A" }],
    });
    expect(hasil.teks).toBe("Ananda Citra sangat baik dalam Konsep.");
  });

  it("mengembalikan null kalau tidak ada indikator sama sekali", () => {
    const hasil = susunCatatanNarasi({
      bahasaUtama: "id",
      tampilkanTerjemahan: false,
      siswa: { nama: "Dedi", jk: "L" },
      indikator: [],
    });
    expect(hasil.teks).toBeNull();
    expect(hasil.terjemahan).toBeNull();
  });
});

describe("susunCatatanNarasi — EN bilingual (PERENCANAAN.md §4.3, Bahasa Inggris)", () => {
  const indikator = [
    { nama: "Fluency", predikat: "A" as const },
    { nama: "Vocabulary", predikat: "A" as const },
    { nama: "Grammar", predikat: "B" as const },
    { nama: "Comprehension", predikat: "B" as const },
    { nama: "Pronunciation", predikat: "C" as const, saran: "practice shadowing native audio regularly", saranTerjemahan: "rutin berlatih shadowing audio penutur asli" },
  ];

  it("menyebut nama indikator Inggris apa adanya dan mengelompokkan per predikat", () => {
    const hasil = susunCatatanNarasi({
      bahasaUtama: "en",
      tampilkanTerjemahan: true,
      siswa: { nama: "Ahmad", jk: "L" },
      indikator,
    });

    expect(hasil.teks).toBe(
      "Ahmad shows excellent ability in Fluency and Vocabulary, good ability in Grammar and Comprehension, and a need for improvement in Pronunciation. It is recommended to practice shadowing native audio regularly.",
    );
  });

  it("terjemahan ID memakai nama indikator Latin yang sama (tidak diterjemahkan ulang)", () => {
    const hasil = susunCatatanNarasi({
      bahasaUtama: "en",
      tampilkanTerjemahan: true,
      siswa: { nama: "Ahmad", jk: "L" },
      indikator,
    });

    expect(hasil.terjemahan).toBe(
      "Ananda Ahmad sangat baik dalam Fluency dan Vocabulary, baik dalam Grammar dan Comprehension, dan perlu peningkatan dalam Pronunciation. Disarankan untuk rutin berlatih shadowing audio penutur asli.",
    );
  });

  it("tidak mengisi terjemahan kalau program tidak menampilkan terjemahan", () => {
    const hasil = susunCatatanNarasi({
      bahasaUtama: "en",
      tampilkanTerjemahan: false,
      siswa: { nama: "Ahmad", jk: "L" },
      indikator,
    });
    expect(hasil.terjemahan).toBeNull();
  });
});

describe("susunCatatanNarasi — AR bilingual (PERENCANAAN.md §4.3, Bahasa Arab)", () => {
  it("menyambungkan klausa Arab persis seperti contoh di PERENCANAAN.md", () => {
    const hasil = susunCatatanNarasi({
      bahasaUtama: "ar",
      tampilkanTerjemahan: true,
      siswa: { nama: "Ahmad", namaArab: "أحمد", jk: "L" },
      indikator: [
        { nama: "Maharah Kalam", namaArab: "مهارة الكلام", predikat: "A" },
        { nama: "Mufradat", namaArab: "المفردات", predikat: "A" },
        { nama: "Maharah Qira'ah", namaArab: "مهارة القراءة", predikat: "B" },
        { nama: "Maharah Istima'", namaArab: "مهارة الاستماع", predikat: "B" },
        { nama: "Qawa'id", namaArab: "القواعد", predikat: "D" },
        { nama: "Maharah Kitabah", namaArab: "مهارة الكتابة", predikat: "D" },
      ],
    });

    expect(hasil.teks).toBe(
      "الطالب أحمد ممتاز في مهارة الكلام والمفردات، وجيد جدا في مهارة القراءة ومهارة الاستماع، ويحتاج إلى التحسين في القواعد ومهارة الكتابة.",
    );
  });

  it("sapaan Arab tanpa nama kalau nama Arab siswa belum diisi", () => {
    const hasil = susunCatatanNarasi({
      bahasaUtama: "ar",
      tampilkanTerjemahan: false,
      siswa: { nama: "Siti", jk: "P" },
      indikator: [{ nama: "Mufradat", namaArab: "المفردات", predikat: "A" }],
    });
    expect(hasil.teks).toBe("الطالبة ممتاز في المفردات.");
  });
});
