import {
  BookOpenText,
  CalendarRange,
  ClipboardPenLine,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  Layers,
  LayoutDashboard,
  School,
  Settings,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/auth";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
  /** false = halaman belum dibuat; tampil redup dengan label "Segera". */
  ready: boolean;
  /** Guru hanya lihat menu ini kalau ditugaskan ke program Tahfidz (dicek di layout.tsx). Tidak berlaku untuk role lain. */
  khususTahfidzGuru?: boolean;
};

export type NavGroup = { label?: string; items: NavItem[] };

const SEMUA: Role[] = ["admin", "koordinator", "guru", "kepala"];
const PENGELOLA: Role[] = ["admin", "koordinator", "guru"];
const TANPA_GURU: Role[] = ["admin", "koordinator", "kepala"];

export const NAV: NavGroup[] = [
  {
    items: [{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: SEMUA, ready: true }],
  },
  {
    label: "Penilaian",
    items: [
      { title: "Input Nilai", href: "/nilai", icon: ClipboardPenLine, roles: PENGELOLA, ready: true },
      { title: "Hafalan Tahfidz", href: "/tahfidz/hafalan", icon: BookOpenText, roles: PENGELOLA, ready: true, khususTahfidzGuru: true },
    ],
  },
  {
    label: "Rapor",
    items: [
      { title: "Rapor", href: "/rapor", icon: FileText, roles: SEMUA, ready: true },
      { title: "Leger Excel", href: "/leger", icon: FileSpreadsheet, roles: ["admin", "koordinator"], ready: true },
    ],
  },
  {
    label: "Program",
    items: [{ title: "Program & Peserta", href: "/program", icon: Layers, roles: SEMUA, ready: true }],
  },
  {
    label: "Master Data",
    items: [
      { title: "Periode", href: "/master/periode", icon: CalendarRange, roles: ["admin"], ready: true },
      { title: "Kelas", href: "/master/kelas", icon: School, roles: ["admin"], ready: true },
      { title: "Siswa", href: "/master/siswa", icon: GraduationCap, roles: ["admin"], ready: true },
      { title: "Guru & Akun", href: "/master/guru", icon: UsersRound, roles: ["admin"], ready: true },
    ],
  },
  {
    label: "Sistem",
    items: [{ title: "Pengaturan", href: "/pengaturan", icon: Settings, roles: ["admin"], ready: true }],
  },
];

export function navForRole(role: Role, opts?: { bisaTahfidz?: boolean }): NavGroup[] {
  return NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => {
      if (!i.roles.includes(role)) return false;
      if (i.khususTahfidzGuru && role === "guru" && !opts?.bisaTahfidz) return false;
      return true;
    }),
  })).filter((g) => g.items.length > 0);
}
