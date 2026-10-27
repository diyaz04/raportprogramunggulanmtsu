import "server-only";
import ExcelJS from "exceljs";
import { getIndikatorProgram } from "@/lib/data/indikator";
import { getPengaturan, getPeriodeList, labelPeriode } from "@/lib/data/master";
import { getKehadiranProgram } from "@/lib/data/modul-khusus";
import { getPesertaProgram, getProgramList, type ProgramDenganJumlah } from "@/lib/data/program";
import { getRaporSatu, rakitDataRapor, STATUS_RAPOR_LABEL, type RaporData, type StatusRapor } from "@/lib/data/rapor";
import { getHafalanSiswa, getSemuaSuratPerJuz, hitungRekapHafalan } from "@/lib/data/tahfidz";

const WARNA_HEADER = "FFD1FAE5"; // hijau muda, sama seperti template import siswa
const WARNA_DI_BAWAH_KKTP = "FFFCE7F3"; // merah muda pastel

// `rakitDataRapor` per siswa lumayan berat (banyak sub-query) dan dipanggil ratusan kali
// buat leger sekolah penuh — batasi berapa banyak yang jalan BERSAMAAN biar nggak nge-flood
// koneksi Supabase, tapi tetap jauh lebih cepat daripada 1-per-1 sekuensial.
const BATAS_KONKUREN = 8;

async function petaTerbatas<T, R>(items: T[], batas: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const hasil: R[] = new Array(items.length);
  let berikut = 0;
  async function pekerja() {
    while (berikut < items.length) {
      const i = berikut++;
      hasil[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(batas, items.length) }, pekerja));
  return hasil;
}

type HasilPeserta = { data: RaporData; status: StatusRapor } | null;

function setelHeader(row: ExcelJS.Row) {
  row.font = { bold: true };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: WARNA_HEADER } };
  row.alignment = { vertical: "middle", wrapText: true };
  row.eachCell((cell) => {
    cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  });
}

function beriBorderSemua(sheet: ExcelJS.Worksheet, dariBaris: number) {
  sheet.eachRow((row, nomor) => {
    if (nomor < dariBaris) return;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    });
  });
}

/** Cache per peserta_program_id — dipakai BERSAMA antar sheet (Rekap + sheet per-program) biar
 * siswa yang sama nggak di-`rakitDataRapor` ulang dua kali buat 1x generate leger. */
async function ambilDataPeserta(cache: Map<string, HasilPeserta>, pesertaProgramId: string): Promise<HasilPeserta> {
  const dicache = cache.get(pesertaProgramId);
  if (dicache !== undefined) return dicache;

  const rapor = await getRaporSatu(pesertaProgramId);
  const status: StatusRapor = rapor?.status ?? "draft";
  const data = status === "terkunci" && rapor?.snapshot ? rapor.snapshot : await rakitDataRapor(pesertaProgramId);
  const hasil = data ? { data, status } : null;
  cache.set(pesertaProgramId, hasil);
  return hasil;
}

export async function bangunLegerWorkbook(periodeId: string, cakupanProgramId: string | null): Promise<ExcelJS.Workbook> {
  const [pengaturan, programSemua] = await Promise.all([getPengaturan(), getProgramList(periodeId)]);
  const programDipilih = cakupanProgramId ? programSemua.filter((p) => p.id === cakupanProgramId) : programSemua;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = pengaturan.nama_madrasah;
  workbook.created = new Date();

  const cache: Map<string, HasilPeserta> = new Map();

  await buatSheetRekap(workbook, programSemua, periodeId, cache);

  for (const program of programDipilih) {
    if (program.jenis === "tahfidz") {
      await buatSheetTahfidz(workbook, program, periodeId, cache);
    } else {
      await buatSheetProgram(workbook, program, periodeId, cache);
    }
  }

  return workbook;
}

