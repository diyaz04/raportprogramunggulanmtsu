import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { FormDialog } from "@/components/form-dialog";
import { EmptyState } from "@/components/page-header";
import { PeriodeSelect } from "@/components/periode-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { bisaKelolaProgram, getCurrentUser } from "@/lib/auth";
import { getIndikatorDenganTemplate, getSkalaPredikatGlobal, PREDIKAT_KODE } from "@/lib/data/indikator";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import { getProgramByKode } from "@/lib/data/program";
import { simpanTemplateDeskripsi } from "../indikator-actions";
import { PreviewPanel } from "./preview-panel";
import { TemplateFields } from "./template-fields";

export default function TemplateProgramPage(props: PageProps<"/program/[kode]/template">) {
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
  params: PageProps<"/program/[kode]/template">["params"];
  searchParams: PageProps<"/program/[kode]/template">["searchParams"];
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

  const [indikator, skala, bolehKelola] = await Promise.all([
    getIndikatorDenganTemplate(program.id, dipilih.id),
    getSkalaPredikatGlobal(),
    bisaKelolaProgram(user, program.id, dipilih.id),
  ]);

  return (
    <div className="grid gap-4">
      <PeriodeSelect
        current={dipilih.id}
        options={daftarPeriode.map((p) => ({ id: p.id, label: labelPeriode(p) + (p.aktif ? " (aktif)" : "") }))}
      />

      <p className="text-sm text-muted-foreground">
        Kalimat capaian kompetensi per indikator, satu per predikat (A–D) + saran tindak lanjut.
        {program.tampilkan_terjemahan ? " Terjemahan Indonesia dicetak miring di bawah kalimat utama." : ""}
      </p>

      {indikator.length === 0 ? (
        <EmptyState
          title="Belum ada indikator"
          description="Tambahkan indikator dulu di menu Indikator sebelum mengisi template deskripsinya."
        />
      ) : (
        <div className="grid gap-2">
          {indikator.map((ind) => {
            const terisi = PREDIKAT_KODE.filter((k) => k !== "SARAN" && ind.template[k]?.teks).length;
            return (
              <div key={ind.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <div className="grid gap-0.5">
                  <span className="font-medium">{ind.nama}</span>
                  {ind.nama_terjemahan ? <span className="text-xs text-muted-foreground">{ind.nama_terjemahan}</span> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={terisi === 4 ? "outline" : "secondary"}>{terisi}/4 terisi</Badge>
                  {bolehKelola ? (
                    <FormDialog
                      trigger={
                        <Button variant="outline" size="sm">
                          <Pencil /> Edit Template
                        </Button>
                      }
                      title={`Template deskripsi — ${ind.nama}`}
                      description={ind.keterangan ?? undefined}
                      wide
                      action={simpanTemplateDeskripsi.bind(null, program.id, dipilih.id, ind.id)}
                    >
                      <TemplateFields
                        indikator={ind}
                        bahasaUtama={program.bahasa_utama}
                        tampilkanTerjemahan={program.tampilkan_terjemahan}
                        skala={skala}
                      />
                    </FormDialog>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {indikator.length > 0 ? (
        <PreviewPanel
          indikator={indikator}
          bahasaUtama={program.bahasa_utama}
          tampilkanTerjemahan={program.tampilkan_terjemahan}
        />
      ) : null}
    </div>
  );
}
