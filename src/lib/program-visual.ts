import {
  BookOpen,
  BookOpenText,
  Calculator,
  FlaskConical,
  Globe2,
  Languages,
  Microscope,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

export type WarnaProgram = { bg: string; text: string; ring: string };

/** Ikon & warna tetap per kode program (BUKAN dirotasi/acak) — supaya 1 program selalu sama
 * tampilannya di seluruh aplikasi, dan gampang dihafal guru/admin. */
export const IKON_PROGRAM: Record<string, LucideIcon> = {
  ING: BookOpen,
  ARB: Languages,
  THF: BookOpenText,
  AGM: Sparkles,
  "KSM-MAT": Calculator,
  "KSM-IPA": FlaskConical,
  "KSM-IPS": Globe2,
  "RST-AGM": Trophy,
  "RST-HUM": Users,
  "RST-SNS": Microscope,
};

export const WARNA_PROGRAM: Record<string, WarnaProgram> = {
  ING: { bg: "bg-emerald-100", text: "text-emerald-700", ring: "bg-emerald-600" },
  ARB: { bg: "bg-purple-100", text: "text-purple-700", ring: "bg-purple-600" },
  THF: { bg: "bg-sky-100", text: "text-sky-700", ring: "bg-sky-600" },
  AGM: { bg: "bg-amber-100", text: "text-amber-700", ring: "bg-amber-600" },
  "KSM-MAT": { bg: "bg-orange-100", text: "text-orange-700", ring: "bg-orange-600" },
  "KSM-IPA": { bg: "bg-violet-100", text: "text-violet-700", ring: "bg-violet-600" },
  "KSM-IPS": { bg: "bg-pink-100", text: "text-pink-700", ring: "bg-pink-600" },
  "RST-AGM": { bg: "bg-fuchsia-100", text: "text-fuchsia-700", ring: "bg-fuchsia-600" },
  "RST-HUM": { bg: "bg-blue-100", text: "text-blue-700", ring: "bg-blue-600" },
  "RST-SNS": { bg: "bg-teal-100", text: "text-teal-700", ring: "bg-teal-600" },
};
