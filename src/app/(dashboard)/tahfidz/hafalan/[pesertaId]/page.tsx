import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { FormDialog } from "@/components/form-dialog";
import { EmptyState } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth";
import { getSkalaPredikatGlobal } from "@/lib/data/indikator";
import { getPesertaProgramById } from "@/lib/data/program";
import { getHafalanSiswa, getSemuaSuratPerJuz, hitungRekapHafalan } from "@/lib/data/tahfidz";
import { hapusHafalan } from "../actions";
import { HafalanForm } from "./hafalan-form";
import { NilaiHafalanCell } from "./nilai-hafalan-cell";

export default function DetailHafalanPage(props: PageProps<"/tahfidz/hafalan/[pesertaId]">) {
  return (
    <div className="mx-auto grid max-w-3xl gap-4">
      <Button variant="ghost" size="sm" className="w-fit" nativeButton={false} render={<Link href="/tahfidz/hafalan" />}>
        <ArrowLeft /> Semua siswa
      </Button>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Isi params={props.params} />
      </Suspense>
    </div>
  );
}

async function Isi({ params }: { params: PageProps<"/tahfidz/hafalan/[pesertaId]">["params"] }) {
  await requireRole("admin", "koordinator", "guru");
  const { pesertaId } = await params;

  const peserta = await getPesertaProgramById(pesertaId);
  if (!peserta) notFound();

  const [hafalan, semuaSuratPerJuz, skala] = await Promise.all([
    getHafalanSiswa(peserta.siswa.id),
    getSemuaSuratPerJuz(),
    getSkalaPredikatGlobal(),
  ]);

  const rekap = hitungRekapHafalan(hafalan, semuaSuratPerJuz);
  const perJuz = new Map<number, typeof hafalan>();
  for (const h of hafalan) perJuz.set(h.juz, [...(perJuz.get(h.juz) ?? []), h]);
  const daftarJuz = [...perJuz.keys()].sort((a, b) => a - b);

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{peserta.siswa.nama}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rekap.juzPenuh} juz penuh · {rekap.juzSebagian} juz sebagian · {rekap.jumlahSurat} surat · {rekap.totalAyat} ayat
          {rekap.rataRata != null ? ` · rata-rata ${rekap.rataRata}` : ""}
        </p>
      </div>

      <HafalanForm siswaId={peserta.siswa.id} periodeSetorId={peserta.periode_id} semuaSuratPerJuz={semuaSuratPerJuz} />

      {hafalan.length === 0 ? (
        <EmptyState title="Belum ada hafalan tercatat" description="Gunakan form di atas untuk mulai mencatat." />
      ) : (
        <div className="grid gap-3">
          {daftarJuz.map((juz) => {
            const baris = perJuz.get(juz)!.sort((a, b) => a.ayat_awal - b.ayat_awal);
            return (
              <details key={juz} className="group rounded-xl border p-3" open={daftarJuz.length <= 3}>
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  <span>
                    Juz {juz} — {baris.length} surat
                  </span>
                </summary>
                <div className="mt-2 grid gap-2">
                  {baris.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 p-2 text-sm">
                      <div className="grid gap-0.5">
                        <span className="font-medium">
                          {b.nama_latin} ({b.ayat_awal}-{b.ayat_akhir})
                          {b.periode_setor_id === peserta.periode_id ? (
                            <Badge variant="outline" className="ml-2 border-emerald-300 bg-emerald-50 text-emerald-800">
                              baru
                            </Badge>
                          ) : null}
                        </span>
                        {b.catatan ? <span className="text-xs text-muted-foreground">{b.catatan}</span> : null}
                      </div>
                      <div className="flex items-center gap-1">
                        <NilaiHafalanCell siswaId={peserta.siswa.id} id={b.id} nilaiAwal={b.nilai} skala={skala} />
                        <FormDialog
                          trigger={
                            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Hapus hafalan ${b.nama_latin}`}>
                              <Trash2 />
                            </Button>
                          }
                          title={`Hapus hafalan ${b.nama_latin}?`}
                          submitLabel="Hapus"
                          destructive
                          action={hapusHafalan.bind(null, peserta.siswa.id, b.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </>
  );
}
