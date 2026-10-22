import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Dipanggil Vercel Cron (lihat vercel.json) sekali sehari supaya project Supabase gratisan
 * nggak di-pause otomatis gara-gara dianggap nggak ada aktivitas selama 7 hari.
 *
 * Query SELECT ringan ke tabel `pengaturan` (yang anon boleh baca, lihat migrasi
 * 20261021110000_pengaturan_publik.sql) sudah cukup — Supabase ngitung "aktif" dari ada
 * request API masuk, bukan dari ada perubahan data.
 */
export async function GET(request: Request) {
  const rahasia = process.env.CRON_SECRET;
  if (rahasia) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${rahasia}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("pengaturan").select("id").limit(1);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, waktu: new Date().toISOString() });
}
