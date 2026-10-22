import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Field, FormDialog } from "@/components/form-dialog";
import { EmptyState } from "@/components/page-header";
import { PeriodeSelect } from "@/components/periode-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import { getRisetProyekProgram, TAHAP_RISET_LABEL, type TahapRiset } from "@/lib/data/modul-khusus";
import { getProgramByKode } from "@/lib/data/program";
import { simpanRisetProyek } from "../modul-khusus-actions";

const TAHAP: TahapRiset[] = ["proposal", "pengambilan_data", "laporan", "presentasi"];

export default function ProyekRisetPage(props: PageProps<"/program/[kode]/proyek">) {
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
  params: PageProps<"/program/[kode]/proyek">["params"];
  searchParams: PageProps<"/program/[kode]/proyek">["searchParams"];
}) {
  const { kode } = await params;
  const { periode: periodeParam } = await searchParams;

  const program = await getProgramByKode(kode);
  if (!program) notFound();
  if (program.jenis !== "riset") {
    return <EmptyState title="Bukan program Riset" description="Modul Proyek hanya untuk program Riset." />;
  }

  const daftarPeriode = await getPeriodeList();
  if (daftarPeriode.length === 0) {
    return <EmptyState title="Belum ada periode" description="Buat dan aktifkan periode di Master Data → Periode." />;
  }
  const dipilih =
    daftarPeriode.find((p) => p.id === (Array.isArray(periodeParam) ? periodeParam[0] : periodeParam)) ??
    daftarPeriode.find((p) => p.aktif) ??
    daftarPeriode[0];

  const baris = await getRisetProyekProgram(program.id, dipilih.id);

  return (
    <div className="grid gap-4">
      <PeriodeSelect
        current={dipilih.id}
        options={daftarPeriode.map((p) => ({ id: p.id, label: labelPeriode(p) + (p.aktif ? " (aktif)" : "") }))}
      />

      {baris.length === 0 ? (
        <EmptyState title="Belum ada peserta" description="Daftarkan peserta dulu di menu Peserta." />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Judul Proyek</TableHead>
                <TableHead>Tahap</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {baris.map(({ peserta, proyek }) => (
                <TableRow key={peserta.id}>
                  <TableCell className="font-medium">{peserta.siswa.nama}</TableCell>
                  <TableCell>{peserta.kelas_nama ?? "—"}</TableCell>
                  <TableCell className="max-w-xs">{proyek.judul ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{TAHAP_RISET_LABEL[proyek.tahap]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <FormDialog
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label={`Ubah proyek ${peserta.siswa.nama}`}>
                            <Pencil />
                          </Button>
                        }
                        title={`Proyek riset — ${peserta.siswa.nama}`}
                        action={simpanRisetProyek.bind(null, peserta.id)}
                      >
                        <Field label="Judul penelitian" htmlFor="judul">
                          <Input id="judul" name="judul" defaultValue={proyek.judul ?? ""} />
                        </Field>
                        <Field label="Tahap" htmlFor="tahap">
                          <NativeSelect id="tahap" name="tahap" className="w-full" defaultValue={proyek.tahap}>
                            {TAHAP.map((t) => (
                              <NativeSelectOption key={t} value={t}>
                                {TAHAP_RISET_LABEL[t]}
                              </NativeSelectOption>
                            ))}
                          </NativeSelect>
                        </Field>
                      </FormDialog>
                    </div>
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
