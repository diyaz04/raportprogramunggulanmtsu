export type IzinAksesGuru = {
  semua: boolean;
  kelompokIds: string[];
  kelasIds: string[];
};

/** Batasi baris ke kelompok yang diizinkan (hasil `getKelompokIzinGuru`) — dipakai di halaman grid, unduh, dan import. */
export function filterBarisKelompok<T extends { kelompok_id: string | null }>(
  baris: T[],
  kelompokIzin: "semua" | string[],
): T[] {
  return kelompokIzin === "semua"
    ? baris
    : baris.filter((b) => b.kelompok_id !== null && kelompokIzin.includes(b.kelompok_id));
}

/** Batasi baris ke cakupan yang diizinkan untuk guru (kelompok maupun kelas spesifik). */
export function filterBarisIzin<
  T extends { kelompok_id: string | null; kelas_id?: string | null }
>(baris: T[], izin: IzinAksesGuru): T[] {
  if (izin.semua) return baris;
  if (izin.kelompokIds.length === 0 && izin.kelasIds.length === 0) return [];
  return baris.filter((b) => {
    if (b.kelompok_id && izin.kelompokIds.includes(b.kelompok_id)) return true;
    if (b.kelas_id && izin.kelasIds.includes(b.kelas_id)) return true;
    return false;
  });
}
