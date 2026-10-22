import { FileCheck2, FileDown } from "lucide-react";
import type { AktivitasItem } from "@/lib/data/dashboard";
import { formatWaktuRelatif } from "@/lib/format";

export function AktivitasTerbaru({ data }: { data: AktivitasItem[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada aktivitas.</p>;
  }

  return (
    <div className="grid gap-1">
      {data.map((a) => {
        const Icon = a.jenis === "leger" ? FileDown : FileCheck2;
        return (
          <div key={a.id} className="flex items-start gap-3 rounded-lg p-2 text-sm">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{a.judul}</p>
              <p className="truncate text-xs text-muted-foreground">{a.keterangan}</p>
            </div>
            <p className="shrink-0 text-xs text-muted-foreground">{formatWaktuRelatif(a.waktu)}</p>
          </div>
        );
      })}
    </div>
  );
}
