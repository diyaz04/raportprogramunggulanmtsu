import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { FormDialog } from "@/components/form-dialog";
import { EmptyState } from "@/components/page-header";
import { PeriodeSelect } from "@/components/periode-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bisaKelolaProgram, getCurrentUser } from "@/lib/auth";
import { getIndikatorProgram, getPeriodeSumberIndikator, type Indikator } from "@/lib/data/indikator";
import { INDIKATOR_DEFAULT } from "@/lib/data/indikator-default";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import { getProgramByKode } from "@/lib/data/program";
import { cn } from "cn";
import { hapusIndikator, isiIndikatorBawaan, salinIndikatorDariPeriode, simpanIndikator } from "../indikator-actions";
import { AktifToggle } from "./aktif-toggle";
import { IndikatorFields } from "./indikator-fields";
import { ReorderButtons } from "./reorder-buttons";

export default function IndikatorProgramPage(props: PageProps<"/program/[kode]/indikator">) {
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
  params: PageProps<"/program/[kode]/indikator">["params"];
  searchParams: PageProps<"/program/[kode]/indikator">["searchParams"];
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

  const semuaIndikator = await getIndikatorProgram(program.id, dipilih.id);
  const periodeSumber = semuaIndikator.length === 0 ? await getPeriodeSumberIndikator(program.id, dipilih.id) : null;
  const adaBawaan = INDIKATOR_DEFAULT[program.kode] !== undefined;

  const bolehKelola = await bisaKelolaProgram(user, program.id, dipilih.id);

  // Filter per tingkatan kelas
  const countSemua = semuaIndikator.length;
  const count7 = semuaIndikator.filter((i) => i.tingkat === 7).length;
  const count8 = semuaIndikator.filter((i) => i.tingkat === 8).length;
  const count9 = semuaIndikator.filter((i) => i.tingkat === 9).length;
  const countUmum = semuaIndikator.filter((i) => i.tingkat === null).length;

  let indikator: Indikator[];
  if (tingkatParam === "7") {
    indikator = semuaIndikator.filter((i) => i.tingkat === 7);
  } else if (tingkatParam === "8") {
    indikator = semuaIndikator.filter((i) => i.tingkat === 8);
  } else if (tingkatParam === "9") {
    indikator = semuaIndikator.filter((i) => i.tingkat === 9);
  } else if (tingkatParam === "umum") {
    indikator = semuaIndikator.filter((i) => i.tingkat === null);
  } else {
    // Tampilkan semua (urutkan berdasarkan tingkat lalu urutan)
    indikator = [...semuaIndikator].sort((a, b) => {
      const ta = a.tingkat ?? 0;
      const tb = b.tingkat ?? 0;
      if (ta !== tb) return ta - tb;
      return a.urutan - b.urutan;
    });
  }

  const activeTingkatNumeric = tingkatParam === "7" ? 7 : tingkatParam === "8" ? 8 : tingkatParam === "9" ? 9 : null;

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
          Indikator dapat dikonfigurasikan per tingkatan kelas (Kelas 7, 8, 9) atau lintas kelas (umum). Guru yang
          ditugaskan dapat menambah, mengubah, atau menghapus indikator program ini.
        </p>
        {bolehKelola ? (
          <div className="flex flex-wrap gap-2">
            {semuaIndikator.length === 0 && periodeSumber ? (
              <FormDialog
                trigger={
                  <Button size="sm" variant="outline">
                    Salin dari periode lalu
                  </Button>
                }
                title="Salin indikator dari periode lalu?"
                description="Indikator beserta tingkatan kelas dan template deskripsinya akan disalin ke periode ini."
                submitLabel="Salin"
                action={salinIndikatorDariPeriode.bind(null, program.id, dipilih.id, periodeSumber.id)}
              />
            ) : null}
            {semuaIndikator.length === 0 && adaBawaan ? (
              <FormDialog
                trigger={
                  <Button size="sm" variant="outline">
                    <Sparkles /> Isi indikator bawaan
                  </Button>
                }
                title="Isi indikator bawaan?"
                description="Memakai daftar indikator hasil riset default untuk program ini. Bisa disesuaikan per tingkatan kelas setelahnya."
                submitLabel="Isi"
                action={isiIndikatorBawaan.bind(null, program.id, dipilih.id)}
              />
            ) : null}
            <FormDialog
              trigger={
                <Button size="sm">
                  <Plus /> Tambah indikator
                </Button>
              }
              title={`Tambah indikator${activeTingkatNumeric ? ` (Tingkat ${activeTingkatNumeric})` : ""}`}
              action={simpanIndikator.bind(null, program.id, dipilih.id, null)}
            >
              <IndikatorFields bahasaUtama={program.bahasa_utama} defaultTingkat={activeTingkatNumeric} />
            </FormDialog>
          </div>
        ) : user.role === "guru" ? (
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
            ? `/program/${kode}/indikator?periode=${dipilih.id}&tingkat=${tab.value}`
            : `/program/${kode}/indikator?periode=${dipilih.id}`;
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
          description="Tambahkan indikator baru dengan tombol di atas, atau ganti pilihan tingkatan kelas."
        />
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Urutan</TableHead>
                <TableHead className="w-28">Tingkat</TableHead>
                <TableHead>Indikator</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="w-16">Bobot</TableHead>
                <TableHead className="w-20">Aktif</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {indikator.map((ind, i) => (
                <TableRow key={ind.id}>
                  <TableCell>
                    {bolehKelola ? (
                      <ReorderButtons
                        programId={program.id}
                        periodeId={dipilih.id}
                        id={ind.id}
                        isFirst={i === 0}
                        isLast={i === indikator.length - 1}
                      />
                    ) : (
                      ind.urutan
                    )}
                  </TableCell>
                  <TableCell>
                    {ind.tingkat === 7 ? (
                      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                        Kelas VII
                      </Badge>
                    ) : ind.tingkat === 8 ? (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                        Kelas VIII
                      </Badge>
                    ) : ind.tingkat === 9 ? (
                      <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700">
                        Kelas IX
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Semua
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {ind.nama}
                    {ind.nama_terjemahan ? (
                      <span className="block text-xs text-muted-foreground">{ind.nama_terjemahan}</span>
                    ) : null}
                    {ind.nama_arab ? (
                      <span className="block text-xs text-muted-foreground" dir="rtl">
                        {ind.nama_arab}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-xs text-sm text-muted-foreground">{ind.keterangan ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ind.bobot}</Badge>
                  </TableCell>
                  <TableCell>
                    {bolehKelola ? (
                      <AktifToggle programId={program.id} periodeId={dipilih.id} id={ind.id} aktif={ind.aktif} />
                    ) : (
                      <Badge variant={ind.aktif ? "outline" : "secondary"}>{ind.aktif ? "Aktif" : "Nonaktif"}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {bolehKelola ? (
                      <div className="flex justify-end gap-1">
                        <FormDialog
                          trigger={
                            <Button variant="ghost" size="icon-sm" aria-label={`Ubah ${ind.nama}`}>
                              <Pencil />
                            </Button>
                          }
                          title="Ubah indikator"
                          action={simpanIndikator.bind(null, program.id, dipilih.id, ind.id)}
                        >
                          <IndikatorFields bahasaUtama={program.bahasa_utama} indikator={ind} />
                        </FormDialog>
                        <FormDialog
                          trigger={
                            <Button variant="ghost" size="icon-sm" aria-label={`Hapus ${ind.nama}`}>
                              <Trash2 />
                            </Button>
                          }
                          title={`Hapus indikator ${ind.nama}?`}
                          description="Template deskripsinya ikut terhapus. Rapor yang sudah dikunci tidak berubah."
                          submitLabel="Hapus"
                          destructive
                          action={hapusIndikator.bind(null, program.id, dipilih.id, ind.id)}
                        />
                      </div>
                    ) : null}
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
