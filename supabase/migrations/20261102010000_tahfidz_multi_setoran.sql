-- Migration: Izinkan riwayat setoran hafalan tahfidz bertahap tanpa saling menimpa.
-- Menghapus unique constraint (siswa_id, juz, surat_no) pada tahfidz_hafalan.

alter table public.tahfidz_hafalan
  drop constraint if exists tahfidz_hafalan_siswa_id_juz_surat_no_key;

create index if not exists tahfidz_hafalan_siswa_juz_surat_idx
  on public.tahfidz_hafalan (siswa_id, juz, surat_no);
