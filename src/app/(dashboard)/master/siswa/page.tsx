import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, ChevronRight, Download, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { Field, FormDialog } from "@/components/form-dialog";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { SISWA_PER_HALAMAN, getPeriodeAktif, getSiswaPage, labelPeriode } from "@/lib/data/master";
import { hapusSiswa, importSiswa, simpanSiswa } from "./actions";
import { SiswaFields } from "./siswa-fields";

export const metadata: Metadata = { title: "Siswa" };

export default function SiswaPage(props: PageProps<"/master/siswa">) {
  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <PageHeader
        title="Siswa"
        description="Data induk siswa. Penempatan ke kelas dilakukan per periode di menu Kelas."
        actions={
          <>
            <Button variant="outline" size="sm" nativeButton={false} render={<a href="/master/siswa/template" download />}>
              <Download /> Unduh template
            </Button>
            <FormDialog
              trigger={
                <Button variant="outline" size="sm">
                  <Upload /> Import Excel
                </Button>
              }
              title="Import siswa dari Excel"
              description="Gunakan template dari tombol Unduh template. NIS yang sudah ada akan diperbarui, bukan dobel."
              submitLabel="Import"
              action={importSiswa}
            >
              <Field label="File Excel (.xlsx)" htmlFor="file" hint="Maksimal 2 MB. Jika ada satu baris yang salah, seluruh import dibatalkan.">
                <Input id="file" name="file" type="file" accept=".xlsx" required />
              </Field>
            </FormDialog>
            <FormDialog
              trigger={
                <Button size="sm">
                  <Plus /> Tambah siswa
                </Button>
              }
              title="Tambah siswa"
              action={simpanSiswa.bind(null, null)}
            >
              <SiswaFields />
            </FormDialog>
          </>
        }
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Daftar searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Daftar({ searchParams }: { searchParams: PageProps<"/master/siswa">["searchParams"] }) {
  await requireRole("admin");
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q) ?? "";
  const halaman = Math.max(1, Number(Array.isArray(sp.halaman) ? sp.halaman[0] : sp.halaman) || 1);

  const aktif = await getPeriodeAktif();
  const { siswa, total } = await getSiswaPage({ q, halaman, periodeAktifId: aktif?.id });
  const totalHalaman = Math.max(1, Math.ceil(total / SISWA_PER_HALAMAN));

  const href = (h: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (h > 1) p.set("halaman", String(h));
    const s = p.toString();
    return s ? `/master/siswa?${s}` : "/master/siswa";
  };

  return (
    <>
      <form action="/master/siswa" className="flex gap-2">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Cari nama, NIS, atau NISN…" className="pl-8" />
        </div>
        <Button type="submit" variant="outline">
          Cari
        </Button>
        {q ? (
          <Button variant="ghost" nativeButton={false} render={<Link href="/master/siswa" />}>
            Reset
          </Button>
        ) : null}
      </form>

      {siswa.length === 0 ? (
        <EmptyState
          title={q ? "Tidak ada siswa yang cocok" : "Belum ada siswa"}
          description={q ? "Coba kata kunci lain." : "Tambahkan satu per satu atau import dari Excel."}
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>NIS</TableHead>
                <TableHead>NISN</TableHead>
                <TableHead>JK</TableHead>
                <TableHead>{aktif ? `Kelas (${labelPeriode(aktif)})` : "Kelas"}</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {siswa.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.nama}
                    {!s.aktif ? (
                      <Badge variant="outline" className="ml-2">
                        Nonaktif
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>{s.nis}</TableCell>
                  <TableCell>{s.nisn ?? "—"}</TableCell>
                  <TableCell>{s.jk}</TableCell>
                  <TableCell className="text-muted-foreground">{s.kelas ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <FormDialog
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label={`Ubah ${s.nama}`}>
                            <Pencil />
                          </Button>
                        }
                        title="Ubah siswa"
                        action={simpanSiswa.bind(null, s.id)}
                      >
                        <SiswaFields siswa={s} />
                      </FormDialog>
                      <FormDialog
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label={`Hapus ${s.nama}`}>
                            <Trash2 />
                          </Button>
                        }
                        title={`Hapus ${s.nama}?`}
                        description="Seluruh data siswa ini (keanggotaan kelas, dan nanti nilai & hafalan) ikut terhapus permanen. Jika siswa hanya lulus atau pindah, lebih baik ubah statusnya menjadi Nonaktif."
                        submitLabel="Hapus permanen"
                        destructive
                        action={hapusSiswa.bind(null, s.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total} siswa · halaman {Math.min(halaman, totalHalaman)} dari {totalHalaman}
        </span>
        <div className="flex gap-2">
          {halaman > 1 ? (
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={href(halaman - 1)} />}>
              <ChevronLeft /> Sebelumnya
            </Button>
          ) : null}
          {halaman < totalHalaman ? (
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={href(halaman + 1)} />}>
              Berikutnya <ChevronRight />
            </Button>
          ) : null}
        </div>
      </div>
    </>
  );
}
