"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

type Calon = { id: string; nis: string; nama: string };

/** Daftar siswa bercentang dengan pencarian. Pilihan tetap tersimpan walau hasil pencarian berubah. */
export function AnggotaPicker({ calon }: { calon: Calon[] }) {
  const [q, setQ] = useState("");
  const [terpilih, setTerpilih] = useState<Set<string>>(new Set());

  const tampil = useMemo(() => {
    const kata = q.trim().toLowerCase();
    if (!kata) return calon;
    return calon.filter((c) => c.nama.toLowerCase().includes(kata) || c.nis.includes(kata));
  }, [calon, q]);

  const semuaTampilTerpilih = tampil.length > 0 && tampil.every((c) => terpilih.has(c.id));

  function toggle(id: string, on: boolean) {
    setTerpilih((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSemua(on: boolean) {
    setTerpilih((prev) => {
      const next = new Set(prev);
      for (const c of tampil) {
        if (on) next.add(c.id);
        else next.delete(c.id);
      }
      return next;
    });
  }

  if (calon.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        Semua siswa aktif sudah punya kelas di periode ini.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      <Input
        type="search"
        placeholder="Cari nama atau NIS…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Cari siswa"
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={semuaTampilTerpilih}
            onChange={(e) => toggleSemua(e.target.checked)}
          />
          Pilih semua yang tampil ({tampil.length})
        </label>
        <span>{terpilih.size} dipilih</span>
      </div>

      <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border">
        {tampil.map((c) => (
          <li key={c.id}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/50">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={terpilih.has(c.id)}
                onChange={(e) => toggle(c.id, e.target.checked)}
              />
              <span className="flex-1 truncate">{c.nama}</span>
              <span className="text-xs text-muted-foreground">{c.nis}</span>
            </label>
          </li>
        ))}
        {tampil.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">Tidak ada yang cocok.</li>
        ) : null}
      </ul>

      {/* Pilihan dikirim lewat input tersembunyi supaya tidak hilang saat daftar difilter */}
      {[...terpilih].map((id) => (
        <input key={id} type="hidden" name="siswa_id" value={id} />
      ))}
    </div>
  );
}
