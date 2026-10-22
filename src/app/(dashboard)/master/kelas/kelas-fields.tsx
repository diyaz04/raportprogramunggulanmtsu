import { Field } from "@/components/form-dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { Kelas } from "@/lib/data/master";

export function KelasFields({ kelas }: { kelas?: Kelas }) {
  return (
    <>
      <Field label="Nama kelas" htmlFor="nama" hint="Contoh: VII.1 atau VIII-A">
        <Input id="nama" name="nama" placeholder="VII.1" defaultValue={kelas?.nama} required />
      </Field>
      <Field label="Tingkat" htmlFor="tingkat">
        <NativeSelect id="tingkat" name="tingkat" defaultValue={String(kelas?.tingkat ?? 7)} className="w-full">
          <NativeSelectOption value="7">VII (7)</NativeSelectOption>
          <NativeSelectOption value="8">VIII (8)</NativeSelectOption>
          <NativeSelectOption value="9">IX (9)</NativeSelectOption>
        </NativeSelect>
      </Field>
    </>
  );
}
