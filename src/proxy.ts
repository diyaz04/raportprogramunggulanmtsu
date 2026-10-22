import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Semua path kecuali aset statis, gambar, dan favicon dinamis (app/icon.tsx) —
    // favicon HARUS bisa diakses tanpa login, sama kayak favicon.ico statis.
    "/((?!_next/static|_next/image|favicon.ico|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
