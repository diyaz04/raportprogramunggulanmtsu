import { getPengaturanAman } from "@/lib/data/master";

/** Favicon tab browser = logo madrasah (logo_kanan_url) yang diupload admin di Pengaturan,
 * fallback ke /favicon.ico statis (public/) kalau belum diupload. Dirender sebagai <link>
 * biasa — React 19 otomatis hoist ke <head>, jadi nggak perlu generateMetadata() di root
 * layout (yang bakal bikin SELURUH app dynamic di Cache Components). SATU-SATUNYA sumber
 * tag favicon di app ini — file src/app/favicon.ico SENGAJA dipindah ke public/ supaya
 * Next nggak auto-inject tag <link> kedua yang bisa tabrakan sama yang ini. */
export async function FaviconDinamis() {
  const pengaturan = await getPengaturanAman();
  return <link rel="icon" href={pengaturan?.logo_kanan_url ?? "/favicon.ico"} />;
}
