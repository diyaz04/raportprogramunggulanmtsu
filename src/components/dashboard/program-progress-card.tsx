import Link from "next/link";
import { BookOpen, ChevronRight } from "lucide-react";
import { IKON_PROGRAM, WARNA_PROGRAM, type WarnaProgram } from "@/lib/program-visual";

const WARNA_FALLBACK: WarnaProgram = { bg: "bg-muted", text: "text-muted-foreground", ring: "bg-primary" };

export function ProgramProgressCard({
  kode,
  nama,
  jumlahPeserta,
  nilaiTerisi,
  nilaiTotal,
  href,
}: {
  kode: string;
  nama: string;
  jumlahPeserta: number;
  nilaiTerisi: number;
  nilaiTotal: number;
  href: string;
}) {
  const Icon = IKON_PROGRAM[kode] ?? BookOpen;
  const warna = WARNA_PROGRAM[kode] ?? WARNA_FALLBACK;
  const persen = nilaiTotal > 0 ? Math.round((nilaiTerisi / nilaiTotal) * 100) : 0;

  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-foreground/20 hover:bg-muted/40">
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${warna.bg} ${warna.text}`}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium">{nama}</p>
          <p className="shrink-0 text-xs text-muted-foreground">
            {nilaiTerisi}/{nilaiTotal} ({persen}%)
          </p>
        </div>
        <p className="text-xs text-muted-foreground">{jumlahPeserta} peserta</p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full ${warna.ring}`} style={{ width: `${persen}%` }} />
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
