import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { FormDialog } from "@/components/form-dialog";
import { EmptyState } from "@/components/page-header";
import { PeriodeSelect } from "@/components/periode-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bisaKelolaProgram, getCurrentUser } from "@/lib/auth";
import { getIndikatorProgram, getPeriodeSumberIndikator } from "@/lib/data/indikator";
import { INDIKATOR_DEFAULT } from "@/lib/data/indikator-default";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import { getProgramByKode } from "@/lib/data/program";
import { hapusIndikator, isiIndikatorBawaan, salinIndikatorDariPeriode, simpanIndikator } from "../indikator-actions";
import { AktifToggle } from "./aktif-toggle";
import { IndikatorFields } from "./indikator-fields";
import { ReorderButtons } from "./reorder-buttons";

export default function IndikatorProgramPage(props: PageProps<"/program/[kode]/indikator">) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <Isi params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Isi({
  params,
  searchParams,
}: {
  params: PageProps<"/program/[kode]/indikator">["params"];
  searchParams: PageProps<"/program/[kode]/indikator">["searchParams"];
}) {
  const user = await getCurrentUser();
  const { kode } = await params;
  const { periode: periodeParam } = await searchParams;

  const program = await getProgramByKode(kode);
  if (!program) notFound();

  const daftarPeriode = await getPeriodeList();
  if (daftarPeriode.length === 0) {
    return <EmptyState title="Belum ada periode" description="Buat dan aktifkan periode di Master Data → Periode." />;
  }

  const dipilih =
    daftarPeriode.find((p) => p.id === (Array.isArray(periodeParam) ? periodeParam[0] : periodeParam)) ??
    daftarPeriode.find((p) => p.aktif) ??
    daftarPeriode[0];

  const indikator = await getIndikatorProgram(program.id, dipilih.id);
  const periodeSumber = indikator.length === 0 ? await getPeriodeSumberIndikator(program.id, dipilih.id) : null;
  const adaBawaan = INDIKATOR_DEFAULT[program.kode] !== undefined;

  const bolehKelola = await bisaKelolaProgram(user, program.id, dipilih.id);

  return (
    <div className="grid gap-4">
      <PeriodeSelect
        current={dipilih.id}
        options={daftarPeriode.map((p) => ({ id: p.id, label: labelPeriode(p) + (p.aktif ? " (aktif)" : "") }))}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Indikator dan bobotnya khusus untuk periode ini. Guru yang ditugaskan ke program ini boleh menambah,
          mengubah, atau menghapus.
        </p>
        {bolehKelola ? (
          <div className="flex flex-wrap gap-2">
            {indikator.length === 0 && periodeSumber ? (
              <FormDialog
                trigger={
                  <Button size="sm" variant="outline">
                    Salin dari periode lalu
                  </Button>
                }
                title="Salin indikator dari periode lalu?"
                description="Indikator beserta template deskripsinya akan disalin ke periode ini."
                submitLabel="Salin"
                action={salinIndikatorDariPeriode.bind(null, program.id, dipilih.id, periodeSumber.id)}
              />
            ) : null}
            {indikator.length === 0 && adaBawaan ? (
              <FormDialog
                trigger={
                  <Button size="sm" variant="outline">
                    <Sparkles /> Isi indikator bawaan
                  </Button>
                }
                title="Isi indikator bawaan?"
                description="Memakai daftar indikator hasil riset default untuk program ini. Bisa diubah lagi setelahnya."
                submitLabel="Isi"
                action={isiIndikatorBawaan.bind(null, program.id, dipilih.id)}
              />
            ) : null}
            <FormDialog
              trigger={
                <Button size="sm">
                  <Plus /> Tambah indikator
                </Button>
              }
              title="Tambah indikator"
              action={simpanIndikator.bind(null, program.id, dipilih.id, null)}
            >
              <IndikatorFields bahasaUtama={program.bahasa_utama} />
            </FormDialog>
          </div>
        ) : null}
      </div>

      {indikator.length === 0 ? (
        <EmptyState
          title="Belum ada indikator"
          description="Pakai indikator bawaan (jika ada), salin dari periode lalu, atau tambah manual."
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Urutan</TableHead>
                <TableHead>Indikator</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="w-16">Bobot</TableHead>
                <TableHead className="w-20">Aktif</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {indikator.map((ind, i) => (
                <TableRow key={ind.id}>
                  <TableCell>
                    {bolehKelola ? (
                      <ReorderButtons
                        programId={program.id}
                        periodeId={dipilih.id}
                        id={ind.id}
                        isFirst={i === 0}
                        isLast={i === indikator.length - 1}
                      />
                    ) : (
                      ind.urutan
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {ind.nama}
                    {ind.nama_terjemahan ? <span className="block text-xs text-muted-foreground">{ind.nama_terjemahan}</span> : null}
                    {ind.nama_arab ? <span className="block text-xs text-muted-foreground" dir="rtl">{ind.nama_arab}</span> : null}
                  </TableCell>
                  <TableCell className="max-w-xs text-sm text-muted-foreground">{ind.keterangan ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ind.bobot}</Badge>
                  </TableCell>
                  <TableCell>
                    {bolehKelola ? (
                      <AktifToggle programId={program.id} periodeId={dipilih.id} id={ind.id} aktif={ind.aktif} />
                    ) : (
                      <Badge variant={ind.aktif ? "outline" : "secondary"}>{ind.aktif ? "Aktif" : "Nonaktif"}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {bolehKelola ? (
                      <div className="flex justify-end gap-1">
                        <FormDialog
                          trigger={
                            <Button variant="ghost" size="icon-sm" aria-label={`Ubah ${ind.nama}`}>
                              <Pencil />
                            </Button>
                          }
                          title="Ubah indikator"
                          action={simpanIndikator.bind(null, program.id, dipilih.id, ind.id)}
                        >
                          <IndikatorFields bahasaUtama={program.bahasa_utama} indikator={ind} />
                        </FormDialog>
                        <FormDialog
                          trigger={
                            <Button variant="ghost" size="icon-sm" aria-label={`Hapus ${ind.nama}`}>
                              <Trash2 />
                            </Button>
                          }
                          title={`Hapus indikator ${ind.nama}?`}
                          description="Template deskripsinya ikut terhapus. Rapor yang sudah dikunci tidak berubah."
                          submitLabel="Hapus"
                          destructive
                          action={hapusIndikator.bind(null, program.id, dipilih.id, ind.id)}
                        />
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
