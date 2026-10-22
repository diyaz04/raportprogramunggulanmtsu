"use client";

import { useEffect, useRef, useState } from "react";

const LEBAR_A4_PX = 794; // 210mm @ 96dpi — referensi buat hitung rasio skala

/** Bungkus <RaporA4> biar di layar sempit (HP) dia TETAP layout kayak kertas A4 asli
 * (nggak reflow/ngetext-wrap jadi berantakan), cuma di-skala-kecilin secara utuh pakai
 * transform — bukan dibiarin w-full ngikutin lebar viewport yang bikin konten di dalamnya
 * mencoba "responsive" padahal itu memang desain dokumen cetak, bukan halaman web biasa. */
export function RaporA4Scaled({ children }: { children: React.ReactNode }) {
  const luarRef = useRef<HTMLDivElement>(null);
  const dalamRef = useRef<HTMLDivElement>(null);
  const [skala, setSkala] = useState(1);
  const [tinggi, setTinggi] = useState<number>();

  useEffect(() => {
    const luar = luarRef.current;
    const dalam = dalamRef.current;
    if (!luar || !dalam) return;

    function hitungUlang() {
      if (!luar || !dalam) return;
      const lebarTersedia = luar.clientWidth;
      const s = lebarTersedia > 0 ? Math.min(1, lebarTersedia / LEBAR_A4_PX) : 1;
      setSkala(s);
      setTinggi(dalam.offsetHeight * s);
    }

    hitungUlang();
    const ro = new ResizeObserver(hitungUlang);
    ro.observe(luar);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={luarRef} className="w-full overflow-hidden" style={{ height: tinggi }}>
      <div ref={dalamRef} style={{ width: LEBAR_A4_PX, transform: `scale(${skala})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
}
