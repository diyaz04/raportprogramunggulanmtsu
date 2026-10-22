import { Suspense } from "react";
import type { Metadata } from "next";
import { BookOpenCheck, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <BookOpenCheck className="size-6" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Rapor Program Unggulan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            MTsS KH. A. Wahab Muhsin Sukahideng
          </p>
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

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Lupa kata sandi? Hubungi admin madrasah.
        </p>
      </div>
    </main>
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
