import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ClipboardPenLine } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";
import { PeriodeSelect } from "@/components/periode-select";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import { getProgramIdUntukGuru, getProgramList } from "@/lib/data/program";

export const metadata: Metadata = { title: "Input Nilai" };

export default function NilaiPage(props: PageProps<"/nilai">) {
  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <PageHeader title="Input Nilai" description="Pilih program untuk mengisi nilai per indikator." />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Isi searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Isi({ searchParams }: { searchParams: PageProps<"/nilai">["searchParams"] }) {
  const user = await requireRole("admin", "koordinator", "guru");
  const { periode: periodeParam } = await searchParams;
  const daftarPeriode = await getPeriodeList();

  if (daftarPeriode.length === 0) {
    return <EmptyState title="Belum ada periode" description="Buat dan aktifkan periode di Master Data → Periode." />;
  }

  const dipilih =
    daftarPeriode.find((p) => p.id === (Array.isArray(periodeParam) ? periodeParam[0] : periodeParam)) ??
    daftarPeriode.find((p) => p.aktif) ??
    daftarPeriode[0];

  const programSemua = await getProgramList(dipilih.id);
  const izin = user.role === "guru" ? new Set(await getProgramIdUntukGuru(user.id, dipilih.id)) : null;
  const tampil = izin ? programSemua.filter((p) => izin.has(p.id)) : programSemua;

  return (
    <>
      <PeriodeSelect
        current={dipilih.id}
        options={daftarPeriode.map((p) => ({ id: p.id, label: labelPeriode(p) + (p.aktif ? " (aktif)" : "") }))}
      />

      {tampil.length === 0 ? (
        <EmptyState
          title="Belum ada program untuk Anda"
          description="Anda belum ditugaskan ke program apa pun pada periode ini. Hubungi admin/koordinator."
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {tampil.map((p) => (
            <Link
              key={p.id}
              href={`/nilai/${p.kode}`}
              className="group flex items-center justify-between gap-3 rounded-xl border p-4 transition-colors hover:border-foreground/20 hover:bg-muted/40"
            >
              <div className="grid gap-1">
                <span className="font-medium">{p.nama}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ClipboardPenLine className="size-3.5" /> {p.jumlah_peserta} peserta
                </span>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
