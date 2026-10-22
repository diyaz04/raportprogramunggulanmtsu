"use client";

import { useTransition } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ubahUrutanPenandaTangan } from "../../actions";

export function ReorderButtons({
  programId,
  periodeId,
  id,
  isFirst,
  isLast,
}: {
  programId: string;
  periodeId: string;
  id: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function pindah(arah: "naik" | "turun") {
    startTransition(async () => {
      const result = await ubahUrutanPenandaTangan(programId, periodeId, id, arah, {});
      if (result.error) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col">
      <Button variant="ghost" size="icon-sm" aria-label="Naikkan urutan" disabled={pending || isFirst} onClick={() => pindah("naik")}>
        <ChevronUp />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Turunkan urutan" disabled={pending || isLast} onClick={() => pindah("turun")}>
        <ChevronDown />
      </Button>
    </div>
  );
}
