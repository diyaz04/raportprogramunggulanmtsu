import { Field } from "@/components/form-dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { Periode } from "@/lib/data/master";

export function PeriodeFields({ periode }: { periode?: Periode }) {
  return (
    <>
      <Field label="Tahun ajaran" htmlFor="tahun_ajaran" hint="Format 2026/2027">
        <Input
          id="tahun_ajaran"
          name="tahun_ajaran"
          placeholder="2026/2027"
          defaultValue={periode?.tahun_ajaran}
          inputMode="numeric"
          required
        />
      </Field>
      <Field label="Semester" htmlFor="semester">
        <NativeSelect id="semester" name="semester" defaultValue={periode?.semester ?? "ganjil"} className="w-full">
          <NativeSelectOption value="ganjil">Ganjil</NativeSelectOption>
          <NativeSelectOption value="genap">Genap</NativeSelectOption>
        </NativeSelect>
      </Field>
      <Field
        label="Tanggal rapor"
        htmlFor="tanggal_rapor"
        hint="Dicetak di atas tanda tangan rapor. Boleh dikosongkan dulu."
      >
        <Input id="tanggal_rapor" name="tanggal_rapor" type="date" defaultValue={periode?.tanggal_rapor ?? ""} />
      </Field>
    </>
  );
}
