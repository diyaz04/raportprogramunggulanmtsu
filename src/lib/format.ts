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

/**
 * "10 menit lalu", dst. HANYA dipanggil setelah data-fetch lain (mis. createClient()) di komponen
 * yang sama — itu sudah memicu connection(), jadi subtree-nya sudah dinamis dan new Date() di sini aman
 * dari peringatan "unstable value" Cache Components (lihat catatan di lib/auth.ts & lib/supabase/server.ts).
 */
export function formatWaktuRelatif(iso: string): string {
  const detik = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (detik < 60) return "Baru saja";
  const menit = Math.floor(detik / 60);
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 7) return `${hari} hari lalu`;
  return formatTanggal(iso.slice(0, 10));
}
