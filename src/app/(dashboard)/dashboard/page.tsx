import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState } from "@/components/page-header";
import { PeriodeSelect } from "@/components/periode-select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LABEL, getCurrentUser } from "@/lib/auth";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import { getProgramIdUntukGuru, getProgramList } from "@/lib/data/program";
import { getProgresProgram, STATUS_RAPOR_LABEL, type StatusRapor } from "@/lib/data/rapor";

export const metadata: Metadata = { title: "Dashboard" };

const WARNA_STATUS: Record<StatusRapor, string> = {
  draft: "bg-muted text-muted-foreground",
  review: "border-amber-300 bg-amber-50 text-amber-800",
  disetujui: "border-sky-300 bg-sky-50 text-sky-800",
  terkunci: "border-emerald-300 bg-emerald-50 text-emerald-800",
};

export default function DashboardPage(props: PageProps<"/dashboard">) {
  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <Suspense fallback={<Skeleton className="h-16 w-full max-w-md" />}>
        <Greeting />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Progres searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Greeting() {
  const user = await getCurrentUser();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Assalamu&rsquo;alaikum, {user.nama}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Masuk sebagai {ROLE_LABEL[user.role]}.</p>
    </div>
  );
}

async function Progres({ searchParams }: { searchParams: PageProps<"/dashboard">["searchParams"] }) {
  const user = await getCurrentUser();
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
  const program = izin ? programSemua.filter((p) => izin.has(p.id)) : programSemua;

  const progres = await Promise.all(program.map((p) => getProgresProgram(p.id, dipilih.id)));

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Progres Program</h2>
        <PeriodeSelect
          current={dipilih.id}
          options={daftarPeriode.map((p) => ({ id: p.id, label: labelPeriode(p) + (p.aktif ? " (aktif)" : "") }))}
        />
      </div>

      {program.length === 0 ? (
        <EmptyState title="Belum ada program untuk Anda" description="Anda belum ditugaskan ke program apa pun pada periode ini." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {program.map((p, i) => {
            const pr = progres[i];
            const persenNilai = pr.nilaiTotal > 0 ? Math.round((pr.nilaiTerisi / pr.nilaiTotal) * 100) : 0;
            return (
              <Link key={p.id} href={`/rapor/${p.kode}`} className="grid gap-2 rounded-xl border p-4 transition-colors hover:border-foreground/20 hover:bg-muted/40">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{p.nama}</span>
                  <span className="text-xs text-muted-foreground">{pr.jumlahPeserta} peserta</span>
                </div>

                <div className="grid gap-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Nilai terisi</span>
                    <span>
                      {pr.nilaiTerisi}/{pr.nilaiTotal} ({persenNilai}%)
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${persenNilai}%` }} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(STATUS_RAPOR_LABEL) as StatusRapor[])
                    .filter((s) => pr.statusRapor[s] > 0)
                    .map((s) => (
                      <Badge key={s} variant="outline" className={WARNA_STATUS[s]}>
                        {STATUS_RAPOR_LABEL[s]}: {pr.statusRapor[s]}
                      </Badge>
                    ))}
                  {Object.values(pr.statusRapor).every((n) => n === 0) ? (
                    <span className="text-xs text-muted-foreground">Belum ada rapor dihitung</span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
