import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import { filterBarisKelompok, getGridNilai } from "@/lib/data/nilai";
import { getKelompokIzinGuru, getProgramByKode } from "@/lib/data/program";

// Unduh Excel terisi nilai saat ini (bukan template kosong) — supaya guru tinggal mengoreksi
// di Excel lalu import ulang. Kolom NIS dipakai untuk mencocokkan baris saat diimpor kembali.
export async function GET(request: Request, { params }: { params: Promise<{ kode: string }> }) {
  const user = await getCurrentUser();
  const { kode } = await params;

  const program = await getProgramByKode(kode);
  if (!program) return new Response("Program tidak ditemukan", { status: 404 });

  const url = new URL(request.url);
  const periodeId = url.searchParams.get("periode");
  const tingkatParam = url.searchParams.get("tingkat");
  const tingkat = tingkatParam ? Number(tingkatParam) : null;
  const daftarPeriode = await getPeriodeList();
  const periode = daftarPeriode.find((p) => p.id === periodeId) ?? daftarPeriode.find((p) => p.aktif) ?? daftarPeriode[0];
  if (!periode) return new Response("Periode tidak ditemukan", { status: 404 });

  const kelompokIzin = user.role === "guru" ? await getKelompokIzinGuru(program.id, periode.id, user.id) : "semua";
  if (kelompokIzin !== "semua" && kelompokIzin.length === 0) {
    return new Response("Anda belum ditugaskan ke program ini", { status: 403 });
  }

  const { baris: semuaBaris, kolom } = await getGridNilai(program.id, periode.id, tingkat);
  const baris = filterBarisKelompok(semuaBaris, kelompokIzin);
  if (kolom.length === 0) return new Response("Belum ada indikator aktif untuk program ini", { status: 400 });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Nilai");
  sheet.columns = [
    { header: "No", key: "no", width: 5 },
    { header: "NIS", key: "nis", width: 20, style: { numFmt: "@" } },
    { header: "Nama", key: "nama", width: 28 },
    { header: "Kelas", key: "kelas", width: 10 },
    { header: "Kelompok", key: "kelompok", width: 14 },
    ...kolom.map((k) => ({ header: k.nama, key: `ind_${k.id}`, width: 10 })),
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
  headerRow.alignment = { vertical: "middle", wrapText: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  baris.forEach((b, i) => {
    const row: Record<string, unknown> = {
      no: i + 1,
      nis: b.siswa.nis,
      nama: b.siswa.nama,
      kelas: b.kelas_nama ?? "",
      kelompok: b.kelompok_nama ?? "",
    };
    for (const k of kolom) row[`ind_${k.id}`] = b.nilai[k.id]?.nilai ?? "";
    sheet.addRow(row);
  });

  sheet.getColumn(1).eachCell({ includeEmpty: true }, (cell) => {
    cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  });

  const petunjuk = workbook.addWorksheet("Petunjuk");
  petunjuk.getColumn(1).width = 95;
  [
    "PETUNJUK PENGISIAN",
    "",
    `1. Kolom nilai berisi angka 0-100. Kosongkan sel kalau belum mau diisi/diubah — sel kosong TIDAK menghapus nilai yang sudah ada.`,
    "2. Kolom NIS WAJIB tidak diubah — dipakai untuk mencocokkan baris saat file ini diimpor kembali.",
    "3. Jangan ubah nama kolom header (nama indikator). Kolom yang namanya tidak cocok akan diabaikan saat import.",
    "4. Baris yang NIS-nya tidak ditemukan (atau di luar kelompok Anda) akan dilewati dan dilaporkan setelah import.",
  ].forEach((teks, i) => {
    const row = petunjuk.getRow(i + 1);
    row.getCell(1).value = teks;
    if (i === 0) row.font = { bold: true, size: 13 };
    row.getCell(1).alignment = { wrapText: true, vertical: "top" };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const suffixTingkat = tingkat ? `_Kelas_${tingkat}` : "";
  const namaFile = `Nilai_${program.kode}${suffixTingkat}_${labelPeriode(periode).replace(/[^a-zA-Z0-9]+/g, "_")}.xlsx`;

  return new Response(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${namaFile}"`,
    },
  });
}
