import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { parseNilaiSheet } from "./nilai-import";

const INDIKATOR = [
  { id: "ind-1", nama: "Fluency" },
  { id: "ind-2", nama: "Grammar" },
];

function buatSheet(header: string[], baris: (string | number)[][]): ExcelJS.Worksheet {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Nilai");
  sheet.addRow(header);
  for (const b of baris) sheet.addRow(b);
  return sheet;
}

describe("parseNilaiSheet", () => {
  it("membaca nilai per indikator berdasarkan NIS", () => {
    const sheet = buatSheet(
      ["No", "NIS", "Nama", "Kelas", "Kelompok", "Fluency", "Grammar"],
      [[1, "12345", "Ahmad", "VII.1", "", 90, 85]],
    );
    const hasil = parseNilaiSheet(sheet, INDIKATOR);
    expect(hasil.fatal).toBeUndefined();
    expect(hasil.baris).toEqual([{ nis: "12345", nilai: { "ind-1": 90, "ind-2": 85 }, nomor: 2 }]);
    expect(hasil.peringatan).toHaveLength(0);
  });

  it("sel kosong dianggap tidak diubah (bukan 0)", () => {
    const sheet = buatSheet(["NIS", "Fluency", "Grammar"], [["12345", 90, ""]]);
    const hasil = parseNilaiSheet(sheet, INDIKATOR);
    expect(hasil.baris[0].nilai).toEqual({ "ind-1": 90 });
  });

  it("nilai di luar 0-100 atau bukan angka dilewati dengan peringatan, baris lain tetap jalan", () => {
    const sheet = buatSheet(
      ["NIS", "Fluency", "Grammar"],
      [
        ["111", 150, 50],
        ["222", "abc", 70],
      ],
    );
    const hasil = parseNilaiSheet(sheet, INDIKATOR);
    expect(hasil.baris).toEqual([
      { nis: "111", nilai: { "ind-2": 50 }, nomor: 2 },
      { nis: "222", nilai: { "ind-2": 70 }, nomor: 3 },
    ]);
    expect(hasil.peringatan).toHaveLength(2);
  });

  it("kolom header yang tidak cocok indikator mana pun dilaporkan sebagai tak dikenali", () => {
    const sheet = buatSheet(["NIS", "Fluency", "Kolom Aneh"], [["111", 80, 1]]);
    const hasil = parseNilaiSheet(sheet, INDIKATOR);
    expect(hasil.kolomTakDikenali).toEqual(["Kolom Aneh"]);
  });

  it("fatal kalau kolom NIS tidak ada", () => {
    const sheet = buatSheet(["Nama", "Fluency"], [["Ahmad", 80]]);
    const hasil = parseNilaiSheet(sheet, INDIKATOR);
    expect(hasil.fatal).toMatch(/NIS/);
  });

  it("baris kosong (NIS kosong) dilewati tanpa error", () => {
    const sheet = buatSheet(["NIS", "Fluency"], [["", ""], ["111", 80]]);
    const hasil = parseNilaiSheet(sheet, INDIKATOR);
    expect(hasil.baris).toHaveLength(1);
    expect(hasil.baris[0].nis).toBe("111");
  });
});
