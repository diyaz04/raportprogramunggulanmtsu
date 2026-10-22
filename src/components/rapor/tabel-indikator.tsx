import type { PredikatKode } from "@/lib/deskripsi/engine";
import type { SkalaPredikat } from "@/lib/data/indikator";
import type { BahasaProgram, JenisProgram } from "@/lib/data/program";
import type { RaporIndikatorBaris } from "@/lib/data/rapor";

/** Label predikat sesuai bahasa program (PERENCANAAN §3): EN untuk Bahasa Inggris, Arab untuk
 * Bahasa Arab & Tahfidz (sudah termasuk transliterasi Latin di data skala), umum untuk lainnya. */
export function labelPredikat(predikat: PredikatKode, bahasaUtama: BahasaProgram, jenis: JenisProgram, skala: SkalaPredikat[]): string {
  const s = skala.find((x) => x.kode === predikat);
  if (!s) return predikat;
  if (jenis === "tahfidz" || bahasaUtama === "ar") return s.label_ar;
  if (bahasaUtama === "en") return s.label_en;
  return s.label;
}

export function TabelIndikator({
  indikator,
  bahasaUtama,
  jenis,
  tampilkanTerjemahan,
  skala,
  nilaiAkhir,
  predikatAkhir,
}: {
  indikator: RaporIndikatorBaris[];
  bahasaUtama: BahasaProgram;
  jenis: JenisProgram;
  tampilkanTerjemahan: boolean;
  skala: SkalaPredikat[];
  nilaiAkhir: number | null;
  predikatAkhir: PredikatKode | null;
}) {
  const rtl = bahasaUtama === "ar";
  const jumlah = indikator.reduce((t, i) => t + (i.nilai ?? 0), 0);

  return (
    <table className="w-full border-collapse text-[0.8em]">
      <thead>
        <tr className="border border-black">
          <th className="w-8 border border-black p-1">No</th>
          <th className="border border-black p-1 text-left">Indikator</th>
          <th className="w-10 border border-black p-1">Nilai</th>
          <th className="w-20 border border-black p-1">Predikat</th>
          <th className="border border-black p-1 text-left">Capaian Kompetensi</th>
        </tr>
      </thead>
      <tbody>
        {indikator.map((ind, i) => (
          <tr key={i} className="border border-black align-top">
            <td className="border border-black p-1 text-center">{i + 1}</td>
            <td className="border border-black p-1">
              {ind.nama}
              {ind.nama_terjemahan ? <span className="block text-[0.9em] italic">({ind.nama_terjemahan})</span> : null}
              {ind.nama_arab ? (
                <span className="block text-[0.9em]" dir="rtl">
                  {ind.nama_arab}
                </span>
              ) : null}
            </td>
            <td className="border border-black p-1 text-center">{ind.nilai ?? "—"}</td>
            <td className="border border-black p-1 text-center">{ind.predikat ? labelPredikat(ind.predikat, bahasaUtama, jenis, skala) : "—"}</td>
            <td className="border border-black p-1" dir={rtl ? "rtl" : undefined}>
              <span className={rtl ? "font-arabic" : undefined}>{ind.capaian}</span>
              {tampilkanTerjemahan && ind.capaian_terjemahan ? <span className="mt-0.5 block italic" dir="ltr">{ind.capaian_terjemahan}</span> : null}
            </td>
          </tr>
        ))}
        <tr className="border border-black font-semibold">
          <td colSpan={2} className="border border-black p-1 text-right">
            Jumlah
          </td>
          <td className="border border-black p-1 text-center">{jumlah}</td>
          <td colSpan={2} className="border border-black p-1" />
        </tr>
        <tr className="border border-black font-semibold">
          <td colSpan={2} className="border border-black p-1 text-right">
            Nilai Akhir
          </td>
          <td className="border border-black p-1 text-center">{nilaiAkhir ?? "—"}</td>
          <td colSpan={2} className="border border-black p-1 text-center">
            {predikatAkhir ? labelPredikat(predikatAkhir, bahasaUtama, jenis, skala) : "—"}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
