import { readFile } from "node:fs/promises";
import path from "node:path";
import { getPengaturanAman } from "@/lib/data/master";

export const size = { width: 32, height: 32 };

/** Favicon tab browser = logo madrasah (logo_kanan_url) yang diupload admin di Pengaturan,
 * fallback ke public/favicon.ico kalau belum diupload (atau gagal diambil).
 *
 * Ini route convention RESMI Next.js (bukan `generateMetadata()` di root layout, yang bakal
 * bikin SELURUH app dynamic — dan BUKAN `<link>` manual di dalam <Suspense>, yang sempat
 * dicoba lebih dulu tapi GAGAL: tag-nya baru muncul SETELAH html awal selesai di-stream,
 * padahal browser (Chrome dkk) udah kadung fetch /favicon.ico duluan sebelum itu kejadian,
 * jadi favicon-nya kesangkut di fallback lama). File khusus `icon.tsx` di root `app/`
 * di-resolve Next SEBELUM html dikirim, jadi tag `<link>`-nya udah pasti ada dari awal. */
export default async function icon() {
  const pengaturan = await getPengaturanAman();
  const url = pengaturan?.logo_kanan_url;

  if (url) {
    const res = await fetch(url);
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      return new Response(buffer, {
        headers: { "Content-Type": res.headers.get("content-type") ?? "image/png" },
      });
    }
  }

  const fallback = await readFile(path.join(process.cwd(), "public", "favicon.ico"));
  return new Response(new Uint8Array(fallback), { headers: { "Content-Type": "image/x-icon" } });
}
