import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { WarnaProgram } from "@/lib/program-visual";

export function StatCard({
  icon: Icon,
  label,
  value,
  keterangan,
  warna,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  keterangan?: string;
  warna: WarnaProgram;
  href?: string;
}) {
  const isi = (
    <div className="grid min-w-0 gap-2 rounded-xl border p-4 transition-colors hover:border-foreground/20">
      <div className={`flex size-10 items-center justify-center rounded-full ${warna.bg} ${warna.text}`}>
        <Icon className="size-5" />
      </div>
      <p className="truncate text-sm font-medium">{label}</p>
      <p className="truncate text-2xl font-bold">{value}</p>
      {keterangan ? <p className="truncate text-xs text-muted-foreground">{keterangan}</p> : null}
    </div>
  );

  return href ? <Link href={href}>{isi}</Link> : isi;
}
