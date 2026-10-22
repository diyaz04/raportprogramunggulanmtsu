import { Suspense } from "react";
import type { Metadata } from "next";
import { Building2, Calendar, GraduationCap, LayoutGrid, TrendingUp, Users } from "lucide-react";
import { EmptyState } from "@/components/page-header";
import { PeriodeSelect } from "@/components/periode-select";
import { Skeleton } from "@/components/ui/skeleton";
import { AktivitasTerbaru } from "@/components/dashboard/aktivitas-terbaru";
import { HeroBanner } from "@/components/dashboard/hero-banner";
import { InfoSistemCard, type InfoBaris } from "@/components/dashboard/info-sistem-card";
import { ProgramProgressCard } from "@/components/dashboard/program-progress-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatistikChart, type StatistikBar } from "@/components/dashboard/statistik-chart";
import { getCurrentUser } from "@/lib/auth";
import { getAktivitasTerbaru, getStatistikSekolah, getTuntasPerProgram } from "@/lib/data/dashboard";
import { getPengaturan, getPeriodeList, labelPeriode } from "@/lib/data/master";
import { getProgramIdUntukGuru, getProgramList } from "@/lib/data/program";
import { getProgresProgram } from "@/lib/data/rapor";
import type { WarnaProgram } from "@/lib/program-visual";

export const metadata: Metadata = { title: "Dashboard" };

const MOTTO = "Bersama membangun generasi berakhlak, berilmu, dan berprestasi";

const WARNA_SISWA: WarnaProgram = { bg: "bg-emerald-100", text: "text-emerald-700", ring: "bg-emerald-600" };
const WARNA_GURU: WarnaProgram = { bg: "bg-sky-100", text: "text-sky-700", ring: "bg-sky-600" };
const WARNA_PROGRAM_AKTIF: WarnaProgram = { bg: "bg-amber-100", text: "text-amber-700", ring: "bg-amber-600" };
const WARNA_KELAS: WarnaProgram = { bg: "bg-violet-100", text: "text-violet-700", ring: "bg-violet-600" };

