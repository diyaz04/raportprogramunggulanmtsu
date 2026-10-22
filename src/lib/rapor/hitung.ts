// Perhitungan nilai akhir, predikat, dan urutan periode. Modul murni (tanpa Next/Supabase),
// supaya gampang di-unit-test — sama seperti src/lib/deskripsi/engine.ts (Fase 4).

export type PeriodeRingkas = { id: string; tahun_ajaran: string; semester: "ganjil" | "genap" };

/** Kunci urut periode: tahun ajaran lalu semester (ganjil < genap dalam tahun ajaran yang sama). */
function kunciUrutanPeriode(p: PeriodeRingkas): string {
  return `${p.tahun_ajaran}-${p.semester === "ganjil" ? 0 : 1}`;
}

/** Peta periode_id -> indeks urut (0 = paling lama). Dipakai buat cek "disetor sampai periode X". */
export function buatIndeksPeriode(semuaPeriode: PeriodeRingkas[]): Map<string, number> {
  const terurut = [...semuaPeriode].sort((a, b) => kunciUrutanPeriode(a).localeCompare(kunciUrutanPeriode(b)));
  return new Map(terurut.map((p, i) => [p.id, i]));
}

/** nilai akhir program standar: rata-rata berbobot dari nilai tiap indikator (bobot default sama = 1). */
export function hitungNilaiAkhirStandar(nilaiBerbobot: { nilai: number; bobot: number }[]): number | null {
  if (nilaiBerbobot.length === 0) return null;
  const totalBobot = nilaiBerbobot.reduce((t, n) => t + n.bobot, 0);
  if (totalBobot === 0) return null;
  const totalNilai = nilaiBerbobot.reduce((t, n) => t + n.nilai * n.bobot, 0);
  return Math.round(totalNilai / totalBobot);
}

/** nilai akhir Tahfidz = bobotHafalan% * rata-rata hafalan + sisanya * rata-rata indikator kualitas (PERENCANAAN §2.3). */
export function hitungNilaiAkhirTahfidz(
  rataRataHafalan: number | null,
  rataRataKualitas: number | null,
  bobotHafalan: number,
): number | null {
  if (rataRataHafalan == null || rataRataKualitas == null) return null;
  const w = bobotHafalan / 100;
  return Math.round(rataRataHafalan * w + rataRataKualitas * (1 - w));
}
