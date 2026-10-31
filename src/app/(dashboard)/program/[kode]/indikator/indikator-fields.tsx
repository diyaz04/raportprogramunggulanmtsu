import { Field } from "@/components/form-dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { BahasaProgram } from "@/lib/data/program";
import type { Indikator } from "@/lib/data/indikator";

export function IndikatorFields({
  bahasaUtama,
  indikator,
  defaultTingkat,
}: {
  bahasaUtama: BahasaProgram;
  indikator?: Indikator;
  defaultTingkat?: number | null;
}) {
  const initialTingkat = indikator
    ? indikator.tingkat !== null
      ? String(indikator.tingkat)
      : ""
    : defaultTingkat
      ? String(defaultTingkat)
      : "";

  return (
    <>
      <Field
        label="Tingkatan Kelas"
        htmlFor="tingkat"
        hint="Pilih tingkatan kelas untuk indikator ini, atau 'Semua Tingkat' jika berlaku umum lintas kelas."
      >
        <NativeSelect id="tingkat" name="tingkat" defaultValue={initialTingkat} className="w-full">
          <option value="">Semua Tingkat (Umum)</option>
          <option value="7">Tingkat VII (Kelas 7)</option>
          <option value="8">Tingkat VIII (Kelas 8)</option>
          <option value="9">Tingkat IX (Kelas 9)</option>
        </NativeSelect>
      </Field>

      <Field label="Nama indikator" htmlFor="nama">
        <Input id="nama" name="nama" defaultValue={indikator?.nama} required />
      </Field>

      {bahasaUtama === "en" ? (
        <Field label="Terjemahan Indonesia" htmlFor="nama_terjemahan" hint='Contoh: "Fluency" → "Kelancaran"'>
          <Input id="nama_terjemahan" name="nama_terjemahan" defaultValue={indikator?.nama_terjemahan ?? ""} />
        </Field>
      ) : null}

      {bahasaUtama === "ar" ? (
        <Field label="Nama Arab" htmlFor="nama_arab" hint="Ditulis dengan huruf Arab">
          <Input id="nama_arab" name="nama_arab" dir="rtl" className="font-arabic" defaultValue={indikator?.nama_arab ?? ""} />
        </Field>
      ) : null}

      <Field label="Keterangan" htmlFor="keterangan" hint="Yang dinilai pada indikator ini. Dipakai juga sebagai bahan deskripsi otomatis.">
        <Textarea id="keterangan" name="keterangan" rows={2} defaultValue={indikator?.keterangan ?? ""} />
      </Field>

      <Field label="Bobot" htmlFor="bobot" hint="Dipakai untuk rata-rata berbobot nilai akhir. Default sama untuk semua indikator.">
        <Input id="bobot" name="bobot" type="number" min={1} max={100} defaultValue={indikator?.bobot ?? 1} required />
      </Field>
    </>
  );
}
