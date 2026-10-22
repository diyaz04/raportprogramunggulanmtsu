import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { Field, FormDialog } from "@/components/form-dialog";
import { EmptyState } from "@/components/page-header";
import { PeriodeSelect } from "@/components/periode-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import { getKehadiranProgram } from "@/lib/data/modul-khusus";
import { getProgramByKode } from "@/lib/data/program";
import { simpanKehadiran } from "../modul-khusus-actions";

export default function KehadiranProgramPage(props: PageProps<"/program/[kode]/kehadiran">) {
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
  params: PageProps<"/program/[kode]/kehadiran">["params"];
  searchParams: PageProps<"/program/[kode]/kehadiran">["searchParams"];
}) {
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

  const baris = await getKehadiranProgram(program.id, dipilih.id);

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
                <TableHead className="text-right">Hadir</TableHead>
                <TableHead className="text-right">Sakit</TableHead>
                <TableHead className="text-right">Izin</TableHead>
                <TableHead className="text-right">Alpa</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {baris.map(({ peserta, kehadiran }) => (
                <TableRow key={peserta.id}>
                  <TableCell className="font-medium">{peserta.siswa.nama}</TableCell>
                  <TableCell>{peserta.kelas_nama ?? "—"}</TableCell>
                  <TableCell className="text-right">{kehadiran.hadir}</TableCell>
                  <TableCell className="text-right">{kehadiran.sakit}</TableCell>
                  <TableCell className="text-right">{kehadiran.izin}</TableCell>
                  <TableCell className="text-right">{kehadiran.alpa}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <FormDialog
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label={`Ubah kehadiran ${peserta.siswa.nama}`}>
                            <Pencil />
                          </Button>
                        }
                        title={`Kehadiran — ${peserta.siswa.nama}`}
                        action={simpanKehadiran.bind(null, peserta.id)}
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Hadir" htmlFor="hadir">
                            <Input id="hadir" name="hadir" type="number" min={0} defaultValue={kehadiran.hadir} required />
                          </Field>
                          <Field label="Sakit" htmlFor="sakit">
                            <Input id="sakit" name="sakit" type="number" min={0} defaultValue={kehadiran.sakit} required />
                          </Field>
                          <Field label="Izin" htmlFor="izin">
                            <Input id="izin" name="izin" type="number" min={0} defaultValue={kehadiran.izin} required />
                          </Field>
                          <Field label="Alpa" htmlFor="alpa">
                            <Input id="alpa" name="alpa" type="number" min={0} defaultValue={kehadiran.alpa} required />
                          </Field>
                        </div>
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
