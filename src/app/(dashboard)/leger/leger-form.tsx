"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/form-dialog";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

export function LegerForm({
  daftarPeriode,
  periodeDefault,
  daftarProgram,
}: {
  daftarPeriode: { id: string; label: string }[];
  periodeDefault: string;
  daftarProgram: { kode: string; nama: string }[];
}) {
  const [mengunduh, setMengunduh] = useState(false);
  const [progres, setProgres] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Progres di sini CUMA animasi/estimasi (server nggak ngirim progres beneran) — jadi
  // sengaja "merayap" mendekati 90% terus mentok nunggu, bukan nunjuk persen pasti.
  function mulaiProgresSimulasi() {
    setProgres(5);
    timer.current = setInterval(() => {
      setProgres((p) => (p >= 90 ? p : p + (90 - p) * 0.08 + 0.3));
    }, 200);
  }

  function hentikanProgresSimulasi() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }

  useEffect(() => hentikanProgresSimulasi, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams({
      periode: String(form.get("periode") ?? ""),
      program: String(form.get("program") ?? "semua"),
    });

    setMengunduh(true);
    mulaiProgresSimulasi();
    try {
      const res = await fetch(`/api/leger?${params.toString()}`);
      if (!res.ok) {
        const hasil = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(hasil?.error ?? "Gagal membuat file leger");
      }

      const blob = await res.blob();
      const cocok = /filename="?([^"]+)"?/.exec(res.headers.get("Content-Disposition") ?? "");
      const namaFile = cocok?.[1] ?? "Leger.xlsx";

      hentikanProgresSimulasi();
      setProgres(100);
      await new Promise((r) => setTimeout(r, 250));

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = namaFile;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh leger");
    } finally {
      hentikanProgresSimulasi();
      setMengunduh(false);
      setProgres(0);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-xl border p-5">
      <Field label="Periode" htmlFor="periode">
        <NativeSelect id="periode" name="periode" className="w-full" defaultValue={periodeDefault} required disabled={mengunduh}>
          {daftarPeriode.map((p) => (
            <NativeSelectOption key={p.id} value={p.id}>
              {p.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field label="Cakupan" htmlFor="program" hint="Rekap keseluruhan selalu disertakan; ini mengatur sheet detail per program.">
        <NativeSelect id="program" name="program" className="w-full" defaultValue="semua" disabled={mengunduh}>
          <NativeSelectOption value="semua">Semua program</NativeSelectOption>
          {daftarProgram.map((p) => (
            <NativeSelectOption key={p.kode} value={p.kode}>
              {p.nama}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <div className="grid gap-2">
        <Button type="submit" className="w-fit" disabled={mengunduh}>
          {mengunduh ? <Loader2 className="animate-spin" /> : <Download />}
          {mengunduh ? "Menyiapkan file…" : "Unduh Leger"}
        </Button>
        {mengunduh ? (
          <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-600 transition-[width] duration-200 ease-out"
              style={{ width: `${progres}%` }}
            />
          </div>
        ) : null}
      </div>
    </form>
  );
}
