import { connection, NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Akun belum diaktifkan admin / tidak punya profil: keluarkan sesi lalu kembali ke login.
export async function GET(request: NextRequest) {
  // Handler ini mengubah sesi, jadi tidak boleh ikut di-prerender saat build.
  await connection();

  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login?error=nonaktif", request.url));
}
