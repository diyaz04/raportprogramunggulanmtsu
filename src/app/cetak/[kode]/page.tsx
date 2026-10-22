import { Suspense } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { RaporA4 } from "@/components/rapor/rapor-a4";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth";
import { getSkalaPredikatGlobal } from "@/lib/data/indikator";
import { getPeriodeList } from "@/lib/data/master";
import { getPesertaProgram, getProgramByKode } from "@/lib/data/program";
import { getRaporSatu, rakitDataRapor } from "@/lib/data/rapor";
import { TombolCetak } from "../tombol-cetak";

export default function CetakMassalPage(props: PageProps<"/cetak/[kode]">) {
  return (
    <div className="min-h-screen bg-zinc-200 py-6 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-2">
        <p className="text-sm text-zinc-600">Pratinjau cetak. Rapor yang belum terkunci ditandai DRAF.</p>
        <TombolCetak />
      </div>
      <Suspense fallback={<Skeleton className="mx-auto h-[297mm] w-[210mm]" />}>
        <Isi params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Isi({
  params,
  searchParams,
}: {
  params: PageProps<"/cetak/[kode]">["params"];
  searchParams: PageProps<"/cetak/[kode]">["searchParams"];
}) {
  await requireRole("admin", "koordinator", "guru", "kepala");
  const { kode } = await params;
  const { periode: periodeParam, kelas: kelasParam } = await searchParams;

  const program = await getProgramByKode(kode);
  if (!program) notFound();

  const daftarPeriode = await getPeriodeList();
  const dipilih =
    daftarPeriode.find((p) => p.id === (Array.isArray(periodeParam) ? periodeParam[0] : periodeParam)) ??
    daftarPeriode.find((p) => p.aktif) ??
    daftarPeriode[0];
  if (!dipilih) notFound();

  let peserta = await getPesertaProgram(program.id, dipilih.id);
  const kelasFilter = Array.isArray(kelasParam) ? kelasParam[0] : kelasParam;
  if (kelasFilter) peserta = peserta.filter((p) => p.kelas_nama === kelasFilter);

  const skala = await getSkalaPredikatGlobal();
  const host = (await headers()).get("host") ?? "localhost";
  const proto = host.startsWith("localhost") ? "http" : "https";

  const halaman = await Promise.all(
    peserta.map(async (p) => {
      const rapor = await getRaporSatu(p.id);
      const data = rapor?.status === "terkunci" && rapor.snapshot ? rapor.snapshot : await rakitDataRapor(p.id);
      if (!data) return null;
      const qrDataUrl = rapor?.kode_verifikasi
        ? await QRCode.toDataURL(`${proto}://${host}/verifikasi/${rapor.kode_verifikasi}`, { margin: 1, width: 160 })
        : null;
      const terkunci = rapor?.status === "terkunci";
      const catatanTampil = rapor?.diedit_manual ? rapor.catatan_final : (rapor?.catatan_auto ?? data.catatan_auto);
      const catatanTerjemahanTampil = rapor?.diedit_manual
        ? rapor.catatan_final_terjemahan
        : (rapor?.catatan_auto_terjemahan ?? data.catatan_auto_terjemahan);
      return { id: p.id, data, qrDataUrl, kodeVerifikasi: rapor?.kode_verifikasi ?? null, terkunci, catatanTampil, catatanTerjemahanTampil };
    }),
  );

  return (
    <div className="grid gap-4 print:gap-0">
      {halaman.filter((h) => h !== null).map((h) => (
        <section key={h.id} data-halaman-rapor className="relative mx-auto w-[210mm] shadow-md print:shadow-none">
          {!h.terkunci ? (
            <p className="no-print absolute top-2 right-2 z-20 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              DRAF — belum dikunci
            </p>
          ) : null}
          <RaporA4
            data={h.data}
            skala={skala}
            qrDataUrl={h.qrDataUrl}
            kodeVerifikasi={h.kodeVerifikasi}
            catatanTampil={h.catatanTampil ?? null}
            catatanTerjemahanTampil={h.catatanTerjemahanTampil ?? null}
          />
        </section>
      ))}
    </div>
  );
}
