import { Suspense } from "react";
import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KopRapor } from "@/components/rapor/kop-rapor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { requireRole } from "@/lib/auth";
import { getPengaturan, getPeriodeList, labelPeriode } from "@/lib/data/master";
import { LogoUploader } from "./logo-uploader";
import { PengaturanForm } from "./pengaturan-form";
import { ResetPeriodeDialog } from "./reset-periode-dialog";
import { ResetSemuaDataDialog } from "./reset-semua-data-dialog";

export const metadata: Metadata = { title: "Pengaturan" };

export default function PengaturanPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <PageHeader
        title="Pengaturan"
        description="Identitas madrasah untuk kop dan tanda tangan rapor. Tanggal rapor diatur per semester di menu Periode."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Isi />
      </Suspense>
    </div>
  );
}

async function Isi() {
  await requireRole("admin");
  const [pengaturan, daftarPeriode] = await Promise.all([getPengaturan(), getPeriodeList()]);

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid content-start gap-6">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>Tampil di kiri dan kanan kop rapor.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <LogoUploader slot="kiri" label="Logo kiri (Kemenag)" currentUrl={pengaturan.logo_kiri_url} />
              <LogoUploader slot="kanan" label="Logo kanan (madrasah)" currentUrl={pengaturan.logo_kanan_url} />
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent>
              <PengaturanForm pengaturan={pengaturan} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Pratinjau kop</CardTitle>
              <CardDescription>Begini tampilan kop di bagian atas rapor. Simpan dulu untuk memperbarui pratinjau.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border bg-white p-4 text-[13px] shadow-sm">
                <KopRapor {...pengaturan} />
                <div className="mt-3 space-y-1.5 opacity-40" aria-hidden>
                  <div className="h-2 w-2/3 rounded bg-gray-300" />
                  <div className="h-2 w-1/2 rounded bg-gray-300" />
                </div>
              </div>
              {pengaturan.kepala_nama ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Kepala madrasah: <b>{pengaturan.kepala_nama}</b>
                  {pengaturan.kepala_nip ? ` · NIP ${pengaturan.kepala_nip}` : ""}
                </p>
              ) : (
                <p className="mt-3 text-xs text-amber-700">Nama kepala madrasah belum diisi.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-destructive/30 shadow-none">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="size-5" /> Zona Berbahaya
          </CardTitle>
          <CardDescription>
            Gunakan fungsi di bawah ini dengan sangat hati-hati untuk membersihkan data uji coba.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 divide-y">
          <div className="grid gap-2">
            <h3 className="text-sm font-semibold text-foreground">Reset Data 1 Periode Tertentu</h3>
            <p className="text-xs text-muted-foreground">
              Hapus nilai, rapor, kehadiran, proyek riset, hafalan tahfidz, dan prestasi hanya pada 1 periode terpilih. Data siswa, kelas, akun, dan program tetap aman.
            </p>
            {daftarPeriode.length > 0 ? (
              <div className="mt-1">
                <ResetPeriodeDialog
                  daftarPeriode={daftarPeriode.map((p) => ({ id: p.id, label: labelPeriode(p) + (p.aktif ? " (aktif)" : "") }))}
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">Belum ada periode.</p>
            )}
          </div>

          <div className="grid gap-2 pt-6">
            <h3 className="text-sm font-semibold text-destructive">Reset Semua Data Siswa & Operasional (Total)</h3>
            <p className="text-xs text-muted-foreground">
              Hapus SEMUA data siswa, kelas rombel, kepesertaan program, nilai, rapor, kehadiran, hafalan tahfidz, dan prestasi di seluruh periode.
              Akun login dan profil guru <b>TIDAK</b> akan ikut terhapus.
            </p>
            <div className="mt-1">
              <ResetSemuaDataDialog />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
