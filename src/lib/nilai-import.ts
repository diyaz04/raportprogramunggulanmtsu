import type ExcelJS from "exceljs";
import { teksSel } from "./siswa-import";

// Fungsi murni (tanpa database) supaya bisa dites terpisah.
// Beda dari import siswa: nilai yang keliru di sini cuma DIPERINGATKAN (baris/sel itu dilewati),
// bukan membatalkan seluruh import — import nilai rutin & bervolume besar, satu salah ketik
// nggak boleh menggagalkan puluhan baris lain yang sudah benar.

export type KolomIndikatorImport = { id: string; nama: string };
export type BarisNilaiImport = { nis: string; nilai: Record<string, number>; nomor: number };

export type HasilParseNilai = {
  baris: BarisNilaiImport[];
  peringatan: string[];
  kolomTakDikenali: string[];
  fatal?: string;
};

export const MAKS_BARIS_NILAI = 2000;
const KOLOM_ABAIKAN = new Set(["no", "nama", "kelas", "kelompok"]);

export function parseNilaiSheet(sheet: ExcelJS.Worksheet, indikator: KolomIndikatorImport[]): HasilParseNilai {
  const headerRow = sheet.getRow(1);
  let nomorNis: number | null = null;
  const kolomPerIndikator = new Map<number, string>();
  const kolomTakDikenali: string[] = [];

  headerRow.eachCell((cell, nomor) => {
    const judul = String(cell.text ?? "").trim();
    if (!judul) return;
    if (judul.toLowerCase() === "nis") {
      nomorNis = nomor;
      return;
    }
    const cocok = indikator.find((i) => i.nama.trim().toLowerCase() === judul.toLowerCase());
    if (cocok) kolomPerIndikator.set(nomor, cocok.id);
    else if (!KOLOM_ABAIKAN.has(judul.toLowerCase())) kolomTakDikenali.push(judul);
  });

  if (nomorNis === null) {
    return {
      baris: [],
      peringatan: [],
      kolomTakDikenali: [],
      fatal: 'Kolom "NIS" tidak ditemukan. Gunakan file hasil "Unduh Excel" di halaman ini, jangan ubah nama kolomnya.',
    };
  }
  const kolomNis: number = nomorNis;

  if (sheet.actualRowCount - 1 > MAKS_BARIS_NILAI) {
    return { baris: [], peringatan: [], kolomTakDikenali: [], fatal: `Maksimal ${MAKS_BARIS_NILAI} baris per import` };
  }

  const peringatan: string[] = [];
  const baris: BarisNilaiImport[] = [];

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    try {
      const nis = teksSel(row.getCell(kolomNis), "NIS", r).trim();
      if (!nis) continue; // baris kosong

      const nilai: Record<string, number> = {};
      for (const [nomorKolom, indikatorId] of kolomPerIndikator) {
        const teks = teksSel(row.getCell(nomorKolom), "nilai", r).trim();
        if (teks === "") continue; // kosong = tidak diubah

        const angka = Number(teks);
        if (!Number.isInteger(angka) || angka < 0 || angka > 100) {
          peringatan.push(`Baris ${r} (NIS ${nis}): nilai "${teks}" dilewati, harus angka bulat 0-100`);
          continue;
        }
        nilai[indikatorId] = angka;
      }
      baris.push({ nis, nilai, nomor: r });
    } catch (e) {
      peringatan.push(e instanceof Error ? e.message : `Baris ${r}: tidak bisa dibaca`);
    }
  }

  return { baris, peringatan, kolomTakDikenali };
}