async function buatSheetRekap(
  workbook: ExcelJS.Workbook,
  programSemua: ProgramDenganJumlah[],
  periodeId: string,
  cache: Map<string, HasilPeserta>,
) {
  const sheet = workbook.addWorksheet("Rekap");
  const kolomProgram = programSemua.map((p) => p.kode);
  sheet.columns = [
    { header: "No", key: "no", width: 5 },
    { header: "NIS", key: "nis", width: 20, style: { numFmt: "@" } },
    { header: "NISN", key: "nisn", width: 14, style: { numFmt: "@" } },
    { header: "Nama", key: "nama", width: 28 },
    { header: "Kelas", key: "kelas", width: 10 },
    ...kolomProgram.map((kode) => ({ header: kode, key: kode, width: 10 })),
    { header: "Jml Program", key: "jml", width: 11 },
    { header: "Rata-rata", key: "rata", width: 10 },
  ];
  setelHeader(sheet.getRow(1));
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  type Baris = { nis: string; nisn: string | null; nama: string; kelas: string | null; nilai: Record<string, number | null> };
  const perSiswa = new Map<string, Baris>();

  for (const program of programSemua) {
    const peserta = await getPesertaProgram(program.id, periodeId);
    const hasilSemua = await petaTerbatas(peserta, BATAS_KONKUREN, (p) => ambilDataPeserta(cache, p.id));
    peserta.forEach((p, i) => {
      const hasil = hasilSemua[i];
      const baris = perSiswa.get(p.siswa.id) ?? { nis: p.siswa.nis, nisn: p.siswa.nisn, nama: p.siswa.nama, kelas: p.kelas_nama, nilai: {} };
      baris.nilai[program.kode] = hasil?.data.nilai_akhir ?? null;
      perSiswa.set(p.siswa.id, baris);
    });
  }

  let no = 1;
  for (const b of [...perSiswa.values()].sort((a, b2) => a.nama.localeCompare(b2.nama, "id"))) {
    const nilaiTerisi = kolomProgram.map((k) => b.nilai[k]).filter((n): n is number => n != null);
    const row: Record<string, unknown> = { no: no++, nis: b.nis, nisn: b.nisn ?? "", nama: b.nama, kelas: b.kelas ?? "" };
    for (const k of kolomProgram) row[k] = b.nilai[k] ?? "";
    row.jml = nilaiTerisi.length;
    row.rata = nilaiTerisi.length > 0 ? Math.round(nilaiTerisi.reduce((t, n) => t + n, 0) / nilaiTerisi.length) : "";
    sheet.addRow(row);
  }
  beriBorderSemua(sheet, 1);
}

async function buatSheetProgram(
  workbook: ExcelJS.Workbook,
  program: ProgramDenganJumlah,
  periodeId: string,
  cache: Map<string, HasilPeserta>,
) {
  const [peserta, indikatorSemua, kehadiranSemua] = await Promise.all([
    getPesertaProgram(program.id, periodeId),
    getIndikatorProgram(program.id, periodeId),
    getKehadiranProgram(program.id, periodeId),
  ]);
  const indikator = indikatorSemua.filter((i) => i.aktif);
  const kehadiranPerPeserta = new Map(kehadiranSemua.map((k) => [k.peserta.id, k.kehadiran]));
  const hasilSemua = await petaTerbatas(peserta, BATAS_KONKUREN, (p) => ambilDataPeserta(cache, p.id));

  const sheet = workbook.addWorksheet(program.kode.slice(0, 31));
  sheet.columns = [
    { header: "No", key: "no", width: 5 },
    { header: "NIS", key: "nis", width: 20, style: { numFmt: "@" } },
    { header: "NISN", key: "nisn", width: 14, style: { numFmt: "@" } },
    { header: "Nama", key: "nama", width: 28 },
    { header: "Kelas", key: "kelas", width: 10 },
    { header: "Kelompok", key: "kelompok", width: 14 },
    ...indikator.map((ind) => ({ header: ind.nama, key: `ind_${ind.id}`, width: 9 })),
    { header: "Jumlah", key: "jumlah", width: 9 },
    { header: "Nilai Akhir", key: "nilai_akhir", width: 10 },
    { header: "Predikat", key: "predikat", width: 9 },
    { header: "Peringkat", key: "peringkat", width: 9 },
    { header: "Sakit", key: "sakit", width: 7 },
    { header: "Izin", key: "izin", width: 7 },
    { header: "Alpa", key: "alpa", width: 7 },
    { header: "Status Rapor", key: "status", width: 12 },
  ];
  const headerRow = sheet.getRow(1);
  setelHeader(headerRow);
  indikator.forEach((_, i) => {
    headerRow.getCell(7 + i).alignment = { textRotation: 45, vertical: "middle", horizontal: "center", wrapText: true };
  });
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const kktp = program.kktp ?? 0;
  type Entri = { no: number; nama: string; nilaiAkhir: number | null; rowIdx: number };
  const entri: Entri[] = [];

  let no = 1;
  for (const [i, p] of peserta.entries()) {
    const hasil = hasilSemua[i];
    const kehadiran = kehadiranPerPeserta.get(p.id);
    const row: Record<string, unknown> = {
      no: no,
      nis: p.siswa.nis,
      nisn: p.siswa.nisn ?? "",
      nama: p.siswa.nama,
      kelas: p.kelas_nama ?? "",
      kelompok: p.kelompok_nama ?? "",
      jumlah: hasil ? hasil.data.indikator.reduce((t, i) => t + (i.nilai ?? 0), 0) : "",
      nilai_akhir: hasil?.data.nilai_akhir ?? "",
      predikat: hasil?.data.predikat ?? "",
      sakit: kehadiran?.sakit ?? "",
      izin: kehadiran?.izin ?? "",
      alpa: kehadiran?.alpa ?? "",
      status: STATUS_RAPOR_LABEL[hasil?.status ?? "draft"],
    };
    if (hasil) {
      indikator.forEach((ind, i) => {
        row[`ind_${ind.id}`] = hasil.data.indikator[i]?.nilai ?? "";
      });
    }
    const added = sheet.addRow(row);
    entri.push({ no, nama: p.siswa.nama, nilaiAkhir: hasil?.data.nilai_akhir ?? null, rowIdx: added.number });

    if (kktp > 0 && hasil?.data.nilai_akhir != null && hasil.data.nilai_akhir < kktp) {
      added.getCell("nilai_akhir").fill = { type: "pattern", pattern: "solid", fgColor: { argb: WARNA_DI_BAWAH_KKTP } };
    }
    no++;
  }

  // Peringkat berdasar nilai akhir (terbesar = 1), kosong kalau belum ada nilai.
  const terurut = [...entri].filter((e) => e.nilaiAkhir != null).sort((a, b) => (b.nilaiAkhir ?? 0) - (a.nilaiAkhir ?? 0));
  terurut.forEach((e, i) => {
    sheet.getRow(e.rowIdx).getCell("peringkat").value = i + 1;
  });

  if (entri.length > 0) {
    const rataRata = entri.filter((e) => e.nilaiAkhir != null).reduce((t, e, _, arr) => t + (e.nilaiAkhir ?? 0) / arr.length, 0);
    const rataRow = sheet.addRow({ nama: "Rata-rata kelas", nilai_akhir: Math.round(rataRata) });
    rataRow.font = { bold: true, italic: true };
  }

  beriBorderSemua(sheet, 1);
  sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
}

