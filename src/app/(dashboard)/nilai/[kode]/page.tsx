import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, SlidersHorizontal } from "lucide-react";
import { EmptyState } from "@/components/page-header";
import { PeriodeSelect } from "@/components/periode-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { getSkalaPredikatGlobal } from "@/lib/data/indikator";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import { filterBarisKelompok, getGridNilai } from "@/lib/data/nilai";
import { getKelompokIzinGuru, getProgramByKode } from "@/lib/data/program";
import { cn } from "cn";
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
  const searchParamsResolved = await searchParams;
  const periodeParam = Array.isArray(searchParamsResolved.periode)
    ? searchParamsResolved.periode[0]
    : searchParamsResolved.periode;
  const tingkatParam = Array.isArray(searchParamsResolved.tingkat)
    ? searchParamsResolved.tingkat[0]
    : searchParamsResolved.tingkat;
  const tingkatAngka = tingkatParam && ["7", "8", "9"].includes(tingkatParam) ? Number(tingkatParam) : null;

  const program = await getProgramByKode(kode);
  if (!program) notFound();

  const daftarPeriode = await getPeriodeList();
  if (daftarPeriode.length === 0) {
    return <EmptyState title="Belum ada periode" description="Buat dan aktifkan periode di Master Data → Periode." />;
  }

  const dipilih =
    daftarPeriode.find((p) => p.id === periodeParam) ??
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
    getGridNilai(program.id, dipilih.id, tingkatAngka),
    getSkalaPredikatGlobal(),
  ]);

  const baris = filterBarisKelompok(semuaBaris, kelompokIzin);

  const tabsTingkat = [
    { label: "Semua Tingkat", value: "" },
    { label: "Kelas VII", value: "7" },
    { label: "Kelas VIII", value: "8" },
    { label: "Kelas IX", value: "9" },
  ];

  const downloadUrl = `/nilai/${kode}/template?periode=${dipilih.id}${tingkatAngka ? `&tingkat=${tingkatAngka}` : ""}`;

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
            render={<Link href={`/program/${kode}/indikator?periode=${dipilih.id}`} />}
          >
            <SlidersHorizontal /> Konfigurasi Indikator
          </Button>
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href={downloadUrl} download />}
          >
            <Download /> Unduh Excel
          </Button>
          <ImportNilaiDialog programId={program.id} periodeId={dipilih.id} />
        </div>
      </div>

      <NilaiSubnav kode={kode} tampilkanPrestasi={program.jenis === "ksm"} />

      {/* Filter Tingkatan Kelas */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground mr-1">Tingkatan Kelas:</span>
          {tabsTingkat.map((tab) => {
            const isActive = (tingkatParam ?? "") === tab.value;
            const href = tab.value
              ? `/nilai/${kode}?periode=${dipilih.id}&tingkat=${tab.value}`
              : `/nilai/${kode}?periode=${dipilih.id}`;
            return (
              <Link
                key={tab.value}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        {tingkatAngka ? (
          <span className="text-xs text-muted-foreground">
            Menampilkan siswa dan indikator khusus Kelas {tingkatAngka} (serta indikator lintas kelas).
          </span>
        ) : null}
      </div>

      {kolom.length === 0 ? (
        <EmptyState
          title="Belum ada indikator aktif"
          description="Tambahkan indikator dulu di menu Indikator sebelum mengisi nilai."
        >
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href={`/program/${kode}/indikator?periode=${dipilih.id}`} />}
          >
            Atur Indikator Sekarang
          </Button>
        </EmptyState>
      ) : baris.length === 0 ? (
        <EmptyState
          title={tingkatAngka ? `Belum ada peserta Kelas ${tingkatAngka}` : "Belum ada peserta"}
          description="Daftarkan peserta dulu di menu Peserta (Program & Peserta)."
        />
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
                    <div>
                      <span>{k.nama}</span>
                      {k.tingkat ? (
                        <span className="ml-1 inline-block text-[10px] text-muted-foreground font-normal">
                          (Kelas {k.tingkat})
                        </span>
                      ) : null}
                    </div>
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
                  {kolom.map((k) => {
                    // Jika kolom terikat ke tingkat kelas tertentu yang tidak sesuai dengan tingkat kelas siswa:
                    const tidakCocokTingkat =
                      k.tingkat !== null && b.kelas_tingkat !== null && k.tingkat !== b.kelas_tingkat;

                    return (
                      <TableCell key={k.id}>
                        {tidakCocokTingkat ? (
                          <span
                            className="inline-block w-8 text-center text-xs text-muted-foreground/40 font-mono select-none"
                            title={`Indikator ini khusus Kelas ${k.tingkat}`}
                          >
                            —
                          </span>
                        ) : (
                          <NilaiCell
                            pesertaProgramId={b.id}
                            indikatorId={k.id}
                            nilaiAwal={b.nilai[k.id]?.nilai}
                            skala={skala}
                          />
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <DeskripsiSheet
                      siswaNama={b.siswa.nama}
                      siswaJk={b.siswa.jk}
                      bahasaUtama={program.bahasa_utama}
                      tampilkanTerjemahan={program.tampilkan_terjemahan}
                      kolom={kolom.filter((k) => k.tingkat === null || b.kelas_tingkat === null || k.tingkat === b.kelas_tingkat)}
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
