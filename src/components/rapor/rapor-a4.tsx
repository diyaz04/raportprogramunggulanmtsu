import type { SkalaPredikat } from "@/lib/data/indikator";
import type { RaporData } from "@/lib/data/rapor";
import { BlokTandaTangan } from "./blok-tanda-tangan";
import { KopRapor } from "./kop-rapor";
import { TabelHafalan } from "./tabel-hafalan";
import { TabelIndikator } from "./tabel-indikator";
import { Watermark } from "./watermark";

// MTs (tingkat 7-9) selalu Fase D di Kurikulum Merdeka — tetap, tidak perlu tabel lookup.
const FASE_MTS = "D";

export function RaporA4({
  data,
  skala,
  qrDataUrl,
  kodeVerifikasi,
  catatanTampil,
  catatanTerjemahanTampil,
}: {
  data: RaporData;
  skala: SkalaPredikat[];
  qrDataUrl: string | null;
  kodeVerifikasi: string | null;
  /** Catatan yang ditampilkan: `catatan_final` kalau sudah diedit guru, kalau belum pakai `catatan_auto`. */
  catatanTampil: string | null;
  catatanTerjemahanTampil: string | null;
}) {
  const rtlUtama = data.program.bahasa_utama === "ar";

  return (
    <div
      className="relative mx-auto aspect-[210/297] w-full max-w-[210mm] bg-white p-[12mm] text-[11px] text-black print:aspect-auto print:min-h-[297mm] print:shadow-none"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {data.pengaturan.watermark_aktif ? <Watermark teks={data.pengaturan.watermark_teks} /> : null}

      <div className="relative z-10 grid gap-3">
        <KopRapor {...data.pengaturan} />

        <div className="grid grid-cols-2 gap-x-6 text-[0.95em]">
          <IdentitasBaris label="Nama" value={data.siswa.nama} />
          <IdentitasBaris label="Kelas" value={data.kelas_nama ?? "—"} />
          <IdentitasBaris label="NIS/NISN" value={`${data.siswa.nis} / ${data.siswa.nisn ?? "—"}`} />
          <IdentitasBaris label="Fase" value={FASE_MTS} />
          <IdentitasBaris label="Madrasah" value={data.pengaturan.nama_madrasah} />
          <IdentitasBaris label="Semester" value={data.periode.semester === "ganjil" ? "Ganjil" : "Genap"} />
          <IdentitasBaris label="Program" value={data.kelompok_nama ? `${data.program.nama} (${data.kelompok_nama})` : data.program.nama} />
          <IdentitasBaris label="Tahun Ajaran" value={data.periode.tahun_ajaran} />
          {data.riset ? <IdentitasBaris label="Judul Penelitian" value={data.riset.judul ?? "—"} /> : null}
          {data.riset ? <IdentitasBaris label="Tahap" value={data.riset.tahapLabel} /> : null}
        </div>

        <div className="text-center">
          <p className="font-bold uppercase">Capaian Hasil Belajar</p>
          <p className="font-bold uppercase">Program Unggulan {data.program.judul_rapor}</p>
          {data.program.nama_arab ? (
            <p className="font-arabic font-bold" dir="rtl">
              {data.program.nama_arab}
            </p>
          ) : null}
        </div>

        {data.tahfidz ? <TabelHafalan hafalan={data.tahfidz.hafalan} rekap={data.tahfidz.rekap} skala={skala} /> : null}

        <div className="grid gap-1">
          {data.tahfidz ? <p className="font-semibold">B. Kualitas Bacaan &amp; Hafalan</p> : null}
          <TabelIndikator
            indikator={data.indikator}
            bahasaUtama={data.program.bahasa_utama}
            jenis={data.program.jenis}
            tampilkanTerjemahan={data.program.tampilkan_terjemahan}
            skala={skala}
            nilaiAkhir={data.nilai_akhir}
            predikatAkhir={data.predikat}
          />
        </div>

        {data.prestasi.length > 0 ? (
          <div className="grid gap-1">
            <p className="font-semibold">Prestasi</p>
            <table className="w-full border-collapse text-[0.8em]">
              <thead>
                <tr className="border border-black">
                  <th className="w-8 border border-black p-1">No</th>
                  <th className="border border-black p-1 text-left">Jenis Prestasi</th>
                  <th className="border border-black p-1 text-left">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {data.prestasi.map((p, i) => (
                  <tr key={i} className="border border-black">
                    <td className="border border-black p-1 text-center">{i + 1}</td>
                    <td className="border border-black p-1">{p.nama_lomba}</td>
                    <td className="border border-black p-1">
                      {p.tingkat}
                      {p.peringkat ? ` — ${p.peringkat}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {data.kehadiran ? (
          <div className="grid gap-1">
            <p className="font-semibold">Ketidakhadiran</p>
            <p className="text-[0.9em]">
              Sakit {data.kehadiran.sakit} hari · Izin {data.kehadiran.izin} hari · Alpa {data.kehadiran.alpa} hari
            </p>
          </div>
        ) : null}

        <div className="grid gap-1">
          <p className="font-semibold">Catatan Guru Program</p>
          <div className="min-h-16 rounded border border-black p-2 text-[0.9em]" dir={rtlUtama ? "rtl" : undefined}>
            <p className={rtlUtama ? "font-arabic" : undefined}>{catatanTampil ?? "—"}</p>
            {data.program.tampilkan_terjemahan && catatanTerjemahanTampil ? (
              <p className="mt-1 italic" dir="ltr">
                {catatanTerjemahanTampil}
              </p>
            ) : null}
          </div>
        </div>

        <BlokTandaTangan
          guru={data.penanda_tangan}
          kepalaNama={data.pengaturan.kepala_nama}
          kepalaNip={data.pengaturan.kepala_nip}
          kota={data.pengaturan.kota}
          tanggalRapor={data.periode.tanggal_rapor}
        />

        <div className="mt-2 flex items-end justify-between text-[0.75em]">
          <div className="grid gap-1">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- data URL base64, tidak perlu next/image
              <img src={qrDataUrl} alt="QR verifikasi" className="size-16" />
            ) : null}
            {kodeVerifikasi ? <p>Kode: {kodeVerifikasi}</p> : null}
          </div>
          <p>
            {data.kelas_nama ?? "—"} _ {data.siswa.nama} _ {data.siswa.nisn ?? data.siswa.nis} _ {data.program.kode}
          </p>
        </div>
      </div>
    </div>
  );
}

function IdentitasBaris({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="inline-block w-28">{label}</span>: {value}
    </p>
  );
}

