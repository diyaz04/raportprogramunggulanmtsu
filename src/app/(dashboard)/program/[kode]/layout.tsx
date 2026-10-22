import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth";
import { JENIS_LABEL, getProgramByKode } from "@/lib/data/program";
import { ProgramSubnav } from "./program-subnav";

export default function ProgramDetailLayout(props: LayoutProps<"/program/[kode]">) {
  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <Button variant="ghost" size="sm" className="w-fit" nativeButton={false} render={<Link href="/program" />}>
        <ArrowLeft /> Semua program
      </Button>
      <Suspense fallback={<Skeleton className="h-40 w-full" />}>
        <Isi params={props.params}>{props.children}</Isi>
      </Suspense>
    </div>
  );
}

async function Isi({ params, children }: { params: LayoutProps<"/program/[kode]">["params"]; children: React.ReactNode }) {
  await requireRole("admin", "koordinator", "guru", "kepala");
  const { kode } = await params;

  const program = await getProgramByKode(kode);
  if (!program) notFound();

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{program.nama}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {program.rumpun.nama} · {program.judul_rapor}
          </p>
        </div>
        <Badge variant="outline">{JENIS_LABEL[program.jenis]}</Badge>
      </div>

      <ProgramSubnav kode={kode} jenis={program.jenis} />

      {children}
    </div>
  );
}
