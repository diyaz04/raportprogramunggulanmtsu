const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** "2026-12-20" -> "20 Desember 2026" (tanpa konversi zona waktu). */
export function formatTanggal(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${BULAN[m - 1]} ${y}`;
}

export const TINGKAT_ROMAWI: Record<number, string> = { 7: "VII", 8: "VIII", 9: "IX" };
