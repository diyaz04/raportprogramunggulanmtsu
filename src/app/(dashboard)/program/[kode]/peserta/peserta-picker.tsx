"use client";

import { useMemo, useState } from "react";
import { Field } from "@/components/form-dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";

type Calon = { id: string; nis: string; nama: string; kelas_nama: string | null };
type Kelompok = { id: string; nama: string };

/** Daftar siswa lintas kelas, bercentang, dengan pencarian + filter kelas. */
export function PesertaPicker({ calon, kelompok }: { calon: Calon[]; kelompok: Kelompok[] }) {
  const [q, setQ] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [terpilih, setTerpilih] = useState<Set<string>>(new Set());

  const daftarKelas = useMemo(
    () => [...new Set(calon.map((c) => c.kelas_nama).filter((k): k is string => !!k))].sort(),
    [calon],
  );

  const tampil = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return calon.filter((c) => {
      if (kelasFilter && c.kelas_nama !== kelasFilter) return false;
      if (!kata) return true;
      return c.nama.toLowerCase().includes(kata) || c.nis.includes(kata);
    });
  }, [calon, q, kelasFilter]);

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
        Semua siswa aktif sudah terdaftar sebagai peserta program ini di periode ini.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
        <Input
          type="search"
          placeholder="Cari nama atau NIS…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Cari siswa"
        />
        <NativeSelect aria-label="Filter kelas" value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)}>
          <NativeSelectOption value="">Semua kelas</NativeSelectOption>
          {daftarKelas.map((k) => (
            <NativeSelectOption key={k} value={k}>
              {k}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

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

      <ul className="max-h-64 divide-y overflow-y-auto rounded-lg border">
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
              <span className="text-xs text-muted-foreground">{c.kelas_nama ?? "—"}</span>
              <span className="text-xs text-muted-foreground">{c.nis}</span>
            </label>
          </li>
        ))}
        {tampil.length === 0 ? (
          <li className="px-3 py-6 text-center text-sm text-muted-foreground">Tidak ada yang cocok.</li>
        ) : null}
      </ul>

      {kelompok.length > 0 ? (
        <Field label="Kelompok" htmlFor="kelompok_id" hint="Opsional. Bisa diubah lagi per siswa setelah ditambahkan.">
          <NativeSelect id="kelompok_id" name="kelompok_id" defaultValue="" className="w-full">
            <NativeSelectOption value="">Tanpa kelompok</NativeSelectOption>
            {kelompok.map((k) => (
              <NativeSelectOption key={k.id} value={k.id}>
                {k.nama}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      ) : null}

      {/* Pilihan dikirim lewat input tersembunyi supaya tidak hilang saat daftar difilter */}
      {[...terpilih].map((id) => (
        <input key={id} type="hidden" name="siswa_id" value={id} />
      ))}
    </div>
  );
}