export default function DashboardPage(props: PageProps<"/dashboard">) {
  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <Suspense fallback={<Skeleton className="h-48 w-full rounded-2xl" />}>
        <Hero />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <Konten searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Hero() {
  const user = await getCurrentUser();
  const pengaturan = await ambilPengaturanAman();
  return <HeroBanner nama={user.nama} namaMadrasah={pengaturan?.nama_madrasah ?? "MTsS KH. A. Wahab Muhsin Sukahideng"} motto={MOTTO} />;
}

async function ambilPengaturanAman() {
  try {
    return await getPengaturan();
  } catch {
    return null;
  }
}

async function Konten({ searchParams }: { searchParams: PageProps<"/dashboard">["searchParams"] }) {
  const user = await getCurrentUser();
  const { periode: periodeParam } = await searchParams;
  const daftarPeriode = await getPeriodeList();

  if (daftarPeriode.length === 0) {
    return <EmptyState title="Belum ada periode" description="Buat dan aktifkan periode di Master Data → Periode." />;
  }

  const dipilih =
    daftarPeriode.find((p) => p.id === (Array.isArray(periodeParam) ? periodeParam[0] : periodeParam)) ??
    daftarPeriode.find((p) => p.aktif) ??
    daftarPeriode[0];

  const programSemua = await getProgramList(dipilih.id);
  const izinGuru = user.role === "guru" ? new Set(await getProgramIdUntukGuru(user.id, dipilih.id)) : null;
  const program = izinGuru ? programSemua.filter((p) => izinGuru.has(p.id)) : programSemua;
  const progres = await Promise.all(program.map((p) => getProgresProgram(p.id, dipilih.id)));

  const periodeSelect = (
    <PeriodeSelect
      current={dipilih.id}
      options={daftarPeriode.map((p) => ({ id: p.id, label: labelPeriode(p) + (p.aktif ? " (aktif)" : "") }))}
    />
  );

  if (user.role === "guru") {
    const totalPeserta = progres.reduce((n, p) => n + p.jumlahPeserta, 0);
    const totalTerisi = progres.reduce((n, p) => n + p.nilaiTerisi, 0);
    const totalNilai = progres.reduce((n, p) => n + p.nilaiTotal, 0);
    const rataProgres = totalNilai > 0 ? Math.round((totalTerisi / totalNilai) * 100) : 0;

    return (
      <div className="grid gap-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard icon={LayoutGrid} label="Program Diampu" value={program.length} warna={WARNA_PROGRAM_AKTIF} />
          <StatCard icon={Users} label="Total Peserta Bimbingan" value={totalPeserta} warna={WARNA_SISWA} />
          <StatCard icon={TrendingUp} label="Rata-rata Progres Nilai" value={`${rataProgres}%`} warna={WARNA_GURU} />
        </div>

        <div className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold">Program Saya</h2>
            {periodeSelect}
          </div>
          {program.length === 0 ? (
            <EmptyState title="Belum ada program untuk Anda" description="Anda belum ditugaskan ke program apa pun pada periode ini." />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {program.map((p, i) => (
                <ProgramProgressCard
                  key={p.id}
                  kode={p.kode}
                  nama={p.nama}
                  jumlahPeserta={progres[i].jumlahPeserta}
                  nilaiTerisi={progres[i].nilaiTerisi}
                  nilaiTotal={progres[i].nilaiTotal}
                  href={`/nilai/${p.kode}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const [statistik, tuntasPerProgram, aktivitas] = await Promise.all([
    getStatistikSekolah(dipilih.id),
    getTuntasPerProgram(program.map((p) => p.id), dipilih.id),
    getAktivitasTerbaru(),
  ]);

  const tuntasById = new Map(tuntasPerProgram.map((t) => [t.programId, t]));
  const statistikBar: StatistikBar[] = program.map((p) => {
    const t = tuntasById.get(p.id) ?? { tuntas: 0, belumTuntas: 0 };
    const total = t.tuntas + t.belumTuntas;
    return { label: p.kode, persenTuntas: total > 0 ? Math.round((t.tuntas / total) * 100) : 0, tuntas: t.tuntas, belumTuntas: t.belumTuntas };
  });

  const totalPesertaProgram = progres.reduce((n, p) => n + p.jumlahPeserta, 0);
  const infoBaris: InfoBaris[] = [
    { icon: Calendar, label: "Periode Aktif", value: labelPeriode(dipilih) },
    { icon: LayoutGrid, label: "Program Aktif", value: `${statistik.jumlahProgramAktif} program` },
    { icon: Users, label: "Total Peserta Program", value: `${totalPesertaProgram} peserta` },
  ];

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Siswa" value={statistik.totalSiswa} warna={WARNA_SISWA} href="/master/siswa" />
        <StatCard icon={GraduationCap} label="Total Guru" value={statistik.totalGuru} warna={WARNA_GURU} href="/master/guru" />
        <StatCard icon={LayoutGrid} label="Program Aktif" value={statistik.jumlahProgramAktif} warna={WARNA_PROGRAM_AKTIF} href="/program" />
        <StatCard icon={Building2} label="Total Kelas" value={statistik.totalKelas} warna={WARNA_KELAS} href="/master/kelas" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold">Progres Program Unggulan</h2>
            {periodeSelect}
          </div>
          {program.length === 0 ? (
            <EmptyState title="Belum ada program" description="Tambahkan program di Master Data → Program." />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {program.map((p, i) => (
                <ProgramProgressCard
                  key={p.id}
                  kode={p.kode}
                  nama={p.nama}
                  jumlahPeserta={progres[i].jumlahPeserta}
                  nilaiTerisi={progres[i].nilaiTerisi}
                  nilaiTotal={progres[i].nilaiTotal}
                  href={`/rapor/${p.kode}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <InfoSistemCard judul="Informasi Sistem" baris={infoBaris} />
          <div className="rounded-xl border p-4">
            <p className="mb-3 font-semibold">Statistik Perkembangan</p>
            <StatistikChart data={statistikBar} />
          </div>
          <div className="rounded-xl border p-4">
            <p className="mb-3 font-semibold">Aktivitas Terbaru</p>
            <AktivitasTerbaru data={aktivitas} />
          </div>
        </div>
      </div>
    </div>
  );
}
