import { describe, expect, it } from "vitest";
import { buatIndeksPeriode, hitungNilaiAkhirStandar, hitungNilaiAkhirTahfidz, type PeriodeRingkas } from "./hitung";

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
