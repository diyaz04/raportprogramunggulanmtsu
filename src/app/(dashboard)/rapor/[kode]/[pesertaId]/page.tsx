import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ArrowLeft } from "lucide-react";
import { EmptyState } from "@/components/page-header";
import { RaporA4 } from "@/components/rapor/rapor-a4";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth";
import { getSkalaPredikatGlobal } from "@/lib/data/indikator";
import { getPesertaProgramById } from "@/lib/data/program";
import { getRaporSatu, rakitDataRapor, STATUS_RAPOR_LABEL, type StatusRapor } from "@/lib/data/rapor";
import { AksiRapor } from "./aksi-rapor";
import { CatatanForm } from "./catatan-form";

export default function DetailRaporPage(props: PageProps<"/rapor/[kode]/[pesertaId]">) {
  return (
    <div className="mx-auto grid max-w-5xl gap-4">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Isi params={props.params} />
      </Suspense>
    </div>
  );
}

async function Isi({ params }: { params: PageProps<"/rapor/[kode]/[pesertaId]">["params"] }) {
  await requireRole("admin", "koordinator", "guru", "kepala");
  const { kode, pesertaId } = await params;

  const peserta = await getPesertaProgramById(pesertaId);
  if (!peserta) notFound();

  const [rapor, skala] = await Promise.all([getRaporSatu(pesertaId), getSkalaPredikatGlobal()]);
  const status: StatusRapor = rapor?.status ?? "draft";

  const data = status === "terkunci" && rapor?.snapshot ? rapor.snapshot : await rakitDataRapor(pesertaId);
  if (!data) return <EmptyState title="Data tidak ditemukan" />;

  let qrDataUrl: string | null = null;
  if (rapor?.kode_verifikasi) {
    const host = (await headers()).get("host") ?? "localhost";
    const proto = host.startsWith("localhost") ? "http" : "https";
    qrDataUrl = await QRCode.toDataURL(`${proto}://${host}/verifikasi/${rapor.kode_verifikasi}`, { margin: 1, width: 160 });
  }

  const catatanTampil = rapor?.diedit_manual ? rapor.catatan_final : (rapor?.catatan_auto ?? data.catatan_auto);
  const catatanTerjemahanTampil = rapor?.diedit_manual ? rapor.catatan_final_terjemahan : (rapor?.catatan_auto_terjemahan ?? data.catatan_auto_terjemahan);

  return (
    <>
      <Button variant="ghost" size="sm" className="w-fit" nativeButton={false} render={<Link href={`/rapor/${kode}`} />}>
        <ArrowLeft /> Semua rapor
      </Button>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <RaporA4
            data={data}
            skala={skala}
            qrDataUrl={qrDataUrl}
            kodeVerifikasi={rapor?.kode_verifikasi ?? null}
            catatanTampil={catatanTampil ?? null}
            catatanTerjemahanTampil={catatanTerjemahanTampil ?? null}
          />
        </div>

        <div className="grid content-start gap-4">
          <div className="rounded-xl border p-4">
            <p className="mb-1 text-sm text-muted-foreground">Status</p>
            <p className="font-semibold">{STATUS_RAPOR_LABEL[status]}</p>
          </div>

          <AksiRapor pesertaProgramId={pesertaId} status={status} />

          {status !== "terkunci" ? (
            <CatatanForm
              pesertaProgramId={pesertaId}
              catatanFinal={rapor?.catatan_final ?? data.catatan_auto}
              catatanFinalTerjemahan={rapor?.catatan_final_terjemahan ?? data.catatan_auto_terjemahan}
              tampilkanTerjemahan={data.program.tampilkan_terjemahan}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}
