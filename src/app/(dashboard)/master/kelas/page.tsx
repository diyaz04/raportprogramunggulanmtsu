import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { FormDialog } from "@/components/form-dialog";
import { EmptyState, PageHeader } from "@/components/page-header";
import { PeriodeSelect } from "@/components/periode-select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { getKelasByPeriode, getPeriodeList, labelPeriode } from "@/lib/data/master";
import { TINGKAT_ROMAWI } from "@/lib/format";
import { hapusKelas, simpanKelas } from "./actions";
import { KelasFields } from "./kelas-fields";

export const metadata: Metadata = { title: "Kelas" };

export default function KelasPage(props: PageProps<"/master/kelas">) {
  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <PageHeader title="Kelas" description="Daftar kelas per periode. Siswa dimasukkan ke kelas lewat tombol Anggota." />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Isi searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Isi({ searchParams }: { searchParams: PageProps<"/master/kelas">["searchParams"] }) {
  await requireRole("admin");
  const { periode: periodeParam } = await searchParams;
  const daftarPeriode = await getPeriodeList();

  if (daftarPeriode.length === 0) {
    return (
      <EmptyState
        title="Belum ada periode"
        description="Buat dan aktifkan periode dulu di menu Master Data → Periode."
      />
    );
  }

  const dipilih =
    daftarPeriode.find((p) => p.id === (Array.isArray(periodeParam) ? periodeParam[0] : periodeParam)) ??
    daftarPeriode.find((p) => p.aktif) ??
    daftarPeriode[0];

  const kelas = await getKelasByPeriode(dipilih.id);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PeriodeSelect
          current={dipilih.id}
          options={daftarPeriode.map((p) => ({ id: p.id, label: labelPeriode(p) + (p.aktif ? " (aktif)" : "") }))}
        />
        <FormDialog
          trigger={
            <Button size="sm">
              <Plus /> Tambah kelas
            </Button>
          }
          title="Tambah kelas"
          description={`Pada periode ${labelPeriode(dipilih)}`}
          action={simpanKelas.bind(null, dipilih.id, null)}
        >
          <KelasFields />
        </FormDialog>
      </div>

      {kelas.length === 0 ? (
        <EmptyState title="Belum ada kelas di periode ini" description="Klik Tambah kelas untuk membuat kelas pertama." />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kelas</TableHead>
                <TableHead>Tingkat</TableHead>
                <TableHead>Jumlah siswa</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kelas.map((k) => (
                <TableRow key={k.id}>
                  <TableCell className="font-medium">{k.nama}</TableCell>
                  <TableCell>{TINGKAT_ROMAWI[k.tingkat] ?? k.tingkat}</TableCell>
                  <TableCell>{k.jumlah_siswa}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/master/kelas/${k.id}`} />}>
                        <Users /> Anggota
                      </Button>
                      <FormDialog
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label="Ubah">
                            <Pencil />
                          </Button>
                        }
                        title="Ubah kelas"
                        action={simpanKelas.bind(null, dipilih.id, k.id)}
                      >
                        <KelasFields kelas={k} />
                      </FormDialog>
                      <FormDialog
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label="Hapus">
                            <Trash2 />
                          </Button>
                        }
                        title={`Hapus kelas ${k.nama}?`}
                        description="Keanggotaan siswa di kelas ini ikut terhapus (data siswanya tidak). Tindakan ini tidak bisa dibatalkan."
                        submitLabel="Hapus"
                        destructive
                        action={hapusKelas.bind(null, k.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
