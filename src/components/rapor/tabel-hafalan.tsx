import { hitungPredikat, type PredikatKode } from "@/lib/deskripsi/engine";
import type { SkalaPredikat } from "@/lib/data/indikator";
import type { RaporData } from "@/lib/data/rapor";
import { labelPredikat } from "./tabel-indikator";

type BarisHafalan = NonNullable<RaporData["tahfidz"]>["hafalan"][number];

/** Tabel "A. Capaian Hafalan" per PERENCANAAN §5.2a — daftar surat kumulatif, bukan 2 kolom
 * berdampingan seperti rancangan cetak aslinya (disederhanakan untuk versi pertama). */
export function TabelHafalan({ hafalan, rekap, skala }: { hafalan: BarisHafalan[]; rekap: NonNullable<RaporData["tahfidz"]>["rekap"]; skala: SkalaPredikat[] }) {
  return (
    <div className="grid gap-1">
      <p className="font-semibold">A. Capaian Hafalan</p>
      <table className="w-full border-collapse text-[0.8em]">
        <thead>
          <tr className="border border-black">
            <th className="w-8 border border-black p-1">No</th>
            <th className="w-10 border border-black p-1">Juz</th>
            <th className="border border-black p-1 text-left">Surat</th>
            <th className="w-20 border border-black p-1">Ayat</th>
            <th className="w-16 border border-black p-1">Tanggal</th>
            <th className="w-10 border border-black p-1">Nilai</th>
            <th className="w-24 border border-black p-1">Predikat</th>
          </tr>
        </thead>
        <tbody>
          {hafalan.map((h, i) => {
            const predikat: PredikatKode | null = h.nilai != null ? hitungPredikat(h.nilai, skala) : null;
            return (
              <tr key={i} className="border border-black">
                <td className="border border-black p-1 text-center">{i + 1}</td>
                <td className="border border-black p-1 text-center">{h.juz}</td>
                <td className="border border-black p-1">
                  {h.nama_latin} <span dir="rtl" className="font-arabic">{h.nama_arab}</span>
                  {h.baru ? <span className="ml-1 font-semibold">(baru)</span> : null}
                </td>
                <td className="border border-black p-1 text-center">
                  {h.ayat_awal}–{h.ayat_akhir}
                </td>
                <td className="border border-black p-1 text-center">{h.tanggal ? h.tanggal.split("-").reverse().join("/") : "—"}</td>
                <td className="border border-black p-1 text-center">{h.nilai ?? "—"}</td>
                <td className="border border-black p-1 text-center">{predikat ? labelPredikat(predikat, "ar", "tahfidz", skala) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-[0.8em]">
        Kumulatif: {rekap.juzPenuh} juz penuh
        {rekap.juzSebagian > 0 ? ` + ${rekap.juzSebagian} juz sebagian` : ""} · {rekap.jumlahSurat} surat · {rekap.totalAyat} ayat
        {rekap.rataRata != null ? ` · Rata-rata ${rekap.rataRata}` : ""}
      </p>
    </div>
  );
}
