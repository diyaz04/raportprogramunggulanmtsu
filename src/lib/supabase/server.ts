import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { getSupabaseEnv } from "./env";

// Membaca cookies() = data request, jadi pemanggilnya harus berada di dalam <Suspense>
// (aturan Cache Components di Next.js 16).
export async function createClient() {
  // @supabase/ssr memanggil Date.now() secara sinkron (pengecekan kedaluwarsa token) di dalam
  // alur query APA PUN, bukan cuma yang baca auth claims — cookies() saja TIDAK CUKUP
  // menandai subtree ini dinamis di semua kasus (sudah kejadian 2x: getCurrentUser di lib/auth.ts,
  // lalu getPeriodeAktif yang bahkan tidak menyentuh auth sama sekali). connection() di sini,
  // di SATU TEMPAT, berlaku buat SEMUA pemanggil createClient() di seluruh aplikasi.
  await connection();

  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Dipanggil dari Server Component: cookie tidak bisa ditulis di sini.
          // Aman diabaikan karena proxy.ts yang menyegarkan sesi.
        }
      },
    },
  });
}
