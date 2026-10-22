"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { ubahAktifIndikator } from "../indikator-actions";

export function AktifToggle({
  programId,
  periodeId,
  id,
  aktif,
}: {
  programId: string;
  periodeId: string;
  id: string;
  aktif: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Switch
      aria-label={aktif ? "Nonaktifkan indikator" : "Aktifkan indikator"}
      checked={aktif}
      disabled={pending}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          const result = await ubahAktifIndikator(programId, periodeId, id, checked, {});
          if (result.error) toast.error(result.error);
        });
      }}
    />
  );
}
