"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

/** Pemilih periode: menyimpan pilihan di query string `?periode=<id>`. */
export function PeriodeSelect({
  options,
  current,
}: {
  options: { id: string; label: string }[];
  current: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <NativeSelect
      aria-label="Pilih periode"
      value={current}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams);
        params.set("periode", e.target.value);
        router.replace(`${pathname}?${params.toString()}`);
      }}
    >
      {options.map((o) => (
        <NativeSelectOption key={o.id} value={o.id}>
          {o.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
