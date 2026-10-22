"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ubahKelompokPeserta } from "../../actions";

/** Select kelompok yang langsung tersimpan saat diubah (tanpa dialog). */
export function KelompokSelect({
  pesertaId,
  kelompokId,
  opsi,
}: {
  pesertaId: string;
  kelompokId: string | null;
  opsi: { id: string; nama: string }[];
}) {
  const [pending, startTransition] = useTransition();

  function onChange(value: string) {
    const formData = new FormData();
    formData.set("kelompok_id", value);
    startTransition(async () => {
      const result = await ubahKelompokPeserta(pesertaId, {}, formData);
      if (result.error) toast.error(result.error);
      else toast.success(result.message ?? "Kelompok diperbarui");
    });
  }

  return (
    <NativeSelect
      aria-label="Ubah kelompok"
      size="sm"
      value={kelompokId ?? ""}
      disabled={pending}
      onChange={(e) => onChange(e.target.value)}
    >
      <NativeSelectOption value="">Tanpa kelompok</NativeSelectOption>
      {opsi.map((k) => (
        <NativeSelectOption key={k.id} value={k.id}>
          {k.nama}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
