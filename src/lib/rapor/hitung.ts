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

export type ItemHafalanRekap = {
  juz: number;
  surat_no: number;
  ayat_awal: number;
  ayat_akhir: number;
  nilai?: number | null;
};

export type TargetSuratJuz = {
  juz: number;
  surat_no: number;
  ayat_awal: number;
  ayat_akhir: number;
};

export type RekapHafalanResult = {
  juzPenuh: number;
  juzSebagian: number;
  jumlahSurat: number;
  totalAyat: number;
  rataRata: number | null;
};

/** Hitung total ayat unik yang dihafal dengan menggabungkan rentang ayat yang bersambung atau bertumpuk. */
export function hitungTotalAyatUnik(baris: Pick<ItemHafalanRekap, "juz" | "surat_no" | "ayat_awal" | "ayat_akhir">[]): number {
  if (baris.length === 0) return 0;

  const perSurat = new Map<string, { awal: number; akhir: number }[]>();
  for (const b of baris) {
    const key = `${b.juz}_${b.surat_no}`;
    const list = perSurat.get(key) ?? [];
    list.push({ awal: b.ayat_awal, akhir: b.ayat_akhir });
    perSurat.set(key, list);
  }

  let total = 0;
  for (const intervals of perSurat.values()) {
    intervals.sort((a, b) => a.awal - b.awal);
    let curAwal = intervals[0].awal;
    let curAkhir = intervals[0].akhir;

    for (let i = 1; i < intervals.length; i++) {
      const next = intervals[i];
      if (next.awal <= curAkhir + 1) {
        curAkhir = Math.max(curAkhir, next.akhir);
      } else {
        total += curAkhir - curAwal + 1;
        curAwal = next.awal;
        curAkhir = next.akhir;
      }
    }
    total += curAkhir - curAwal + 1;
  }
  return total;
}

/**
 * Rekap kumulatif hafalan: jumlah juz (penuh/sebagian), jumlah surat unik, total ayat unik, rata-rata nilai.
 * Mendukung riwayat setoran hafalan bertahap (potongan ayat/hari) untuk surat yang sama.
 */
export function hitungRekapHafalan(
  baris: ItemHafalanRekap[],
  semuaSuratPerJuz: TargetSuratJuz[],
): RekapHafalanResult {
  const jumlahSurat = new Set(baris.map((b) => b.surat_no)).size;
  const totalAyat = hitungTotalAyatUnik(baris);
  const dinilai = baris.filter((b) => b.nilai != null);
  const rataRata = dinilai.length > 0 ? Math.round(dinilai.reduce((t, b) => t + (b.nilai ?? 0), 0) / dinilai.length) : null;

  // Petakan interval hafalan per (juz, surat_no)
  const hafalanPerJuzSurat = new Map<string, { awal: number; akhir: number }[]>();
  const juzTercatat = new Set<number>();
  for (const b of baris) {
    juzTercatat.add(b.juz);
    const key = `${b.juz}_${b.surat_no}`;
    const list = hafalanPerJuzSurat.get(key) ?? [];
    list.push({ awal: b.ayat_awal, akhir: b.ayat_akhir });
    hafalanPerJuzSurat.set(key, list);
  }

  function apakahSuratJuzPenuh(juz: number, suratNo: number, targetAwal: number, targetAkhir: number): boolean {
    const intervals = hafalanPerJuzSurat.get(`${juz}_${suratNo}`);
    if (!intervals || intervals.length === 0) return false;

    intervals.sort((a, b) => a.awal - b.awal);
    let curAwal = intervals[0].awal;
    let curAkhir = intervals[0].akhir;

    for (let i = 1; i < intervals.length; i++) {
      const next = intervals[i];
      if (next.awal <= curAkhir + 1) {
        curAkhir = Math.max(curAkhir, next.akhir);
      } else {
        if (curAwal <= targetAwal && curAkhir >= targetAkhir) return true;
        curAwal = next.awal;
        curAkhir = next.akhir;
      }
    }
    return curAwal <= targetAwal && curAkhir >= targetAkhir;
  }

  const targetPerJuz = new Map<number, TargetSuratJuz[]>();
  for (const s of semuaSuratPerJuz) {
    const list = targetPerJuz.get(s.juz) ?? [];
    list.push(s);
    targetPerJuz.set(s.juz, list);
  }

  let juzPenuh = 0;
  let juzSebagian = 0;
  for (const juz of juzTercatat) {
    const targetSurat = targetPerJuz.get(juz) ?? [];
    if (targetSurat.length > 0 && targetSurat.every((s) => apakahSuratJuzPenuh(juz, s.surat_no, s.ayat_awal, s.ayat_akhir))) {
      juzPenuh++;
    } else {
      juzSebagian++;
    }
  }

  return { juzPenuh, juzSebagian, jumlahSurat, totalAyat, rataRata };
}
