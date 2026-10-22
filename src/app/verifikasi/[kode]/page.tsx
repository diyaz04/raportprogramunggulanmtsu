import { Suspense } from "react";
import type { Metadata } from "next";
import { BadgeCheck, ShieldX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTanggal } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Verifikasi Rapor" };

export default function VerifikasiPage(props: PageProps<"/verifikasi/[kode]">) {
  return (
    <div className="mx-auto grid min-h-screen max-w-md content-center gap-4 p-6">
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <Isi params={props.params} />
      </Suspense>
    </div>
  );
}

type HasilVerifikasi = {
  nama_siswa: string;
  nama_program: string;
  tahun_ajaran: string;
  semester: "ganjil" | "genap";
  nilai_akhir: number | null;
  predikat: string | null;
  diterbitkan_at: string | null;
};

async function Isi({ params }: { params: PageProps<"/verifikasi/[kode]">["params"] }) {
  const { kode } = await params;
  const supabase = await createClient();
  const { data, error } = (await supabase.rpc("verifikasi_rapor", { p_kode: kode }).maybeSingle()) as unknown as {
    data: HasilVerifikasi | null;
    error: { message: string } | null;
  };

  if (error || !data) {
    return (
      <div className="grid justify-items-center gap-3 rounded-xl border border-dashed p-8 text-center">
        <ShieldX className="size-10 text-destructive" />
        <p className="font-semibold">Kode verifikasi tidak ditemukan</p>
        <p className="text-sm text-muted-foreground">
          Rapor dengan kode <span className="font-mono">{kode}</span> tidak ada, atau belum diterbitkan secara resmi.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-xl border p-6">
      <div className="flex items-center gap-2 text-emerald-700">
        <BadgeCheck className="size-6" />
        <p className="font-semibold">Rapor ini asli dan terdaftar</p>
      </div>
      <dl className="grid gap-2 text-sm">
        <Baris label="Nama Siswa" value={data.nama_siswa} />
        <Baris label="Program" value={data.nama_program} />
        <Baris label="Tahun Ajaran" value={`${data.tahun_ajaran} · ${data.semester === "ganjil" ? "Ganjil" : "Genap"}`} />
        <Baris label="Nilai Akhir" value={`${data.nilai_akhir ?? "—"} (${data.predikat ?? "—"})`} />
        <Baris label="Diterbitkan" value={formatTanggal(data.diterbitkan_at?.slice(0, 10))} />
      </dl>
    </div>
  );
}

function Baris({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
