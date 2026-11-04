-- Migrasi: Foto guru di profiles & storage bucket foto
-- Menambahkan kolom foto_url ke tabel profiles dan membuat storage bucket untuk foto profil guru

-- 1. Tambah kolom foto_url di profiles jika belum ada
alter table public.profiles add column if not exists foto_url text;

-- 2. Policy agar semua pengguna aktif bisa melihat profil guru lain (khususnya untuk Dewan Guru di Dashboard)
drop policy if exists "profiles: baca sesama aktif" on public.profiles;
create policy "profiles: baca sesama aktif"
  on public.profiles for select
  to authenticated
  using (public.app_role() is not null and aktif);

-- 3. Bucket Storage 'guru' untuk foto profil
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('guru', 'guru', true, 3145728, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update set public = true;

-- 4. RLS Storage Objects untuk bucket 'guru'
drop policy if exists "guru storage: publik baca" on storage.objects;
create policy "guru storage: publik baca"
  on storage.objects for select
  to public
  using (bucket_id = 'guru');

drop policy if exists "guru storage: authenticated tulis" on storage.objects;
create policy "guru storage: authenticated tulis"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'guru');

drop policy if exists "guru storage: authenticated update" on storage.objects;
create policy "guru storage: authenticated update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'guru');

drop policy if exists "guru storage: authenticated delete" on storage.objects;
create policy "guru storage: authenticated delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'guru');
