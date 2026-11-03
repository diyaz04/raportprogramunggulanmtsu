"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, BookOpenText, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "cn";
import type { PesertaProgram } from "@/lib/data/program";

type Props = {
  peserta: PesertaProgram[];
};

export function DaftarHafalanSiswa({ peserta }: Props) {
  const searchParams = useSearchParams();
  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  const [kelasAktif, setKelasAktif] = useState(() => searchParams.get("kelas") ?? "semua");

  // Ekstrak daftar kelas unik yang terurut berdasarkan tingkat lalu nama kelas
  const { daftarKelas, countTanpaKelas } = useMemo(() => {
    const map = new Map<string, { nama: string; tingkat: number | null; count: number }>();
    let tanpaKelas = 0;

    for (const p of peserta) {
      if (!p.kelas_nama) {
        tanpaKelas++;
        continue;
      }
      const item = map.get(p.kelas_nama);
      if (item) {
        item.count++;
      } else {
        map.set(p.kelas_nama, {
          nama: p.kelas_nama,
          tingkat: p.kelas_tingkat,
          count: 1,
        });
      }
    }

    const list = [...map.values()].sort((a, b) => {
      if (a.tingkat != null && b.tingkat != null && a.tingkat !== b.tingkat) {
        return a.tingkat - b.tingkat;
      }
      return a.nama.localeCompare(b.nama, "id", { numeric: true, sensitivity: "base" });
    });

    return { daftarKelas: list, countTanpaKelas: tanpaKelas };
  }, [peserta]);

  // Sinkronisasi query param ke browser history secara halus (tanpa reload RSC)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (kelasAktif && kelasAktif !== "semua") {
      params.set("kelas", kelasAktif);
    } else {
      params.delete("kelas");
    }
    if (q.trim()) {
      params.set("q", q.trim());
    } else {
      params.delete("q");
    }
    const searchStr = params.toString();
    const nextUrl = searchStr ? `${window.location.pathname}?${searchStr}` : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  }, [kelasAktif, q]);

  // Filter daftar siswa berdasarkan tab kelas dan kata kunci pencarian
  const hasil = useMemo(() => {
    const kata = q.trim().toLowerCase();
    return peserta.filter((p) => {
      // 1. Filter tab kelas
      if (kelasAktif !== "semua") {
        if (kelasAktif === "tanpa-kelas") {
          if (p.kelas_nama) return false;
        } else {
          if (p.kelas_nama !== kelasAktif) return false;
        }
      }

      // 2. Filter teks pencarian (nama, NIS, kelas, atau kelompok)
      if (!kata) return true;
      const namaCocok = p.siswa.nama.toLowerCase().includes(kata);
      const nisCocok = p.siswa.nis?.toLowerCase().includes(kata);
      const kelasCocok = p.kelas_nama?.toLowerCase().includes(kata);
      const kelompokCocok = p.kelompok_nama?.toLowerCase().includes(kata);
      return namaCocok || nisCocok || kelasCocok || kelompokCocok;
    });
  }, [peserta, kelasAktif, q]);

  const isFiltered = q.trim() !== "" || kelasAktif !== "semua";

  return (
    <div className="grid gap-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama atau NIS siswa…"
          className="h-9 pl-9 pr-8 text-sm"
        />
        {q ? (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            aria-label="Hapus pencarian"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {/* Tab per Kelas */}
      <div
        role="tablist"
        aria-label="Tab per kelas"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <button
          type="button"
          role="tab"
          aria-selected={kelasAktif === "semua"}
          onClick={() => setKelasAktif("semua")}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
            kelasAktif === "semua"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span>Semua</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
              kelasAktif === "semua"
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-background text-muted-foreground shadow-xs"
            )}
          >
            {peserta.length}
          </span>
        </button>

        {daftarKelas.map((k) => {
          const aktif = kelasAktif === k.nama;
          return (
            <button
              key={k.nama}
              type="button"
              role="tab"
              aria-selected={aktif}
              onClick={() => setKelasAktif(k.nama)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                aktif
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span>{k.nama}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                  aktif
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background text-muted-foreground shadow-xs"
                )}
              >
                {k.count}
              </span>
            </button>
          );
        })}

        {countTanpaKelas > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={kelasAktif === "tanpa-kelas"}
            onClick={() => setKelasAktif("tanpa-kelas")}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              kelasAktif === "tanpa-kelas"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span>Tanpa Kelas</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                kelasAktif === "tanpa-kelas"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background text-muted-foreground shadow-xs"
              )}
            >
              {countTanpaKelas}
            </span>
          </button>
        )}
      </div>

      {/* Keterangan & tombol reset jika sedang difilter */}
      {isFiltered && (
        <div className="flex items-center justify-between px-0.5 text-xs text-muted-foreground">
          <span>
            Menampilkan <strong className="text-foreground">{hasil.length}</strong> dari {peserta.length} siswa
          </span>
          <button
            type="button"
            onClick={() => {
              setQ("");
              setKelasAktif("semua");
            }}
            className="cursor-pointer text-xs font-medium text-primary hover:underline"
          >
            Reset filter
          </button>
        </div>
      )}

      {/* Daftar Siswa atau Empty State */}
      {hasil.length === 0 ? (
        <div className="grid gap-2 rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm font-medium">Tidak ada siswa yang cocok</p>
          <p className="text-xs text-muted-foreground">
            {q
              ? `Tidak ada siswa yang cocok dengan "${q}"${kelasAktif !== "semua" ? ` di kelas ${kelasAktif}` : ""}.`
              : `Tidak ada siswa di kelas ${kelasAktif}.`}
          </p>
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQ("");
                setKelasAktif("semua");
              }}
            >
              Tampilkan Semua Siswa
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-2">
          {hasil.map((p) => (
            <Link
              key={p.id}
              href={`/tahfidz/hafalan/${p.id}`}
              className="group flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors hover:border-foreground/20 hover:bg-muted/40"
            >
              <div className="grid gap-0.5">
                <span className="font-medium">{p.siswa.nama}</span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BookOpenText className="size-3.5 shrink-0" />
                  <span>{p.kelas_nama ?? "—"}</span>
                  {p.kelompok_nama ? <span>· {p.kelompok_nama}</span> : null}
                  {p.siswa.nis ? <span className="opacity-75">· NIS {p.siswa.nis}</span> : null}
                </span>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
