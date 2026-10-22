import { describe, expect, it } from "vitest";
import { deteksiTingkatKelas } from "./siswa-import";

describe("deteksiTingkatKelas", () => {
  it("mengenali awalan Romawi", () => {
    expect(deteksiTingkatKelas("VII.1")).toBe(7);
    expect(deteksiTingkatKelas("VIII-A")).toBe(8);
    expect(deteksiTingkatKelas("IX.2")).toBe(9);
  });

  it("tidak salah baca VIII sebagai VII (VII adalah awalan huruf dari VIII)", () => {
    expect(deteksiTingkatKelas("VIII.1")).toBe(8);
    expect(deteksiTingkatKelas("VIII A")).toBe(8);
  });

  it("mengenali awalan angka", () => {
    expect(deteksiTingkatKelas("7.1")).toBe(7);
    expect(deteksiTingkatKelas("8A")).toBe(8);
    expect(deteksiTingkatKelas("9-C")).toBe(9);
  });

  it("tidak peduli huruf besar/kecil", () => {
    expect(deteksiTingkatKelas("vii.1")).toBe(7);
  });

  it("null kalau nama kelas tidak diawali tingkat yang dikenali", () => {
    expect(deteksiTingkatKelas("A.1")).toBeNull();
    expect(deteksiTingkatKelas("Unggulan 1")).toBeNull();
    expect(deteksiTingkatKelas("10.1")).toBeNull();
  });
});
