import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { FormDialog } from "@/components/form-dialog";
import { EmptyState } from "@/components/page-header";
import { PeriodeSelect } from "@/components/periode-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { bisaKelolaProgram, getCurrentUser } from "@/lib/auth";
import { getIndikatorDenganTemplate, getSkalaPredikatGlobal, PREDIKAT_KODE, type IndikatorDenganTemplate } from "@/lib/data/indikator";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import { getProgramByKode } from "@/lib/data/program";
import { cn } from "cn";
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
  const searchParamsResolved = await searchParams;
  const periodeParam = Array.isArray(searchParamsResolved.periode)
    ? searchParamsResolved.periode[0]
    : searchParamsResolved.periode;
  const tingkatParam = Array.isArray(searchParamsResolved.tingkat)
    ? searchParamsResolved.tingkat[0]
    : searchParamsResolved.tingkat;

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

  const [semuaIndikator, skala, bolehKelola] = await Promise.all([
    getIndikatorDenganTemplate(program.id, dipilih.id),
    getSkalaPredikatGlobal(),
    bisaKelolaProgram(user, program.id, dipilih.id),
  ]);

  const countSemua = semuaIndikator.length;
  const count7 = semuaIndikator.filter((i) => i.tingkat === 7).length;
  const count8 = semuaIndikator.filter((i) => i.tingkat === 8).length;
  const count9 = semuaIndikator.filter((i) => i.tingkat === 9).length;
  const countUmum = semuaIndikator.filter((i) => i.tingkat === null).length;

  let indikator: IndikatorDenganTemplate[];
  if (tingkatParam === "7") {
    indikator = semuaIndikator.filter((i) => i.tingkat === 7);
  } else if (tingkatParam === "8") {
    indikator = semuaIndikator.filter((i) => i.tingkat === 8);
  } else if (tingkatParam === "9") {
    indikator = semuaIndikator.filter((i) => i.tingkat === 9);
  } else if (tingkatParam === "umum") {
    indikator = semuaIndikator.filter((i) => i.tingkat === null);
  } else {
    indikator = [...semuaIndikator].sort((a, b) => {
      const ta = a.tingkat ?? 0;
      const tb = b.tingkat ?? 0;
      if (ta !== tb) return ta - tb;
      return a.urutan - b.urutan;
    });
  }

  const tabs = [
    { label: "Semua Tingkat", value: "", count: countSemua },
    { label: "Kelas VII", value: "7", count: count7 },
    { label: "Kelas VIII", value: "8", count: count8 },
    { label: "Kelas IX", value: "9", count: count9 },
    { label: "Lintas Kelas (Umum)", value: "umum", count: countUmum },
  ];

  return (
    <div className="grid gap-4">
      <PeriodeSelect
        current={dipilih.id}
        options={daftarPeriode.map((p) => ({ id: p.id, label: labelPeriode(p) + (p.aktif ? " (aktif)" : "") }))}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Kalimat capaian kompetensi per indikator (A–D) + saran tindak lanjut. Dapat dikonfigurasi per tingkatan kelas
          sesuai indikator masing-masing.
          {program.tampilkan_terjemahan ? " Terjemahan Indonesia dicetak miring di bawah kalimat utama." : ""}
        </p>
        {!bolehKelola && user.role === "guru" ? (
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800">
            Hanya Baca (Belum Ditugaskan)
          </Badge>
        ) : null}
      </div>

      {/* Filter Tab Tingkatan Kelas */}
      <div className="flex flex-wrap gap-1.5 border-b pb-2">
        {tabs.map((tab) => {
          const isActive = (tingkatParam ?? "") === tab.value;
          const href = tab.value
            ? `/program/${kode}/template?periode=${dipilih.id}&tingkat=${tab.value}`
            : `/program/${kode}/template?periode=${dipilih.id}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px]",
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-background text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {indikator.length === 0 ? (
        <EmptyState
          title={
            tingkatParam
              ? `Belum ada indikator untuk ${tabs.find((t) => t.value === tingkatParam)?.label ?? "tingkat ini"}`
              : "Belum ada indikator"
          }
          description="Tambahkan indikator dulu di menu Indikator sebelum mengisi template deskripsinya."
        />
      ) : (
        <div className="grid gap-2">
          {indikator.map((ind) => {
            const terisi = PREDIKAT_KODE.filter((k) => k !== "SARAN" && ind.template[k]?.teks).length;
            return (
              <div key={ind.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <div className="grid gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ind.nama}</span>
                    {ind.tingkat === 7 ? (
                      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[10px] text-blue-700">
                        Kelas VII
                      </Badge>
                    ) : ind.tingkat === 8 ? (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">
                        Kelas VIII
                      </Badge>
                    ) : ind.tingkat === 9 ? (
                      <Badge variant="outline" className="border-purple-200 bg-purple-50 text-[10px] text-purple-700">
                        Kelas IX
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Semua
                      </Badge>
                    )}
                  </div>
                  {ind.nama_terjemahan ? <span className="text-xs text-muted-foreground">{ind.nama_terjemahan}</span> : null}
                  {ind.nama_arab ? (
                    <span className="text-xs text-muted-foreground" dir="rtl">
                      {ind.nama_arab}
                    </span>
                  ) : null}
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
                      title={`Template deskripsi — ${ind.nama}${ind.tingkat ? ` (Kelas ${ind.tingkat})` : ""}`}
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
