import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserMinus, UserPlus } from "lucide-react";
import { FormDialog } from "@/components/form-dialog";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { getAnggotaKelas, getKelas, getPeriodeList, getSiswaTanpaKelas, labelPeriode } from "@/lib/data/master";
import { TINGKAT_ROMAWI } from "@/lib/format";
import { keluarkanAnggota, tambahAnggota } from "../actions";
import { AnggotaPicker } from "./anggota-picker";

export default function DetailKelasPage(props: PageProps<"/master/kelas/[id]">) {
  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <Button variant="ghost" size="sm" className="w-fit" nativeButton={false} render={<Link href="/master/kelas" />}>
        <ArrowLeft /> Semua kelas
      </Button>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Isi params={props.params} />
      </Suspense>
    </div>
  );
}

async function Isi({ params }: { params: PageProps<"/master/kelas/[id]">["params"] }) {
  await requireRole("admin");
  const { id } = await params;

  const kelas = await getKelas(id);
  if (!kelas) notFound();

  const [anggota, calon, periode] = await Promise.all([
    getAnggotaKelas(kelas.id),
    getSiswaTanpaKelas(kelas.periode_id),
    getPeriodeList(),
  ]);
  const periodeKelas = periode.find((p) => p.id === kelas.periode_id);

  return (
    <>
      <PageHeader
        title={`Kelas ${kelas.nama}`}
        description={`Tingkat ${TINGKAT_ROMAWI[kelas.tingkat] ?? kelas.tingkat} · ${
          periodeKelas ? labelPeriode(periodeKelas) : ""
        } · ${anggota.length} siswa`}
        actions={
          <FormDialog
            trigger={
              <Button size="sm">
                <UserPlus /> Tambah siswa
              </Button>
            }
            title="Tambah siswa ke kelas"
            description="Hanya siswa aktif yang belum punya kelas di periode ini yang ditampilkan."
            submitLabel="Tambahkan"
            wide
            action={tambahAnggota.bind(null, kelas.id, kelas.periode_id)}
          >
            <AnggotaPicker calon={calon.map((s) => ({ id: s.id, nis: s.nis, nama: s.nama }))} />
          </FormDialog>
        }
      />

      {anggota.length === 0 ? (
        <EmptyState
          title="Kelas ini belum punya anggota"
          description="Klik Tambah siswa. Belum ada siswa? Tambahkan dulu di Master Data → Siswa."
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>NIS</TableHead>
                <TableHead>NISN</TableHead>
                <TableHead>JK</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anggota.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{s.nama}</TableCell>
                  <TableCell>{s.nis}</TableCell>
                  <TableCell>{s.nisn ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{s.jk}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <FormDialog
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label={`Keluarkan ${s.nama}`}>
                            <UserMinus />
                          </Button>
                        }
                        title={`Keluarkan ${s.nama}?`}
                        description="Siswa hanya dikeluarkan dari kelas ini, datanya tetap ada."
                        submitLabel="Keluarkan"
                        destructive
                        action={keluarkanAnggota.bind(null, kelas.id, s.id)}
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
