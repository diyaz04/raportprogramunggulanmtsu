-- Halaman login & verifikasi publik perlu nampilin identitas madrasah (nama, kota, logo) TANPA
-- login, tapi RLS pengaturan sebelumnya mengharuskan app_role() is not null (harus login).
-- Logo di Storage sendiri sudah publik (lihat 20261021010000_master_data.sql) — ini cuma
-- membuka baris `pengaturan` (nama/alamat/kota/kepala/URL logo) ke peran `anon`, yang memang
-- sudah tercetak di tiap rapor & QR verifikasi, jadi bukan data rahasia.
-- Jalankan SETELAH 20261021100000_reset_periode.sql.

create policy "pengaturan: baca publik (anon)" on public.pengaturan
  for select to anon using (true);
