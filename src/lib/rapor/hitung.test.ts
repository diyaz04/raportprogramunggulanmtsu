import { describe, expect, it } from "vitest";
import {
  buatIndeksPeriode,
  hitungNilaiAkhirStandar,
  hitungNilaiAkhirTahfidz,
  hitungRekapHafalan,
  hitungTotalAyatUnik,
  type PeriodeRingkas,
} from "./hitung";

describe("hitungNilaiAkhirStandar", () => {
  it("rata-rata biasa kalau semua bobot sama", () => {
    expect(hitungNilaiAkhirStandar([{ nilai: 90, bobot: 1 }, { nilai: 80, bobot: 1 }])).toBe(85);
  });

  it("rata-rata berbobot kalau bobotnya beda", () => {
    expect(hitungNilaiAkhirStandar([{ nilai: 100, bobot: 3 }, { nilai: 50, bobot: 1 }])).toBe(88); // (300+50)/4 = 87.5 -> 88
  });

  it("null kalau belum ada nilai", () => {
    expect(hitungNilaiAkhirStandar([])).toBeNull();
  });
});

describe("hitungNilaiAkhirTahfidz", () => {
  it("60% hafalan + 40% kualitas sesuai default", () => {
    expect(hitungNilaiAkhirTahfidz(90, 80, 60)).toBe(86); // 90*0.6 + 80*0.4 = 54+32 = 86
  });

  it("null kalau salah satu komponen belum ada", () => {
    expect(hitungNilaiAkhirTahfidz(null, 80, 60)).toBeNull();
    expect(hitungNilaiAkhirTahfidz(90, null, 60)).toBeNull();
  });
});

describe("buatIndeksPeriode", () => {
  const periode: PeriodeRingkas[] = [
    { id: "p-2026-genap", tahun_ajaran: "2026/2027", semester: "genap" },
    { id: "p-2025-genap", tahun_ajaran: "2025/2026", semester: "genap" },
    { id: "p-2026-ganjil", tahun_ajaran: "2026/2027", semester: "ganjil" },
    { id: "p-2025-ganjil", tahun_ajaran: "2025/2026", semester: "ganjil" },
  ];

  it("mengurutkan tahun ajaran dulu, baru ganjil sebelum genap", () => {
    const idx = buatIndeksPeriode(periode);
    expect(idx.get("p-2025-ganjil")).toBe(0);
    expect(idx.get("p-2025-genap")).toBe(1);
    expect(idx.get("p-2026-ganjil")).toBe(2);
    expect(idx.get("p-2026-genap")).toBe(3);
  });
});

describe("hitungTotalAyatUnik", () => {
  it("0 jika baris kosong", () => {
    expect(hitungTotalAyatUnik([])).toBe(0);
  });

  it("1 setoran menghitung rentang ayat dengan tepat", () => {
    expect(hitungTotalAyatUnik([{ juz: 28, surat_no: 58, ayat_awal: 1, ayat_akhir: 10 }])).toBe(10);
  });

  it("setoran bersambung (1-10 lalu 11-20) digabung tanpa celah", () => {
    expect(
      hitungTotalAyatUnik([
        { juz: 28, surat_no: 58, ayat_awal: 1, ayat_akhir: 10 },
        { juz: 28, surat_no: 58, ayat_awal: 11, ayat_akhir: 20 },
      ]),
    ).toBe(20);
  });

  it("setoran bertumpuk/muraja'ah (1-10 lalu 1-10 lagi) tidak dihitung ganda", () => {
    expect(
      hitungTotalAyatUnik([
        { juz: 28, surat_no: 58, ayat_awal: 1, ayat_akhir: 10 },
        { juz: 28, surat_no: 58, ayat_awal: 1, ayat_akhir: 10 },
      ]),
    ).toBe(10);
  });

  it("setoran dengan jeda ayat (1-10 lalu 15-20)", () => {
    expect(
      hitungTotalAyatUnik([
        { juz: 28, surat_no: 58, ayat_awal: 1, ayat_akhir: 10 },
        { juz: 28, surat_no: 58, ayat_awal: 15, ayat_akhir: 20 },
      ]),
    ).toBe(16); // 10 + 6 = 16
  });

  it("surat berbeda dihitung masing-masing", () => {
    expect(
      hitungTotalAyatUnik([
        { juz: 28, surat_no: 58, ayat_awal: 1, ayat_akhir: 10 },
        { juz: 28, surat_no: 59, ayat_awal: 1, ayat_akhir: 15 },
      ]),
    ).toBe(25);
  });
});

describe("hitungRekapHafalan", () => {
  const masterJuz28 = [
    { juz: 28, surat_no: 58, ayat_awal: 1, ayat_akhir: 22 },
    { juz: 28, surat_no: 59, ayat_awal: 1, ayat_akhir: 24 },
  ];

  it("menangani kasus riwayat setoran per potongan ayat untuk surat yang sama", () => {
    const baris = [
      { juz: 28, surat_no: 58, ayat_awal: 1, ayat_akhir: 10, nilai: 80 },
      { juz: 28, surat_no: 58, ayat_awal: 11, ayat_akhir: 20, nilai: 90 },
    ];
    const rekap = hitungRekapHafalan(baris, masterJuz28);

    expect(rekap.jumlahSurat).toBe(1); // Tetap 1 surat walau 2 setoran
    expect(rekap.totalAyat).toBe(20);
    expect(rekap.rataRata).toBe(85);
    expect(rekap.juzPenuh).toBe(0);
    expect(rekap.juzSebagian).toBe(1);
  });

  it("menghitung 1 juz penuh jika seluruh surat di juz tercakup sampai batas akhir", () => {
    const baris = [
      { juz: 28, surat_no: 58, ayat_awal: 1, ayat_akhir: 22, nilai: 85 },
      { juz: 28, surat_no: 59, ayat_awal: 1, ayat_akhir: 24, nilai: 95 },
    ];
    const rekap = hitungRekapHafalan(baris, masterJuz28);

    expect(rekap.jumlahSurat).toBe(2);
    expect(rekap.totalAyat).toBe(46);
    expect(rekap.rataRata).toBe(90);
    expect(rekap.juzPenuh).toBe(1);
    expect(rekap.juzSebagian).toBe(0);
  });
});
