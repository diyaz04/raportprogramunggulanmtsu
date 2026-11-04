"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, GraduationCap, Search, Sparkles, UserCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { DewanGuruCardData } from "@/lib/auth-types";
import { inisialNama } from "@/lib/utils";

const ROLE_BADGE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  kepala: { bg: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300", text: "text-purple-700", border: "border-purple-200 dark:border-purple-800" },
  koordinator: { bg: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300", text: "text-sky-700", border: "border-sky-200 dark:border-sky-800" },
  guru: { bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300", text: "text-emerald-700", border: "border-emerald-200 dark:border-emerald-800" },
  admin: { bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300", text: "text-amber-700", border: "border-amber-200 dark:border-amber-800" },
};

const CARD_HEADER_GRADIENTS: Record<string, string> = {
  kepala: "from-purple-700 via-indigo-700 to-emerald-700",
  koordinator: "from-sky-700 via-teal-700 to-emerald-700",
  guru: "from-emerald-700 via-teal-700 to-emerald-800",
  admin: "from-amber-700 via-emerald-700 to-teal-800",
};

export function DewanGuruSection({
  dewanGuru,
  periodeLabel,
  isAdmin = false,
}: {
  dewanGuru: DewanGuruCardData[];
  periodeLabel: string;
  isAdmin?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"semua" | "guru" | "koordinator" | "kepala">("semua");

  const filtered = useMemo(() => {
    return dewanGuru.filter((item) => {
      // Filter role tab
      if (tab !== "semua" && item.role !== tab) {
        return false;
      }
      // Filter search query
      if (query.trim()) {
        const q = query.toLowerCase();
        const namaCocok = item.nama.toLowerCase().includes(q);
        const nipCocok = item.nip?.toLowerCase().includes(q) ?? false;
        const programCocok = item.programs.some(
          (p) => p.nama.toLowerCase().includes(q) || p.kode.toLowerCase().includes(q),
        );
        return namaCocok || nipCocok || programCocok;
      }
      return true;
    });
  }, [dewanGuru, tab, query]);

  const jumlahPerRole = useMemo(() => {
    return {
      semua: dewanGuru.length,
      guru: dewanGuru.filter((g) => g.role === "guru").length,
      koordinator: dewanGuru.filter((g) => g.role === "koordinator").length,
      kepala: dewanGuru.filter((g) => g.role === "kepala").length,
    };
  }, [dewanGuru]);

  return (
    <div className="space-y-5 rounded-3xl border bg-card/60 p-6 shadow-sm backdrop-blur-sm sm:p-7">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  Dewan Guru & Pembimbing Program
                </h2>
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50">
                  {dewanGuru.length} Pendidik
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Tenaga pendidik dan pembimbing program unggulan untuk periode <span className="font-medium text-foreground">{periodeLabel}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar: Search & Link Admin */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari guru / NIP / program..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 pl-9 text-xs rounded-xl"
            />
          </div>
          {isAdmin && (
            <Link
              href="/master/guru"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
            >
              <Users className="size-3.5" />
              Kelola Guru & Akun
            </Link>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTab("semua")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
            tab === "semua"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-muted/70 text-muted-foreground hover:bg-muted"
          }`}
        >
          <span>Semua</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">{jumlahPerRole.semua}</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("guru")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
            tab === "guru"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-muted/70 text-muted-foreground hover:bg-muted"
          }`}
        >
          <span>Guru Program</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">{jumlahPerRole.guru}</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("koordinator")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
            tab === "koordinator"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-muted/70 text-muted-foreground hover:bg-muted"
          }`}
        >
          <span>Koordinator</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">{jumlahPerRole.koordinator}</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("kepala")}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
            tab === "kepala"
              ? "bg-emerald-600 text-white shadow-sm"
              : "bg-muted/70 text-muted-foreground hover:bg-muted"
          }`}
        >
          <span>Kepala Madrasah</span>
          <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">{jumlahPerRole.kepala}</span>
        </button>
      </div>

      {/* Grid Kartu Guru */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Users className="size-6" />
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">Tidak ada data guru yang cocok</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {query ? `Tidak ditemukan hasil untuk "${query}"` : "Belum ada guru pada kategori ini."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => {
            const roleStyle = ROLE_BADGE_STYLES[item.role] ?? ROLE_BADGE_STYLES.guru;
            const headerGradient = CARD_HEADER_GRADIENTS[item.role] ?? CARD_HEADER_GRADIENTS.guru;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl"
              >
                {/* Banner Atas Kartu */}
                <div className={`relative h-20 w-full bg-gradient-to-r ${headerGradient} p-3`}>
                  <div className="absolute inset-0 bg-black/10 mix-blend-overlay" />
                  
                  {/* Role Badge di sudut kanan atas */}
                  <div className="relative z-10 flex justify-end">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md border border-white/25 shadow-sm">
                      <Sparkles className="size-2.5 text-amber-200" />
                      {item.roleLabel}
                    </span>
                  </div>
                </div>

                {/* Foto Profil Guru (Menumpuk Banner) */}
                <div className="relative px-5 pt-0 -mt-10 flex flex-col items-center text-center">
                  <div className="relative size-20 rounded-2xl p-1 bg-gradient-to-tr from-emerald-400 via-teal-300 to-amber-300 shadow-lg ring-4 ring-card">
                    <div className="relative size-full rounded-xl overflow-hidden bg-muted">
                      {item.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element -- foto guru dinamis
                        <img
                          src={item.foto_url}
                          alt={item.nama}
                          className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-bold text-xl select-none shadow-inner">
                          {inisialNama(item.nama)}
                        </div>
                      )}
                    </div>

                    {/* Titik Status Aktif */}
                    <span
                      className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-card shadow-sm"
                      title="Pendidik Aktif"
                    >
                      <UserCheck className="size-2.5 text-white" />
                    </span>
                  </div>

                  {/* Info Nama & NIP */}
                  <div className="mt-3 w-full">
                    <h3 className="font-bold text-foreground text-sm line-clamp-1 group-hover:text-emerald-600 transition-colors">
                      {item.nama}
                    </h3>
                    <p className="mt-0.5 text-[11px] font-mono text-muted-foreground">
                      {item.nip ? `NIP. ${item.nip}` : "Pendidik Madrasah"}
                    </p>
                  </div>
                </div>

                {/* Divider & Program yang Diampu */}
                <div className="mt-4 flex-1 border-t bg-muted/20 px-4 py-3.5 flex flex-col justify-between">
                  <div>
                    <p className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <BookOpen className="size-3 text-emerald-600" />
                      Program Bimbingan:
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {item.programs.length > 0 ? (
                        item.programs.map((prog) => (
                          <span
                            key={prog.id}
                            className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/20"
                            title={prog.nama}
                          >
                            {prog.nama}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">
                          {item.role === "kepala"
                            ? "Pengarah Program"
                            : item.role === "admin"
                            ? "Pengelola Sistem"
                            : "Belum ada program diampu"}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.email && (
                    <div className="mt-3 pt-2 border-t border-border/50 text-[11px] text-muted-foreground truncate">
                      {item.email}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
