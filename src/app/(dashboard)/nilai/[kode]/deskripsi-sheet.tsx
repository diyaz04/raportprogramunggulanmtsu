"use client";

import { useMemo } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { KolomIndikator, NilaiSel } from "@/lib/data/nilai";
import type { BahasaProgram } from "@/lib/data/program";
import { capaianIndikator, hitungPredikat, susunCatatanNarasi, type RentangPredikat } from "@/lib/deskripsi/engine";

export function DeskripsiSheet({
  siswaNama,
  siswaJk,
  bahasaUtama,
  tampilkanTerjemahan,
  kolom,
  nilaiSiswa,
  skala,
}: {
  siswaNama: string;
  siswaJk: "L" | "P";
  bahasaUtama: BahasaProgram;
  tampilkanTerjemahan: boolean;
  kolom: KolomIndikator[];
  nilaiSiswa: Record<string, NilaiSel | undefined>;
  skala: RentangPredikat[];
}) {
  const perIndikator = useMemo(
    () =>
      kolom
        .map((ind) => {
          const sel = nilaiSiswa[ind.id];
          if (!sel) return null;
          const predikat = hitungPredikat(sel.nilai, skala);
          return { indikator: ind, predikat, ...capaianIndikator(ind.template[predikat]) };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
    [kolom, nilaiSiswa, skala],
  );

  const narasi = useMemo(
    () =>
      susunCatatanNarasi({
        bahasaUtama,
        tampilkanTerjemahan,
        siswa: { nama: siswaNama, jk: siswaJk },
        indikator: perIndikator.map(({ indikator, predikat }) => ({
          nama: indikator.nama,
          namaArab: indikator.nama_arab,
          predikat,
          saran: indikator.template.SARAN?.teks,
          saranTerjemahan: indikator.template.SARAN?.teks_terjemahan,
        })),
      }),
    [perIndikator, bahasaUtama, tampilkanTerjemahan, siswaNama, siswaJk],
  );

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Lihat deskripsi ${siswaNama}`} />}>
        <Eye />
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{siswaNama}</SheetTitle>
          <SheetDescription>Pratinjau deskripsi dari nilai yang sudah tersimpan.</SheetDescription>
        </SheetHeader>
        <div className="grid flex-1 gap-4 overflow-y-auto px-4 pb-4 text-sm">
          {perIndikator.length === 0 ? (
            <p className="text-muted-foreground">Belum ada nilai tersimpan untuk siswa ini.</p>
          ) : (
            <>
              <div className="grid gap-2">
                <p className="font-medium">Capaian Kompetensi</p>
                {perIndikator.map(({ indikator, predikat, teks, terjemahan }) => (
                  <p key={indikator.id}>
                    <span className="font-medium">
                      {indikator.nama} ({predikat}):
                    </span>{" "}
                    {teks}
                    {terjemahan ? <span className="block italic text-muted-foreground">{terjemahan}</span> : null}
                  </p>
                ))}
              </div>
              <div className="grid gap-1 rounded-lg bg-muted/40 p-3">
                <p className="font-medium">Catatan Guru Program</p>
                <p>{narasi.teks ?? "—"}</p>
                {narasi.terjemahan ? <p className="italic text-muted-foreground">{narasi.terjemahan}</p> : null}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
