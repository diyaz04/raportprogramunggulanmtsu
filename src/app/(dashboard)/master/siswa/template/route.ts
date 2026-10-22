import ExcelJS from "exceljs";

// Template import siswa. Kolom NIS/NISN diformat Teks supaya angka panjang tidak rusak di Excel.
export async function GET() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Siswa");

  sheet.columns = [
    { header: "NIS", key: "nis", width: 24, style: { numFmt: "@" } },
    { header: "NISN", key: "nisn", width: 16, style: { numFmt: "@" } },
    { header: "Nama", key: "nama", width: 34 },
    { header: "JK", key: "jk", width: 8 },
    { header: "Nama Arab", key: "nama_arab", width: 28 },
    { header: "Kelas", key: "kelas", width: 12 },
  ];

  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
  header.alignment = { vertical: "middle" };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  // Baris contoh (hapus sebelum mengisi data asli).
  sheet.addRow({ nis: "121232060183247001", nisn: "0123456789", nama: "CONTOH NAMA SISWA", jk: "L", nama_arab: "", kelas: "VII.1" });
  sheet.getRow(2).font = { italic: true, color: { argb: "FF9CA3AF" } };

  const petunjuk = workbook.addWorksheet("Petunjuk");
  petunjuk.getColumn(1).width = 90;
  [
    "PETUNJUK PENGISIAN",
    "",
    "1. Isi data mulai baris 2 pada sheet 'Siswa'. HAPUS baris contoh (abu-abu) sebelum mengimpor.",
    "2. Kolom wajib: NIS, Nama, JK. Kolom NISN, Nama Arab, dan Kelas boleh dikosongkan.",
    "3. JK diisi L atau P (boleh juga 'Laki-laki' / 'Perempuan').",
    "4. NISN terdiri dari 10 digit angka.",
    "5. Kolom NIS dan NISN sudah berformat Teks. Jangan ubah ke format Angka karena digit panjang bisa terpotong Excel.",
    "6. Kolom Kelas (opsional) otomatis dibuat kalau belum ada di periode AKTIF, asalkan namanya diawali VII/VIII/IX atau 7/8/9 (mis. VII.1, VIII-A, 9C).",
    "7. NIS yang sudah ada akan DIPERBARUI (bukan dobel). Jika ada satu baris yang salah, seluruh import dibatalkan.",
  ].forEach((teks, i) => {
    const row = petunjuk.getRow(i + 1);
    row.getCell(1).value = teks;
    if (i === 0) row.font = { bold: true, size: 13 };
    row.getCell(1).alignment = { wrapText: true, vertical: "top" };
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return new Response(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-import-siswa.xlsx"',
    },
  });
}
