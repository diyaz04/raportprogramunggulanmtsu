import { Suspense } from "react";
import type { Metadata } from "next";
import { BookOpenCheck, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPengaturanAman } from "@/lib/data/master";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

const NAMA_FALLBACK = "MTsS KH. A. Wahab Muhsin Sukahideng";

/** SATU fetch pengaturan dipakai bareng ke semua bagian branding (banner desktop, banner
 * mobile, judul kecil di atas form) — sengaja BUKAN beberapa Suspense boundary terpisah yang
 * masing-masing manggil createClient()/connection() sendiri-sendiri (pola lama). Begitu halaman
 * ini punya 2 salinan banner (desktop+mobile), beberapa Suspense boundary dinamis yang jalan
 * PARALEL di render yang sama ternyata bikin Next 16 Cache Components gagal nyelesaiin sebagian
 * boundary-nya ("could not finish this Suspense boundary"). Datanya kecil & jarang berubah,
 * jadi 1 fetch di awal, dipakai sebagai variabel biasa, jauh lebih aman.
 */
export default async function LoginPage(props: PageProps<"/login">) {
  const pengaturan = await getPengaturanAman();
  const nama = pengaturan?.nama_madrasah ?? NAMA_FALLBACK;
  const logos = pengaturan?.logo_kiri_url || pengaturan?.logo_kanan_url ? (
    <div className="flex items-center gap-4">
      <LogoBulat src={pengaturan?.logo_kiri_url ?? null} />
      <div className="h-10 w-px bg-white/40" />
      <LogoBulat src={pengaturan?.logo_kanan_url ?? null} />
    </div>
  ) : null;

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      {/* Desktop: panel kiri penuh */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10 lg:text-white">
        {/* eslint-disable-next-line @next/next/no-img-element -- foto madrasah statis, bukan perlu optimasi next/image */}
        <img src="/login-bg.jpg" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-emerald-800/80 to-emerald-600/70" />

        <div className="relative z-10">
          {logos}
          <h1 className="mt-6 text-4xl leading-tight font-bold">
            Rapor <span className="text-emerald-300">Program Unggulan</span>
          </h1>
          <p className="mt-1 text-lg text-white/90">{nama}</p>

          <div className="my-5 h-px w-24 bg-white/40" />
          <p className="max-w-sm text-sm text-white/85">
            Transparansi, akurat, dan mudah diakses untuk mendukung prestasi siswa.
          </p>
        </div>

        <p className="relative z-10 text-xs text-white/70">© Rapor Program Unggulan</p>
      </div>

      {/* Mobile: banner ringkas ditumpuk di atas form */}
      <div className="relative flex h-52 flex-col items-center justify-center gap-3 overflow-hidden px-6 text-center text-white lg:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- foto madrasah statis, bukan perlu optimasi next/image */}
        <img src="/login-bg.jpg" alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-emerald-800/80 to-emerald-600/70" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          {logos}
          <div>
            <h1 className="text-2xl leading-tight font-bold">
              Rapor <span className="text-emerald-300">Program Unggulan</span>
            </h1>
            <p className="mt-1 text-sm text-white/90">{nama}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-8 px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 hidden flex-col items-center text-center lg:flex">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <BookOpenCheck className="size-6" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">Rapor Program Unggulan</h2>
            <p className="mt-1 text-sm text-muted-foreground">{nama}</p>
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

function LogoBulat({ src }: { src: string | null }) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- URL publik Supabase Storage
    <img src={src} alt="Logo" className="size-14 object-contain drop-shadow" />
  );
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
