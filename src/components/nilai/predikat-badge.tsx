import { Badge } from "@/components/ui/badge";
import type { PredikatKode } from "@/lib/deskripsi/engine";

const WARNA: Record<PredikatKode, string> = {
  A: "border-transparent bg-predikat-a text-predikat-a-fg",
  B: "border-transparent bg-predikat-b text-predikat-b-fg",
  C: "border-transparent bg-predikat-c text-predikat-c-fg",
  D: "border-transparent bg-predikat-d text-predikat-d-fg",
};

/** Badge predikat dengan warna pastel standar PERENCANAAN §10 (A=emerald, B=sky, C=amber, D=rose). */
export function PredikatBadge({ predikat }: { predikat: PredikatKode }) {
  return <Badge className={WARNA[predikat]}>{predikat}</Badge>;
}
