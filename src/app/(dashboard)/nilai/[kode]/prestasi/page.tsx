import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Field, FormDialog } from "@/components/form-dialog";
import { EmptyState } from "@/components/page-header";
import { PeriodeSelect } from "@/components/periode-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bisaKelolaPrestasi, getCurrentUser } from "@/lib/auth";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import { getPrestasiProgram, TINGKAT_LOMBA_LABEL, type TingkatLomba } from "@/lib/data/modul-khusus";
import { formatTanggal } from "@/lib/format";
import { getKelompokIzinGuru, getPesertaProgram, getProgramByKode } from "@/lib/data/program";
import { hapusPrestasi, simpanPrestasi } from "@/app/(dashboard)/program/[kode]/modul-khusus-actions";
import { NilaiSubnav } from "../nilai-subnav";

const TINGKAT: TingkatLomba[] = ["madrasah", "kabupaten", "provinsi", "nasional"];

export default function PrestasiNilaiPage(props: PageProps<"/nilai/[kode]/prestasi">) {
  return (
    <div className="mx-auto grid max-w-6xl gap-4">
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Isi params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Isi({
  params,
  searchParams,
}: {
  params: PageProps<"/nilai/[kode]/prestasi">["params"];
  searchParams: PageProps<"/nilai/[kode]/prestasi">["searchParams"];
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

  const kelompokIzin = user.role === "guru" ? await getKelompokIzinGuru(program.id, dipilih.id, user.id) : "semua";
  const [prestasiSemua, pesertaSemua, bolehKelola] = await Promise.all([
    getPrestasiProgram(program.id),
    getPesertaProgram(program.id, dipilih.id),
    bisaKelolaPrestasi(user, program.id),
  ]);

  const peserta =
    kelompokIzin === "semua"
      ? pesertaSemua
      : pesertaSemua.filter((p) => p.kelompok_id !== null && kelompokIzin.includes(p.kelompok_id));
  const idSiswaDiizinkan = new Set(peserta.map((p) => p.siswa.id));
  const prestasi = kelompokIzin === "semua" ? prestasiSemua : prestasiSemua.filter((p) => idSiswaDiizinkan.has(p.siswa_id));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Prestasi — {program.nama}</h1>
        <PeriodeSelect
          current={dipilih.id}
          options={daftarPeriode.map((p) => ({ id: p.id, label: labelPeriode(p) + (p.aktif ? " (aktif)" : "") }))}
        />
      </div>

      <NilaiSubnav kode={kode} tampilkanPrestasi={program.jenis === "ksm"} />

      {program.jenis !== "ksm" ? (
        <EmptyState title="Bukan program KSM" description="Modul Prestasi hanya untuk program KSM." />
      ) : (
        <div className="grid gap-4">
          <div className="flex justify-end">
            {bolehKelola && peserta.length > 0 ? (
              <FormDialog
                trigger={
                  <Button size="sm">
                    <Plus /> Tambah prestasi
                  </Button>
                }
                title="Tambah prestasi"
                description="Dipilih dari peserta program ini pada periode yang sedang dilihat."
                action={simpanPrestasi.bind(null, program.id, null)}
              >
                <PrestasiFields peserta={peserta} />
              </FormDialog>
            ) : null}
          </div>

          {prestasi.length === 0 ? (
            <EmptyState title="Belum ada prestasi" description="Catat riwayat lomba siswa di program ini." />
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Lomba</TableHead>
                    <TableHead>Tingkat</TableHead>
                    <TableHead>Peringkat</TableHead>
                    <TableHead>Tanggal</TableHead>
                    {bolehKelola ? <TableHead className="text-right">Aksi</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prestasi.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.siswa_nama}</TableCell>
                      <TableCell>{p.nama_lomba}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{TINGKAT_LOMBA_LABEL[p.tingkat]}</Badge>
                      </TableCell>
                      <TableCell>{p.peringkat ?? "—"}</TableCell>
                      <TableCell>{formatTanggal(p.tanggal)}</TableCell>
                      {bolehKelola ? (
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <FormDialog
                              trigger={
                                <Button variant="ghost" size="icon-sm" aria-label={`Ubah prestasi ${p.nama_lomba}`}>
                                  <Pencil />
                                </Button>
                              }
                              title="Ubah prestasi"
                              action={simpanPrestasi.bind(null, program.id, p.id)}
                            >
                              <PrestasiFields peserta={peserta} prestasi={p} />
                            </FormDialog>
                            <FormDialog
                              trigger={
                                <Button variant="ghost" size="icon-sm" aria-label={`Hapus prestasi ${p.nama_lomba}`}>
                                  <Trash2 />
                                </Button>
                              }
                              title={`Hapus prestasi "${p.nama_lomba}"?`}
                              submitLabel="Hapus"
                              destructive
                              action={hapusPrestasi.bind(null, program.id, p.id)}
                            />
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function PrestasiFields({
  peserta,
  prestasi,
}: {
  peserta: { id: string; siswa: { id: string; nama: string } }[];
  prestasi?: { siswa_id: string; nama_lomba: string; tingkat: TingkatLomba; peringkat: string | null; tanggal: string | null };
}) {
  return (
    <>
      <Field label="Siswa" htmlFor="siswa_id">
        <NativeSelect id="siswa_id" name="siswa_id" className="w-full" required defaultValue={prestasi?.siswa_id ?? ""}>
          <NativeSelectOption value="" disabled>
            Pilih siswa…
          </NativeSelectOption>
          {peserta.map((p) => (
            <NativeSelectOption key={p.siswa.id} value={p.siswa.id}>
              {p.siswa.nama}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Nama lomba" htmlFor="nama_lomba">
        <Input id="nama_lomba" name="nama_lomba" defaultValue={prestasi?.nama_lomba} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tingkat" htmlFor="tingkat">
          <NativeSelect id="tingkat" name="tingkat" className="w-full" defaultValue={prestasi?.tingkat ?? "madrasah"}>
            {TINGKAT.map((t) => (
              <NativeSelectOption key={t} value={t}>
                {TINGKAT_LOMBA_LABEL[t]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Peringkat" htmlFor="peringkat" hint='Contoh: "Juara 1"'>
          <Input id="peringkat" name="peringkat" defaultValue={prestasi?.peringkat ?? ""} />
        </Field>
      </div>
      <Field label="Tanggal" htmlFor="tanggal">
        <Input id="tanggal" name="tanggal" type="date" defaultValue={prestasi?.tanggal ?? ""} />
      </Field>
    </>
  );
}
