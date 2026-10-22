import { Field } from "@/components/form-dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { Siswa } from "@/lib/data/master";

export function SiswaFields({ siswa }: { siswa?: Siswa }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="NIS" htmlFor="nis">
          <Input id="nis" name="nis" defaultValue={siswa?.nis} inputMode="numeric" required />
        </Field>
        <Field label="NISN" htmlFor="nisn" hint="10 digit. Boleh dikosongkan.">
          <Input id="nisn" name="nisn" defaultValue={siswa?.nisn ?? ""} inputMode="numeric" maxLength={10} />
        </Field>
      </div>
      <Field label="Nama lengkap" htmlFor="nama">
        <Input id="nama" name="nama" defaultValue={siswa?.nama} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Jenis kelamin" htmlFor="jk">
          <NativeSelect id="jk" name="jk" defaultValue={siswa?.jk ?? "L"} className="w-full">
            <NativeSelectOption value="L">Laki-laki (L)</NativeSelectOption>
            <NativeSelectOption value="P">Perempuan (P)</NativeSelectOption>
          </NativeSelect>
        </Field>
        {siswa ? (
          <Field label="Status" htmlFor="aktif" hint="Nonaktifkan untuk siswa yang lulus/pindah.">
            <NativeSelect id="aktif" name="aktif" defaultValue={siswa.aktif ? "1" : "0"} className="w-full">
              <NativeSelectOption value="1">Aktif</NativeSelectOption>
              <NativeSelectOption value="0">Nonaktif</NativeSelectOption>
            </NativeSelect>
          </Field>
        ) : null}
      </div>
      <Field label="Nama Arab" htmlFor="nama_arab" hint="Opsional, dipakai di rapor berbahasa Arab.">
        <Input
          id="nama_arab"
          name="nama_arab"
          dir="rtl"
          lang="ar"
          className="font-arabic text-base"
          defaultValue={siswa?.nama_arab ?? ""}
        />
      </Field>
    </>
  );
}
