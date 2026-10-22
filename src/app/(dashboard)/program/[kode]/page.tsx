import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, FileSignature, Layers, UsersRound } from "lucide-react";
import { EmptyState } from "@/components/page-header";
import { PeriodeSelect } from "@/components/periode-select";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUser } from "@/lib/auth";
import { getIndikatorProgram } from "@/lib/data/indikator";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import {
  BAHASA_LABEL,
  getKelompokProgram,
  getPenandaTangan,
  getPenugasanGuru,
  getPesertaProgram,
  getProgramByKode,
} from "@/lib/data/program";

export default function RingkasanProgramPage(props: PageProps<"/program/[kode]">) {
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
  params: PageProps<"/program/[kode]">["params"];
  searchParams: PageProps<"/program/[kode]">["searchParams"];
}) {
  await getCurrentUser();
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

  const [peserta, kelompok, guru, penandaTangan, indikator] = await Promise.all([
    getPesertaProgram(program.id, dipilih.id),
    getKelompokProgram(program.id, dipilih.id),
    getPenugasanGuru(program.id, dipilih.id),
    getPenandaTangan(program.id, dipilih.id),
    getIndikatorProgram(program.id, dipilih.id),
  ]);

  return (
    <div className="grid gap-4">
      <PeriodeSelect
        current={dipilih.id}
        options={daftarPeriode.map((p) => ({ id: p.id, label: labelPeriode(p) + (p.aktif ? " (aktif)" : "") }))}
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <Link
          href={`/program/${kode}/indikator`}
          className="grid gap-1 rounded-xl border p-4 transition-colors hover:border-foreground/20 hover:bg-muted/40"
        >
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <ClipboardList className="size-4" /> Indikator
          </span>
          <span className="text-2xl font-semibold">{indikator.length}</span>
        </Link>
        <Link
          href={`/program/${kode}/peserta`}
          className="grid gap-1 rounded-xl border p-4 transition-colors hover:border-foreground/20 hover:bg-muted/40"
        >
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <UsersRound className="size-4" /> Peserta
          </span>
          <span className="text-2xl font-semibold">{peserta.length}</span>
          <span className="text-xs text-muted-foreground">{kelompok.length} kelompok</span>
        </Link>
        <Link
          href={`/program/${kode}/guru`}
          className="grid gap-1 rounded-xl border p-4 transition-colors hover:border-foreground/20 hover:bg-muted/40"
        >
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layers className="size-4" /> Guru ditugaskan
          </span>
          <span className="text-2xl font-semibold">{guru.length}</span>
        </Link>
        <Link
          href={`/program/${kode}/guru`}
          className="grid gap-1 rounded-xl border p-4 transition-colors hover:border-foreground/20 hover:bg-muted/40"
        >
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileSignature className="size-4" /> Penanda tangan
          </span>
          <span className="text-2xl font-semibold">{penandaTangan.length} / 3</span>
        </Link>
      </div>

      <div className="grid gap-3 rounded-xl border p-4 text-sm sm:grid-cols-2">
        <Baris label="Kode" value={program.kode} />
        <Baris label="Bahasa utama" value={BAHASA_LABEL[program.bahasa_utama]} />
        <Baris label="Tampilkan terjemahan" value={program.tampilkan_terjemahan ? "Ya" : "Tidak"} />
        <Baris label="KKTP" value={program.kktp ? String(program.kktp) : "Belum diatur"} />
        {program.bobot_hafalan != null ? (
          <Baris
            label="Bobot nilai akhir"
            value={`${program.bobot_hafalan}% hafalan + ${100 - program.bobot_hafalan}% kualitas`}
          />
        ) : null}
      </div>
    </div>
  );
}

function Baris({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-start sm:gap-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
