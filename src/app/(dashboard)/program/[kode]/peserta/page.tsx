import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Plus, UserMinus, UserPlus, X } from "lucide-react";
import { Field, FormDialog } from "@/components/form-dialog";
import { EmptyState } from "@/components/page-header";
import { PeriodeSelect } from "@/components/periode-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import { getCalonPeserta, getKelompokProgram, getPesertaProgram, getProgramByKode } from "@/lib/data/program";
import { hapusKelompok, keluarkanPeserta, simpanKelompok, tambahPeserta } from "../../actions";
import { KelompokSelect } from "./kelompok-select";
import { PesertaPicker } from "./peserta-picker";

export default function PesertaProgramPage(props: PageProps<"/program/[kode]/peserta">) {
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
  params: PageProps<"/program/[kode]/peserta">["params"];
  searchParams: PageProps<"/program/[kode]/peserta">["searchParams"];
}) {
  await requireRole("admin", "koordinator");
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

  const [peserta, kelompok, calon] = await Promise.all([
    getPesertaProgram(program.id, dipilih.id),
    getKelompokProgram(program.id, dipilih.id),
    getCalonPeserta(program.id, dipilih.id),
  ]);

  return (
    <div className="grid gap-4">
      <PeriodeSelect
        current={dipilih.id}
        options={daftarPeriode.map((p) => ({ id: p.id, label: labelPeriode(p) + (p.aktif ? " (aktif)" : "") }))}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-sm text-muted-foreground">Kelompok:</span>
          {kelompok.map((k) => (
            <span key={k.id} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
              {k.nama}
              <FormDialog
                trigger={
                  <button type="button" aria-label={`Hapus kelompok ${k.nama}`} className="text-muted-foreground hover:text-destructive">
                    <X className="size-3" />
                  </button>
                }
                title={`Hapus kelompok ${k.nama}?`}
                description="Peserta di kelompok ini kembali jadi tanpa kelompok (tidak dikeluarkan dari program)."
                submitLabel="Hapus"
                destructive
                action={hapusKelompok.bind(null, k.id)}
              />
            </span>
          ))}
          <FormDialog
            trigger={
              <Button variant="outline" size="sm">
                <Plus /> Kelompok
              </Button>
            }
            title="Tambah kelompok"
            description={`Pada program ${program.nama}`}
            action={simpanKelompok.bind(null, program.id, dipilih.id, null)}
          >
            <Field label="Nama kelompok" htmlFor="nama" hint='Contoh: "Halaqah 1" atau "English Club A"'>
              <Input id="nama" name="nama" required />
            </Field>
          </FormDialog>
        </div>

        <FormDialog
          trigger={
            <Button size="sm">
              <UserPlus /> Tambah peserta
            </Button>
          }
          title="Tambah peserta"
          description={`Siswa aktif lintas kelas yang belum ikut ${program.nama} di periode ini.`}
          submitLabel="Tambahkan"
          wide
          action={tambahPeserta.bind(null, program.id, dipilih.id)}
        >
          <PesertaPicker calon={calon} kelompok={kelompok} />
        </FormDialog>
      </div>

      {peserta.length === 0 ? (
        <EmptyState
          title="Belum ada peserta"
          description="Klik Tambah peserta untuk mendaftarkan siswa ke program ini."
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>NIS</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Kelompok</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {peserta.map((p, i) => (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{p.siswa.nama}</TableCell>
                  <TableCell>{p.siswa.nis}</TableCell>
                  <TableCell>{p.kelas_nama ?? "—"}</TableCell>
                  <TableCell>
                    {kelompok.length > 0 ? (
                      <KelompokSelect pesertaId={p.id} kelompokId={p.kelompok_id} opsi={kelompok} />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <FormDialog
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label={`Keluarkan ${p.siswa.nama}`}>
                            <UserMinus />
                          </Button>
                        }
                        title={`Keluarkan ${p.siswa.nama}?`}
                        description="Siswa hanya dikeluarkan dari program ini, data siswanya tetap ada."
                        submitLabel="Keluarkan"
                        destructive
                        action={keluarkanPeserta.bind(null, p.id)}
                      />
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
