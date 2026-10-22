"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { PredikatBadge } from "@/components/nilai/predikat-badge";
import { Input } from "@/components/ui/input";
import { hitungPredikat, type RentangPredikat } from "@/lib/deskripsi/engine";
import { ubahNilaiHafalan } from "../actions";

export function NilaiHafalanCell({ siswaId, id, nilaiAwal, skala }: { siswaId: string; id: string; nilaiAwal: number | null; skala: RentangPredikat[] }) {
  const [value, setValue] = useState(nilaiAwal != null ? String(nilaiAwal) : "");
  const [tersimpan, setTersimpan] = useState(nilaiAwal);
  const [pending, startTransition] = useTransition();

  const angka = value.trim() === "" ? null : Number(value);
  const valid = angka !== null && Number.isInteger(angka) && angka >= 0 && angka <= 100;
  const predikat = valid ? hitungPredikat(angka, skala) : null;

  function simpan() {
    if (!valid || angka === tersimpan) return;
    const formData = new FormData();
    formData.set("nilai", String(angka));
    startTransition(async () => {
      const result = await ubahNilaiHafalan(siswaId, id, {}, formData);
      if (result.error) toast.error(result.error);
      else setTersimpan(angka);
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        min={0}
        max={100}
        inputMode="numeric"
        className="h-8 w-16"
        value={value}
        disabled={pending}
        aria-label="Nilai hafalan"
        onChange={(e) => setValue(e.target.value)}
        onBlur={simpan}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
      {predikat ? <PredikatBadge predikat={predikat} /> : null}
    </div>
  );
}
