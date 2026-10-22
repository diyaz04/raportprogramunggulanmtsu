"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

export function ProgramSubnav({ kode, jenis }: { kode: string; jenis: "standar" | "tahfidz" | "ksm" | "riset" }) {
  const pathname = usePathname();
  const base = `/program/${kode}`;
  const items = [
    { href: base, label: "Ringkasan" },
    { href: `${base}/indikator`, label: "Indikator" },
    { href: `${base}/template`, label: "Template Deskripsi" },
    { href: `${base}/peserta`, label: "Peserta" },
    { href: `${base}/guru`, label: "Guru & Penanda Tangan" },
    ...(jenis === "ksm" ? [{ href: `${base}/prestasi`, label: "Prestasi" }] : []),
    ...(jenis === "riset" ? [{ href: `${base}/proyek`, label: "Proyek" }] : []),
    { href: `${base}/kehadiran`, label: "Kehadiran" },
  ];

  return (
    <nav className="flex gap-1 border-b">
      {items.map((item) => {
        const active = item.href === base ? pathname === base : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
