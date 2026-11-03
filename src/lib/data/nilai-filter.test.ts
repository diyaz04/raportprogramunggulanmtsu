import { describe, expect, it } from "vitest";
import { filterBarisIzin, type IzinAksesGuru } from "./filter-izin";

describe("filterBarisIzin", () => {
  const mockSiswa = [
    { id: "p1", nama: "Ahmad", kelas_id: "k-7a", kelompok_id: null },
    { id: "p2", nama: "Budi", kelas_id: "k-7b", kelompok_id: null },
    { id: "p3", nama: "Citra", kelas_id: "k-8a", kelompok_id: "g-tahfidz-1" },
    { id: "p4", nama: "Dewi", kelas_id: "k-8b", kelompok_id: "g-tahfidz-2" },
  ];

  it("mengembalikan semua baris jika guru memiliki izin seluruh program", () => {
    const izin: IzinAksesGuru = { semua: true, kelompokIds: [], kelasIds: [] };
    const hasil = filterBarisIzin(mockSiswa, izin);
    expect(hasil).toHaveLength(4);
  });

  it("hanya mengembalikan siswa dari kelas yang ditugaskan", () => {
    const izin: IzinAksesGuru = { semua: false, kelompokIds: [], kelasIds: ["k-7a"] };
    const hasil = filterBarisIzin(mockSiswa, izin);
    expect(hasil).toHaveLength(1);
    expect(hasil[0].nama).toBe("Ahmad");
  });

  it("mendukung penugasan multi-kelas", () => {
    const izin: IzinAksesGuru = { semua: false, kelompokIds: [], kelasIds: ["k-7a", "k-7b"] };
    const hasil = filterBarisIzin(mockSiswa, izin);
    expect(hasil).toHaveLength(2);
    expect(hasil.map((s) => s.nama)).toEqual(["Ahmad", "Budi"]);
  });

  it("mendukung penugasan per kelompok", () => {
    const izin: IzinAksesGuru = { semua: false, kelompokIds: ["g-tahfidz-1"], kelasIds: [] };
    const hasil = filterBarisIzin(mockSiswa, izin);
    expect(hasil).toHaveLength(1);
    expect(hasil[0].nama).toBe("Citra");
  });

  it("mengembalikan array kosong jika guru belum ditugaskan", () => {
    const izin: IzinAksesGuru = { semua: false, kelompokIds: [], kelasIds: [] };
    const hasil = filterBarisIzin(mockSiswa, izin);
    expect(hasil).toHaveLength(0);
  });
});
