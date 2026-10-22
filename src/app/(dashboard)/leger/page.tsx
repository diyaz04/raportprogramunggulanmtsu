import { Suspense } from "react";
import type { Metadata } from "next";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import { getProgramList } from "@/lib/data/program";
import { LegerForm } from "./leger-form";

export const metadata: Metadata = { title: "Leger Excel" };

export default function LegerPage() {
  return (
    <div className="mx-auto grid max-w-xl gap-6">
      <PageHeader title="Leger Excel" description="Unduh rekap nilai semua program unggulan dalam satu file Excel." />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Isi />
      </Suspense>
    </div>
  );
}

async function Isi() {
  await requireRole("admin", "koordinator");
  const daftarPeriode = await getPeriodeList();

  if (daftarPeriode.length === 0) {
    return <EmptyState title="Belum ada periode" description="Buat dan aktifkan periode di Master Data → Periode." />;
  }

  const periodeAktif = daftarPeriode.find((p) => p.aktif) ?? daftarPeriode[0];
  const programSemua = await getProgramList(periodeAktif.id);

  return (
    <LegerForm
      daftarPeriode={daftarPeriode.map((p) => ({ id: p.id, label: labelPeriode(p) + (p.aktif ? " (aktif)" : "") }))}
      periodeDefault={periodeAktif.id}
      daftarProgram={programSemua.map((p) => ({ kode: p.kode, nama: p.nama }))}
    />
  );
}
