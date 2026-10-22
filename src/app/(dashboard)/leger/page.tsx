import { Suspense } from "react";
import type { Metadata } from "next";
import { Download } from "lucide-react";
import { Field } from "@/components/form-dialog";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth";
import { getPeriodeList, labelPeriode } from "@/lib/data/master";
import { getProgramList } from "@/lib/data/program";

export const metadata: Metadata = { title: "Leger Excel" };

export default function LegerPage() {
  return (
    <div className="mx-auto grid max-w-xl gap-6">
      <PageHeader title="Leger Excel" description="Unduh rekap nilai semua program unggulan dalam satu file Excel." />
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Isi />
      </Suspense>
    </div>
  );
}

async function Isi() {
  await requireRole("admin", "koordinator");
  const daftarPeriode = await getPeriodeList();

  if (daftarPeriode.length === 0) {
    return <EmptyState title="Belum ada periode" description="Buat dan aktifkan periode di Master Data → Periode." />;
  }

  const periodeAktif = daftarPeriode.find((p) => p.aktif) ?? daftarPeriode[0];
  const programSemua = await getProgramList(periodeAktif.id);

  return (
    <form action="/api/leger" method="get" className="grid gap-4 rounded-xl border p-5">
      <Field label="Periode" htmlFor="periode">
        <NativeSelect id="periode" name="periode" className="w-full" defaultValue={periodeAktif.id} required>
          {daftarPeriode.map((p) => (
            <NativeSelectOption key={p.id} value={p.id}>
              {labelPeriode(p)}
              {p.aktif ? " (aktif)" : ""}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field label="Cakupan" htmlFor="program" hint="Rekap keseluruhan selalu disertakan; ini mengatur sheet detail per program.">
        <NativeSelect id="program" name="program" className="w-full" defaultValue="semua">
          <NativeSelectOption value="semua">Semua program</NativeSelectOption>
          {programSemua.map((p) => (
            <NativeSelectOption key={p.id} value={p.kode}>
              {p.nama}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Button type="submit" className="w-fit">
        <Download /> Unduh Leger
      </Button>
    </form>
  );
}
