import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ResetZoom } from "@/components/reset-zoom";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ROLE_LABEL, getCurrentUser } from "@/lib/auth";
import { getPengaturanAman, getPeriodeAktif, labelPeriode } from "@/lib/data/master";
import { getProgramByKode, getProgramIdUntukGuru } from "@/lib/data/program";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ResetZoom />
      {/* Sesi dibaca di dalam Suspense: kerangka halaman tetap tampil instan */}
      <Suspense fallback={<SidebarPlaceholder />}>
        <SidebarWithUser />
      </Suspense>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <span className="hidden text-sm text-muted-foreground sm:inline">MTsS KH. A. Wahab Muhsin Sukahideng</span>
          <div className="ml-auto">
            <Suspense fallback={<Skeleton className="h-6 w-36" />}>
              <PeriodeAktifBadge />
            </Suspense>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

async function SidebarWithUser() {
  const user = await getCurrentUser();
  const [bisaTahfidz, pengaturan] = await Promise.all([
    user.role === "guru" ? guruDitugaskanTahfidz(user.id) : Promise.resolve(false),
    getPengaturanAman(),
  ]);
  return (
    <AppSidebar
      user={{
        nama: user.nama,
        email: user.email,
        role: user.role,
        roleLabel: ROLE_LABEL[user.role],
        bisaTahfidz,
      }}
      logoKiriUrl={pengaturan?.logo_kiri_url ?? null}
      logoKananUrl={pengaturan?.logo_kanan_url ?? null}
      namaMadrasah={pengaturan?.nama_madrasah ?? "MTs KH. A. Wahab Muhsin"}
    />
  );
}

/** Menu "Hafalan Tahfidz" cuma tampil untuk guru kalau dia ditugaskan ke program Tahfidz di periode aktif. */
async function guruDitugaskanTahfidz(guruId: string): Promise<boolean> {
  const [periodeAktif, programTahfidz] = await Promise.all([getPeriodeAktif(), getProgramByKode("THF")]);
  if (!periodeAktif || !programTahfidz) return false;

  const programIdGuru = await getProgramIdUntukGuru(guruId, periodeAktif.id);
  return programIdGuru.includes(programTahfidz.id);
}

async function PeriodeAktifBadge() {
  const periode = await getPeriodeAktif();
  return periode ? (
    <Badge variant="outline" className="font-normal">
      Periode aktif: <span className="ml-1 font-medium">{labelPeriode(periode)}</span>
    </Badge>
  ) : (
    <Badge variant="outline" className="border-amber-300 bg-amber-50 font-normal text-amber-800">
      Belum ada periode aktif
    </Badge>
  );
}

function SidebarPlaceholder() {
  return <div className="hidden w-(--sidebar-width) shrink-0 border-r md:block" aria-hidden />;
}
