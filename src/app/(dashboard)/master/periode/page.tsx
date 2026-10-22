import { Suspense } from "react";
import type { Metadata } from "next";
import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { FormDialog } from "@/components/form-dialog";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { SEMESTER_LABEL, getPeriodeList } from "@/lib/data/master";
import { formatTanggal } from "@/lib/format";
import { aktifkanPeriode, hapusPeriode, simpanPeriode } from "./actions";
import { PeriodeFields } from "./periode-fields";

export const metadata: Metadata = { title: "Periode" };

export default function PeriodePage() {
  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <PageHeader
        title="Periode"
        description="Tahun ajaran dan semester. Hanya satu periode yang aktif; semua input nilai dan rapor mengikuti periode aktif."
        actions={
          <FormDialog
            trigger={
              <Button size="sm">
                <Plus /> Tambah periode
              </Button>
            }
            title="Tambah periode"
            action={simpanPeriode.bind(null, null)}
          >
            <PeriodeFields />
          </FormDialog>
        }
      />
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <Daftar />
      </Suspense>
    </div>
  );
}

async function Daftar() {
  await requireRole("admin");
  const periode = await getPeriodeList();

  if (periode.length === 0) {
    return (
      <EmptyState
        title="Belum ada periode"
        description="Tambahkan periode pertama (misalnya 2026/2027 Ganjil), lalu aktifkan."
      />
    );
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tahun ajaran</TableHead>
            <TableHead>Semester</TableHead>
            <TableHead>Tanggal rapor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {periode.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.tahun_ajaran}</TableCell>
              <TableCell>{SEMESTER_LABEL[p.semester]}</TableCell>
              <TableCell className="text-muted-foreground">{formatTanggal(p.tanggal_rapor)}</TableCell>
              <TableCell>
                {p.aktif ? <Badge>Aktif</Badge> : <Badge variant="outline">Tidak aktif</Badge>}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  {!p.aktif ? (
                    <FormDialog
                      trigger={
                        <Button variant="ghost" size="sm">
                          <CheckCircle2 /> Aktifkan
                        </Button>
                      }
                      title="Aktifkan periode?"
                      description={`Periode ${p.tahun_ajaran} ${SEMESTER_LABEL[p.semester]} akan menjadi periode aktif. Periode aktif sebelumnya otomatis dinonaktifkan.`}
                      submitLabel="Aktifkan"
                      action={aktifkanPeriode.bind(null, p.id)}
                    />
                  ) : null}
                  <FormDialog
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label="Ubah">
                        <Pencil />
                      </Button>
                    }
                    title="Ubah periode"
                    action={simpanPeriode.bind(null, p.id)}
                  >
                    <PeriodeFields periode={p} />
                  </FormDialog>
                  {!p.aktif ? (
                    <FormDialog
                      trigger={
                        <Button variant="ghost" size="icon-sm" aria-label="Hapus">
                          <Trash2 />
                        </Button>
                      }
                      title="Hapus periode?"
                      description="Semua kelas dan keanggotaan kelas pada periode ini ikut terhapus. Tindakan ini tidak bisa dibatalkan."
                      submitLabel="Hapus"
                      destructive
                      action={hapusPeriode.bind(null, p.id)}
                    />
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
