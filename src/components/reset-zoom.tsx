"use client";

import { useEffect } from "react";

/** Beberapa browser HP "nyangkutin" level zoom dari halaman sebelumnya (paling sering abis
 * fokus ke input form, misalnya form login) dan nggak reset sendiri pas pindah halaman lewat
 * navigasi client-side (bukan full reload) — user jadi lihat halaman berikutnya (misal
 * Beranda) ke-zoom lebih gede daripada halaman lain tanpa mereka pinch manual. Trik ini maksa
 * browser nge-reset zoom ke 100% tiap kali komponen ini mount (dipasang di root layout
 * dashboard, jadi jalan tiap pindah ke area yang butuh login), dengan sengaja ngelepas batasan
 * `maximum-scale` lagi abis sebentar biar user TETAP bisa pinch-zoom manual kalau mereka mau. */
export function ResetZoom() {
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;
    const semula = meta.getAttribute("content");
    if (!semula) return;

    meta.setAttribute("content", `${semula}, maximum-scale=1`);
    const timer = setTimeout(() => meta.setAttribute("content", semula), 300);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
