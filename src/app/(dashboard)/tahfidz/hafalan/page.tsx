import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpenText } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";
import { PeriodeSelect } from "@/components/periode-select";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import { getPesertaProgram, getProgramByKode } from "@/lib/data/program";

export const metadata: Metadata = { title: "Hafalan Tahfidz" };

export default function HafalanTahfidzPage(props: PageProps<"/tahfidz/hafalan">) {
  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <PageHeader title="Hafalan Tahfidz" description="Pilih siswa untuk mencatat atau melihat hafalannya." />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Isi searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Isi({ searchParams }: { searchParams: PageProps<"/tahfidz/hafalan">["searchParams"] }) {
  await requireRole("admin", "koordinator", "guru");
  const { periode: periodeParam } = await searchParams;

  const program = await getProgramByKode("THF");
  if (!program) {
    return <EmptyState title="Program Tahfidz belum ada" description="Program dengan kode THF belum tersedia." />;
  }

  const daftarPeriode = await getPeriodeList();
  if (daftarPeriode.length === 0) {
    return <EmptyState title="Belum ada periode" description="Buat dan aktifkan periode di Master Data → Periode." />;
  }
  const dipilih =
    daftarPeriode.find((p) => p.id === (Array.isArray(periodeParam) ? periodeParam[0] : periodeParam)) ??
    daftarPeriode.find((p) => p.aktif) ??
    daftarPeriode[0];

  const peserta = await getPesertaProgram(program.id, dipilih.id);

  return (
    <>
      <PeriodeSelect
        current={dipilih.id}
        options={daftarPeriode.map((p) => ({ id: p.id, label: labelPeriode(p) + (p.aktif ? " (aktif)" : "") }))}
      />

      {peserta.length === 0 ? (
        <EmptyState
          title="Belum ada peserta Tahfidz"
          description="Daftarkan peserta dulu di menu Program & Peserta → Tahfidz Al-Qur'an → Peserta."
        />
      ) : (
        <div className="grid gap-2">
          {peserta.map((p) => (
            <Link
              key={p.id}
              href={`/tahfidz/hafalan/${p.id}`}
              className="group flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors hover:border-foreground/20 hover:bg-muted/40"
            >
              <div className="grid gap-0.5">
                <span className="font-medium">{p.siswa.nama}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <BookOpenText className="size-3.5" /> {p.kelas_nama ?? "—"}
                  {p.kelompok_nama ? ` · ${p.kelompok_nama}` : ""}
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
