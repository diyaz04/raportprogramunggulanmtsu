import { Suspense } from "react";
import type { Metadata } from "next";
import { BookOpenCheck, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPengaturanAman } from "@/lib/data/master";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10 lg:text-white">
        {/* eslint-disable-next-line @next/next/no-img-element -- foto madrasah statis, bukan perlu optimasi next/image */}
        <img src="/login-bg.jpg" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-emerald-800/80 to-emerald-600/70" />

        <div className="relative z-10">
          <Suspense fallback={<div className="h-16" />}>
            <Logos />
          </Suspense>

          <h1 className="mt-6 text-4xl leading-tight font-bold">
            Rapor <span className="text-emerald-300">Program Unggulan</span>
          </h1>
          <Suspense fallback={null}>
            <NamaMadrasah />
          </Suspense>

          <div className="my-5 h-px w-24 bg-white/40" />
          <p className="max-w-sm text-sm text-white/85">
            Transparansi, akurat, dan mudah diakses untuk mendukung prestasi siswa.
          </p>
        </div>

        <p className="relative z-10 text-xs text-white/70">© Rapor Program Unggulan</p>
      </div>

      <div className="flex flex-col items-center justify-center gap-8 px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <BookOpenCheck className="size-6" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">Rapor Program Unggulan</h2>
            <Suspense fallback={<p className="mt-1 text-sm text-muted-foreground">MTsS KH. A. Wahab Muhsin Sukahideng</p>}>
              <NamaMadrasahRingkas />
            </Suspense>
          </div>

          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Masuk</CardTitle>
              <CardDescription>Gunakan akun guru atau admin yang diberikan madrasah.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {/* searchParams adalah data request, jadi dibaca di dalam Suspense */}
              <Suspense fallback={null}>
                <Notices searchParams={props.searchParams} />
              </Suspense>
              <LoginForm disabled={!isSupabaseConfigured} />
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">Lupa kata sandi? Hubungi admin madrasah.</p>
        </div>

        <p className="hidden text-center text-xs italic text-muted-foreground lg:block">
          Bersama membangun generasi berakhlak, berilmu, dan berprestasi
        </p>
      </div>
    </main>
  );
}

async function Logos() {
  const pengaturan = await getPengaturanAman();
  if (!pengaturan?.logo_kiri_url && !pengaturan?.logo_kanan_url) return null;

  return (
    <div className="flex items-center gap-4">
      <LogoBulat src={pengaturan?.logo_kiri_url ?? null} />
      <div className="h-10 w-px bg-white/40" />
      <LogoBulat src={pengaturan?.logo_kanan_url ?? null} />
    </div>
  );
}

function LogoBulat({ src }: { src: string | null }) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL publik Supabase Storage
    <img src={src} alt="Logo" className="size-14 object-contain drop-shadow" />
  );
}

async function NamaMadrasah() {
  const pengaturan = await getPengaturanAman();
  return <p className="mt-1 text-lg text-white/90">{pengaturan?.nama_madrasah ?? "MTsS KH. A. Wahab Muhsin Sukahideng"}</p>;
}

async function NamaMadrasahRingkas() {
  const pengaturan = await getPengaturanAman();
  return <p className="mt-1 text-sm text-muted-foreground">{pengaturan?.nama_madrasah ?? "MTsS KH. A. Wahab Muhsin Sukahideng"}</p>;
}

async function Notices({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { error } = await searchParams;

  const messages: string[] = [];
  if (!isSupabaseConfigured) {
    messages.push(
      "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY di file .env.local, lalu jalankan ulang server.",
    );
  }
  if (error === "nonaktif") {
    messages.push("Akun Anda belum diaktifkan atau tidak terdaftar. Hubungi admin madrasah.");
  }
  if (messages.length === 0) return null;

  return (
    <div
      role="status"
      className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
      <div className="grid gap-1">
        {messages.map((m) => (
          <p key={m}>{m}</p>
        ))}
      </div>
    </div>
  );
}
