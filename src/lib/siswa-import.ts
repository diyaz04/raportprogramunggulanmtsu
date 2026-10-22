import type ExcelJS from "exceljs";
import { normalisasiJk, siswaSchema, type SiswaInput } from "./siswa-schema";

// Fungsi murni (tanpa database) supaya bisa dites terpisah.

export const MAKS_BARIS = 2000;

const ALIAS_KOLOM: Record<string, string[]> = {
  nis: ["nis"],
  nisn: ["nisn"],
  nama: ["nama", "nama siswa", "nama lengkap"],
  jk: ["jk", "l/p", "jenis kelamin"],
  nama_arab: ["nama arab"],
  kelas: ["kelas"],
};

export type BarisSiswa = { data: SiswaInput; kelas: string; nomor: number };

export type HasilParse = {
  baris: BarisSiswa[];
  galat: string[];
  adaKolomKelas: boolean;
  /** Dipakai bila struktur file salah (kolom wajib hilang / terlalu banyak baris). */
  fatal?: string;
};

/** Baca sel Excel sebagai teks, menolak angka panjang yang kehilangan digit (NIS/NISN dsb). */
export function teksSel(cell: ExcelJS.Cell, namaKolom: string, baris: number): string {
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "number") {
    if (!Number.isSafeInteger(v)) {
      throw new Error(
        `Baris ${baris}: kolom ${namaKolom} terbaca sebagai angka yang kehilangan digit. Ubah format kolom menjadi Teks lalu isi ulang.`,
      );
    }
    return String(v);
  }
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object" && "richText" in v) return v.richText.map((r) => r.text).join("");
  if (typeof v === "object" && "text" in v) return String(v.text);
  if (typeof v === "object" && "result" in v) return String(v.result ?? "");
  return String(v);
}

/**
 * Tebak tingkat (7/8/9) dari nama kelas, buat auto-bikin kelas baru saat import kalau
 * namanya belum ada di periode aktif (mis. "VII.1" -> 7, "VIII-A" -> 8, "9C" -> 9).
 * null kalau tidak bisa ditebak (nama kelas tidak diawali VII/VIII/IX atau 7/8/9).
 */
export function deteksiTingkatKelas(nama: string): number | null {
  const n = nama.trim().toUpperCase();
  if (/^VIII(?![A-Z])/.test(n)) return 8;
  if (/^IX(?![A-Z])/.test(n)) return 9;
  if (/^VII(?![A-Z])/.test(n)) return 7;
  const angka = n.match(/^([789])(?!\d)/);
  return angka ? Number(angka[1]) : null;
}

export function parseSiswaSheet(sheet: ExcelJS.Worksheet): HasilParse {
  // Peta nama kolom -> nomor kolom, dari baris header (baris 1).
  const kolom = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, nomor) => {
    const judul = String(cell.text ?? "").trim().toLowerCase();
    for (const [kunci, alias] of Object.entries(ALIAS_KOLOM)) {
      if (alias.includes(judul)) kolom.set(kunci, nomor);
    }
  });

  const hilang = ["nis", "nama", "jk"].filter((k) => !kolom.has(k));
  if (hilang.length > 0) {
    return {
      baris: [],
      galat: [],
      adaKolomKelas: false,
      fatal: `Kolom wajib tidak ditemukan: ${hilang.join(", ").toUpperCase()}. Gunakan template dari tombol "Unduh template".`,
    };
  }

  if (sheet.actualRowCount - 1 > MAKS_BARIS) {
    return { baris: [], galat: [], adaKolomKelas: false, fatal: `Maksimal ${MAKS_BARIS} baris per import` };
  }

  const galat: string[] = [];
  const baris: BarisSiswa[] = [];
  const nisTerlihat = new Set<string>();

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    try {
      const ambil = (k: string) => (kolom.has(k) ? teksSel(row.getCell(kolom.get(k)!), k.toUpperCase(), r) : "");
      const nis = ambil("nis");
      const nama = ambil("nama");
      if (!nis.trim() && !nama.trim()) continue; // baris kosong

      const jk = normalisasiJk(ambil("jk"));
      const parsed = siswaSchema.safeParse({
        nis,
        nisn: ambil("nisn"),
        nama,
        jk: jk ?? undefined,
        nama_arab: ambil("nama_arab"),
      });

      if (!parsed.success) {
        galat.push(`Baris ${r}: ${parsed.error.issues[0].message}`);
        continue;
      }
      if (nisTerlihat.has(parsed.data.nis)) {
        galat.push(`Baris ${r}: NIS ${parsed.data.nis} muncul lebih dari sekali di file`);
        continue;
      }
      nisTerlihat.add(parsed.data.nis);
      baris.push({ data: parsed.data, kelas: ambil("kelas").trim(), nomor: r });
    } catch (e) {
      galat.push(e instanceof Error ? e.message : `Baris ${r}: tidak bisa dibaca`);
    }
  }

  return { baris, galat, adaKolomKelas: kolom.has("kelas") && baris.some((b) => b.kelas) };
}
