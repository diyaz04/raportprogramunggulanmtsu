import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Printer, Zap } from "lucide-react";
import { FormDialog } from "@/components/form-dialog";
import { EmptyState } from "@/components/page-header";
import { PeriodeSelect } from "@/components/periode-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireRole } from "@/lib/auth";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import { getProgramByKode } from "@/lib/data/program";
import { getRaporProgram, STATUS_RAPOR_LABEL, type StatusRapor } from "@/lib/data/rapor";
import { prosesMassalKunci } from "./actions";

const WARNA_STATUS: Record<StatusRapor, string> = {
  draft: "bg-muted text-muted-foreground",
  review: "border-amber-300 bg-amber-50 text-amber-800",
  disetujui: "border-sky-300 bg-sky-50 text-sky-800",
  terkunci: "border-emerald-300 bg-emerald-50 text-emerald-800",
};

export default function RaporProgramPage(props: PageProps<"/rapor/[kode]">) {
  return (
    <div className="mx-auto grid max-w-5xl gap-4">
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
  params: PageProps<"/rapor/[kode]">["params"];
  searchParams: PageProps<"/rapor/[kode]">["searchParams"];
}) {
  const user = await requireRole("admin", "koordinator", "guru", "kepala");
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

  const baris = await getRaporProgram(program.id, dipilih.id);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rapor — {program.nama}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Klik baris untuk meninjau, mengedit catatan, atau memproses.</p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodeSelect
            current={dipilih.id}
            options={daftarPeriode.map((p) => ({ id: p.id, label: labelPeriode(p) + (p.aktif ? " (aktif)" : "") }))}
          />
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/cetak/${kode}?periode=${dipilih.id}`} target="_blank" />}>
            <Printer /> Cetak massal
          </Button>
          {user.role === "admin" ? (
            <FormDialog
              trigger={
                <Button variant="outline" size="sm">
                  <Zap /> Hitung &amp; Kunci Massal
                </Button>
              }
              title="Hitung & kunci rapor secara massal?"
              description="Untuk setiap peserta yang BELUM terkunci: hitung ulang nilai akhir, lewati yang nilainya belum lengkap (semua indikator harus terisi), lalu langsung kunci & terbitkan sisanya. Rapor yang sudah terkunci tidak disentuh."
              submitLabel="Proses sekarang"
              action={prosesMassalKunci.bind(null, program.id, dipilih.id)}
            />
          ) : null}
        </div>
      </div>

      {baris.length === 0 ? (
        <EmptyState title="Belum ada peserta" description="Daftarkan peserta dulu di menu Program & Peserta." />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Nilai Akhir</TableHead>
                <TableHead>Predikat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {baris.map((b) => (
                <TableRow key={b.peserta_program_id}>
                  <TableCell className="font-medium">{b.siswa_nama}</TableCell>
                  <TableCell>{b.kelas_nama ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={b.status ? WARNA_STATUS[b.status] : "bg-muted text-muted-foreground"}>
                      {b.status ? STATUS_RAPOR_LABEL[b.status] : "Belum dihitung"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{b.nilai_akhir ?? "—"}</TableCell>
                  <TableCell>{b.predikat ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        nativeButton={false}
                        render={<Link href={`/rapor/${kode}/${b.peserta_program_id}`} />}
                      >
                        Buka <ArrowRight />
                      </Button>
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
