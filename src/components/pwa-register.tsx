"use client";

import { useEffect } from "react";

/** Daftarin service worker (public/sw.js) — syarat biar browser nganggep app ini installable.
 * SENGAJA DISKIP di development: cache-first buat `_next/static/` aman di production (nama
 * file di-hash per-build, jadi nggak pernah ke-mismatch), tapi di dev server Fast Refresh bisa
 * ganti isi chunk JS tanpa ganti nama file — kalau SW ngecache versi lama, browser jalanin kode
 * basi dan bikin error aneh (RSC/Suspense gagal) yang susah ditebak sumbernya. */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Nggak kritis kalau gagal (mis. browser lama) — app tetap jalan normal tanpa PWA.
    });
  }, []);

  return null;
}
