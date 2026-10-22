"use client";

import { useEffect } from "react";

/** Daftarin service worker (public/sw.js) — syarat biar browser nganggep app ini installable. */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Nggak kritis kalau gagal (mis. browser lama) — app tetap jalan normal tanpa PWA.
    });
  }, []);

  return null;
}
