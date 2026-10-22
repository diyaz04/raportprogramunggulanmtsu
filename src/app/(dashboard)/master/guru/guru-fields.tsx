import { Field } from "@/components/form-dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ROLE_LABEL, type Role } from "@/lib/auth";
import type { Profil } from "@/lib/data/master";

const ROLES = Object.keys(ROLE_LABEL) as Role[];

export function GuruFields({ profil }: { profil?: Profil }) {
  return (
    <>
      <Field label="Nama lengkap (beserta gelar)" htmlFor="nama">
        <Input id="nama" name="nama" defaultValue={profil?.nama} required />
      </Field>
      <Field label="NIP" htmlFor="nip" hint="Dicetak di blok tanda tangan rapor. Boleh dikosongkan.">
        <Input id="nip" name="nip" defaultValue={profil?.nip ?? ""} inputMode="numeric" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Role" htmlFor="role">
          <NativeSelect id="role" name="role" defaultValue={profil?.role ?? "guru"} className="w-full">
            {ROLES.map((r) => (
              <NativeSelectOption key={r} value={r}>
                {ROLE_LABEL[r]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        {profil ? (
          <Field label="Status" htmlFor="aktif" hint="Akun nonaktif tidak bisa masuk.">
            <NativeSelect id="aktif" name="aktif" defaultValue={profil.aktif ? "1" : "0"} className="w-full">
              <NativeSelectOption value="1">Aktif</NativeSelectOption>
              <NativeSelectOption value="0">Nonaktif</NativeSelectOption>
            </NativeSelect>
          </Field>
        ) : null}
      </div>
    </>
  );
}
