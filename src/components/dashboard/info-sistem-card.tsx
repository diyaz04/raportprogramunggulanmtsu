import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

export type InfoBaris = { icon: LucideIcon; label: string; value: string; href?: string };

export function InfoSistemCard({ judul, baris }: { judul: string; baris: InfoBaris[] }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="mb-3 font-semibold">{judul}</p>
      <div className="grid gap-1">
        {baris.map((b, i) => {
          const Icon = b.icon;
          const isi = (
            <div className="flex items-center gap-3 rounded-lg p-2 text-sm transition-colors hover:bg-muted/50">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{b.label}</p>
                <p className="truncate font-medium">{b.value}</p>
              </div>
              {b.href ? <ChevronRight className="size-4 shrink-0 text-muted-foreground" /> : null}
            </div>
          );
          return b.href ? <Link key={i} href={b.href}>{isi}</Link> : <div key={i}>{isi}</div>;
        })}
      </div>
    </div>
  );
}
