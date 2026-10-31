import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, UsersRound } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";
import { PeriodeSelect } from "@/components/periode-select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import { getProgramIdUntukGuru, getProgramList } from "@/lib/data/program";

export const metadata: Metadata = { title: "Program & Peserta" };

export default function ProgramPage(props: PageProps<"/program">) {
  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Isi searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Isi({ searchParams }: { searchParams: PageProps<"/program">["searchParams"] }) {
  const user = await getCurrentUser();
  const searchParamsResolved = await searchParams;
  const periodeParam = Array.isArray(searchParamsResolved.periode)
    ? searchParamsResolved.periode[0]
    : searchParamsResolved.periode;
  const daftarPeriode = await getPeriodeList();

  if (daftarPeriode.length === 0) {
    return (
      <>
        <PageHeader
          title={user.role === "guru" ? "Program yang Diampu" : "Program & Peserta"}
          description={
            user.role === "guru"
              ? "Daftar program unggulan yang Anda ampu pada periode ini."
              : "6 rumpun, 10 program unggulan. Pilih program untuk atur peserta, kelompok, guru, dan penanda tangan."
          }
        />
        <EmptyState
          title="Belum ada periode"
          description="Buat dan aktifkan periode dulu di menu Master Data → Periode."
        />
      </>
    );
  }

  const dipilih =
    daftarPeriode.find((p) => p.id === periodeParam) ??
    daftarPeriode.find((p) => p.aktif) ??
    daftarPeriode[0];

  const [allPrograms, programIdGuru] = await Promise.all([
    getProgramList(dipilih.id),
    user.role === "guru" ? getProgramIdUntukGuru(user.id, dipilih.id) : Promise.resolve(null),
  ]);

  // Khusus guru: hanya tampilkan program yang diampunya saja
  const programs =
    user.role === "guru" && programIdGuru
      ? allPrograms.filter((p) => programIdGuru.includes(p.id))
      : allPrograms;

  const grup = new Map<string, { nama: string; items: typeof programs }>();
  for (const p of programs) {
    const g = grup.get(p.rumpun.id) ?? { nama: p.rumpun.nama, items: [] };
    g.items.push(p);
    grup.set(p.rumpun.id, g);
  }

  return (
    <>
      <PageHeader
        title={user.role === "guru" ? "Program yang Diampu" : "Program & Peserta"}
        description={
          user.role === "guru"
            ? "Daftar program unggulan yang Anda ampu pada periode ini. Pilih program untuk mengkonfigurasi indikator, template deskripsi, dan melihat peserta."
            : "6 rumpun, 10 program unggulan. Pilih program untuk atur peserta, kelompok, guru, dan penanda tangan."
        }
      />

      <PeriodeSelect
        current={dipilih.id}
        options={daftarPeriode.map((p) => ({ id: p.id, label: labelPeriode(p) + (p.aktif ? " (aktif)" : "") }))}
      />

      {programs.length === 0 ? (
        <EmptyState
          title="Belum ada program yang diampu"
          description="Anda belum ditugaskan ke program apa pun pada periode ini. Hubungi admin atau koordinator untuk ditugaskan."
        />
      ) : (
        <div className="grid gap-6">
          {[...grup.values()].map((g) => (
            <div key={g.nama} className="grid gap-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{g.nama}</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {g.items.map((p) => (
                  <Link
                    key={p.id}
                    href={`/program/${p.kode}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border p-4 transition-colors hover:border-foreground/20 hover:bg-muted/40"
                  >
                    <div className="grid gap-1">
                      <span className="font-medium">{p.nama}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <UsersRound className="size-3.5" /> {p.jumlah_peserta} peserta
                        </span>
                        <span>·</span>
                        <span>{p.jumlah_guru} guru</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.jumlah_guru === 0 ? (
                        <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
                          Belum ada guru
                        </Badge>
                      ) : null}
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
