"use client";

import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { IndikatorDenganTemplate, PredikatKode } from "@/lib/data/indikator";
import type { BahasaProgram } from "@/lib/data/program";
import { capaianIndikator, susunCatatanNarasi } from "@/lib/deskripsi/engine";

const PREDIKAT_SIMULASI: Exclude<PredikatKode, "SARAN">[] = ["A", "B", "C", "D"];

/**
 * Simulasi mesin deskripsi: guru pilih predikat contoh per indikator (tidak disimpan),
 * langsung lihat kalimat Capaian Kompetensi + Catatan Guru Program yang dihasilkan.
 * Jalan sepenuhnya di browser (engine.ts murni, tanpa Supabase) — belum perlu nilai asli (Fase 5).
 */
export function PreviewPanel({
  indikator,
  bahasaUtama,
  tampilkanTerjemahan,
}: {
  indikator: IndikatorDenganTemplate[];
  bahasaUtama: BahasaProgram;
  tampilkanTerjemahan: boolean;
}) {
  const [nama, setNama] = useState("Contoh Siswa");
  const [jk, setJk] = useState<"L" | "P">("L");
  const [predikat, setPredikat] = useState<Record<string, Exclude<PredikatKode, "SARAN">>>(() =>
    Object.fromEntries(indikator.map((i) => [i.id, "A" as const])),
  );

  const capaian = useMemo(
    () =>
      indikator.map((ind) => ({
        ind,
        ...capaianIndikator(ind.template[predikat[ind.id] ?? "A"]),
      })),
    [indikator, predikat],
  );

  const narasi = useMemo(
    () =>
      susunCatatanNarasi({
        bahasaUtama,
        tampilkanTerjemahan,
        siswa: { nama, jk },
        indikator: indikator.map((ind) => ({
          nama: ind.nama,
          namaArab: ind.nama_arab,
          predikat: predikat[ind.id] ?? "A",
          saran: ind.template.SARAN?.teks,
          saranTerjemahan: ind.template.SARAN?.teks_terjemahan,
        })),
      }),
    [indikator, predikat, bahasaUtama, tampilkanTerjemahan, nama, jk],
  );

  if (indikator.length === 0) return null;

  return (
    <div className="grid gap-3 rounded-xl border p-4">
      <p className="flex items-center gap-2 font-semibold">
        <Eye className="size-4" /> Pratinjau Deskripsi (simulasi, belum pakai nilai asli)
      </p>

      <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
        <Input value={nama} onChange={(e) => setNama(e.target.value)} aria-label="Nama contoh siswa" placeholder="Nama contoh siswa" />
        <NativeSelect aria-label="Jenis kelamin contoh" value={jk} onChange={(e) => setJk(e.target.value as "L" | "P")}>
          <NativeSelectOption value="L">Laki-laki</NativeSelectOption>
          <NativeSelectOption value="P">Perempuan</NativeSelectOption>
        </NativeSelect>
      </div>

      <div className="grid gap-2">
        {indikator.map((ind) => (
          <div key={ind.id} className="grid grid-cols-[1fr_auto] items-center gap-2 text-sm">
            <span>{ind.nama}</span>
            <NativeSelect
              size="sm"
              aria-label={`Predikat simulasi ${ind.nama}`}
              value={predikat[ind.id] ?? "A"}
              onChange={(e) => setPredikat((p) => ({ ...p, [ind.id]: e.target.value as Exclude<PredikatKode, "SARAN"> }))}
            >
              {PREDIKAT_SIMULASI.map((k) => (
                <NativeSelectOption key={k} value={k}>
                  Predikat {k}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        ))}
      </div>

      <div className="grid gap-2 rounded-lg bg-muted/40 p-3 text-sm">
        <p className="font-medium">Capaian Kompetensi per indikator</p>
        {capaian.map(({ ind, teks, terjemahan }) => (
          <p key={ind.id}>
            <span className="font-medium">{ind.nama}:</span> {teks}
            {terjemahan ? <span className="block italic text-muted-foreground">{terjemahan}</span> : null}
          </p>
        ))}
      </div>

      <div className="grid gap-1 rounded-lg bg-muted/40 p-3 text-sm">
        <p className="font-medium">Catatan Guru Program (draf otomatis)</p>
        <p>{narasi.teks ?? "—"}</p>
        {narasi.terjemahan ? <p className="italic text-muted-foreground">{narasi.terjemahan}</p> : null}
      </div>
    </div>
  );
}