async function buatSheetTahfidz(
  workbook: ExcelJS.Workbook,
  program: ProgramDenganJumlah,
  periodeId: string,
  cache: Map<string, HasilPeserta>,
) {
  const [peserta, semuaSuratPerJuz, semuaPeriode] = await Promise.all([
    getPesertaProgram(program.id, periodeId),
    getSemuaSuratPerJuz(),
    getPeriodeList(),
  ]);
  const labelPerPeriode = new Map(semuaPeriode.map((p) => [p.id, labelPeriode(p)]));
  const dataSemua = await petaTerbatas(peserta, BATAS_KONKUREN, async (p) => ({
    hasil: await ambilDataPeserta(cache, p.id),
    hafalanSiswa: await getHafalanSiswa(p.siswa.id),
  }));

  const ringkas = workbook.addWorksheet("THF — Ringkas");
  ringkas.columns = [
    { header: "No", key: "no", width: 5 },
    { header: "NIS", key: "nis", width: 20, style: { numFmt: "@" } },
    { header: "Nama", key: "nama", width: 28 },
    { header: "Kelas", key: "kelas", width: 10 },
    { header: "Juz Penuh", key: "juzPenuh", width: 10 },
    { header: "Juz Sebagian", key: "juzSebagian", width: 12 },
    { header: "Jml Surat", key: "jumlahSurat", width: 10 },
    { header: "Jml Ayat", key: "totalAyat", width: 10 },
    { header: "Rata-rata", key: "rataRata", width: 10 },
    { header: "Nilai Akhir", key: "nilaiAkhir", width: 10 },
    { header: "Predikat", key: "predikat", width: 9 },
  ];
  setelHeader(ringkas.getRow(1));
  ringkas.views = [{ state: "frozen", ySplit: 1 }];

  const detail = workbook.addWorksheet("THF — Detail Hafalan");
  detail.columns = [
    { header: "Nama", key: "nama", width: 28 },
    { header: "Juz", key: "juz", width: 7 },
    { header: "Surat", key: "surat", width: 24 },
    { header: "Ayat", key: "ayat", width: 14 },
    { header: "Tanggal", key: "tanggal", width: 12 },
    { header: "Nilai", key: "nilai", width: 8 },
    { header: "Semester Setor", key: "semester", width: 14 },
    { header: "Baru", key: "baru", width: 8 },
  ];
  setelHeader(detail.getRow(1));
  detail.views = [{ state: "frozen", ySplit: 1 }];

  let no = 1;
  for (const [i, p] of peserta.entries()) {
    const { hasil, hafalanSiswa } = dataSemua[i];
    const rekap = hitungRekapHafalan(hafalanSiswa, semuaSuratPerJuz);

    ringkas.addRow({
      no: no++,
      nis: p.siswa.nis,
      nama: p.siswa.nama,
      kelas: p.kelas_nama ?? "",
      juzPenuh: rekap.juzPenuh,
      juzSebagian: rekap.juzSebagian,
      jumlahSurat: rekap.jumlahSurat,
      totalAyat: rekap.totalAyat,
      rataRata: rekap.rataRata ?? "",
      nilaiAkhir: hasil?.data.nilai_akhir ?? "",
      predikat: hasil?.data.predikat ?? "",
    });

    for (const h of hafalanSiswa) {
      detail.addRow({
        nama: p.siswa.nama,
        juz: h.juz,
        surat: h.nama_latin,
        ayat: `${h.ayat_awal}-${h.ayat_akhir}`,
        tanggal: h.tanggal ?? "",
        nilai: h.nilai ?? "",
        semester: labelPerPeriode.get(h.periode_setor_id) ?? "",
        baru: h.periode_setor_id === periodeId ? "Ya" : "",
      });
    }
  }

  beriBorderSemua(ringkas, 1);
  beriBorderSemua(detail, 1);
}
