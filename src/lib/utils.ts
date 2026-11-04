export { cn } from "cn";

/**
 * Mengambil inisial nama guru/pengguna (maks. 2 huruf kapital),
 * membersihkan gelar depan umum seperti Ust., Dr., Drs., H., Hj.
 */
export function inisialNama(nama: string): string {
  const bersih = nama
    .replace(/^([Uu]st(\.?|adz|adzah)|[Dd]r(\.?)|[Dd]rs(\.?)|[Hh]j?(\.?))\s+/i, "")
    .trim();

  const parts = bersih.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
