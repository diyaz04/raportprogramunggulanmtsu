import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { EmptyState } from "@/components/page-header";
import { PeriodeSelect } from "@/components/periode-select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { getSkalaPredikatGlobal } from "@/lib/data/indikator";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import { filterBarisKelompok, getGridNilai } from "@/lib/data/nilai";
import { getKelompokIzinGuru, getProgramByKode } from "@/lib/data/program";
import { DeskripsiSheet } from "./deskripsi-sheet";
import { ImportNilaiDialog } from "./import-nilai-dialog";
import { NilaiCell } from "./nilai-cell";
import { NilaiSubnav } from "./nilai-subnav";

export default function GridNilaiPage(props: PageProps<"/nilai/[kode]">) {
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
  params: PageProps<"/nilai/[kode]">["params"];
  searchParams: PageProps<"/nilai/[kode]">["searchParams"];
}) {
  const user = await requireRole("admin", "koordinator", "guru");
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
  if (kelompokIzin !== "semua" && kelompokIzin.length === 0) {
    return (
      <EmptyState
        title="Anda belum ditugaskan ke program ini"
        description="Hubungi admin/koordinator untuk ditugaskan terlebih dahulu."
      />
    );
  }

  const [{ baris: semuaBaris, kolom }, skala] = await Promise.all([
    getGridNilai(program.id, dipilih.id),
    getSkalaPredikatGlobal(),
  ]);

  const baris = filterBarisKelompok(semuaBaris, kelompokIzin);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Input Nilai — {program.nama}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Nilai tersimpan otomatis saat pindah ke sel lain atau tekan Enter.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodeSelect
            current={dipilih.id}
            options={daftarPeriode.map((p) => ({ id: p.id, label: labelPeriode(p) + (p.aktif ? " (aktif)" : "") }))}
          />
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href={`/nilai/${kode}/template?periode=${dipilih.id}`} download />}
          >
            <Download /> Unduh Excel
          </Button>
          <ImportNilaiDialog programId={program.id} periodeId={dipilih.id} />
        </div>
      </div>

      <NilaiSubnav kode={kode} tampilkanPrestasi={program.jenis === "ksm"} />

      {kolom.length === 0 ? (
        <EmptyState
          title="Belum ada indikator aktif"
          description="Tambahkan indikator dulu di menu Indikator (Program & Peserta) sebelum mengisi nilai."
        />
      ) : baris.length === 0 ? (
        <EmptyState title="Belum ada peserta" description="Daftarkan peserta dulu di menu Peserta (Program & Peserta)." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">No</TableHead>
                <TableHead className="sticky left-0 z-10 bg-background">Nama</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Kelompok</TableHead>
                {kolom.map((k) => (
                  <TableHead key={k.id} className="min-w-28">
                    {k.nama}
                  </TableHead>
                ))}
                <TableHead className="w-10">Deskripsi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {baris.map((b, i) => (
                <TableRow key={b.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="sticky left-0 z-10 bg-background font-medium">{b.siswa.nama}</TableCell>
                  <TableCell>{b.kelas_nama ?? "—"}</TableCell>
                  <TableCell>{b.kelompok_nama ?? "—"}</TableCell>
                  {kolom.map((k) => (
                    <TableCell key={k.id}>
                      <NilaiCell
                        pesertaProgramId={b.id}
                        indikatorId={k.id}
                        nilaiAwal={b.nilai[k.id]?.nilai}
                        skala={skala}
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <DeskripsiSheet
                      siswaNama={b.siswa.nama}
                      siswaJk={b.siswa.jk}
                      bahasaUtama={program.bahasa_utama}
                      tampilkanTerjemahan={program.tampilkan_terjemahan}
                      kolom={kolom}
                      nilaiSiswa={b.nilai}
                      skala={skala}
                    />
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
