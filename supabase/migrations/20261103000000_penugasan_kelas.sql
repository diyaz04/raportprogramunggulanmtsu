-- Migration: Penugasan guru spesifik per kelas & pembatasan hak akses guru per kelas

-- 1. Tambah kolom kelas_id ke tabel penugasan_guru
alter table public.penugasan_guru
  add column if not exists kelas_id uuid;

-- 2. Tambah foreign key ke tabel kelas (komposit dengan periode_id agar konsisten)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'penugasan_guru_kelas_id_fkey'
  ) then
    alter table public.penugasan_guru
      add constraint penugasan_guru_kelas_id_fkey
      foreign key (kelas_id, periode_id)
      references public.kelas (id, periode_id) on delete cascade;
  end if;
end $$;

-- 3. Batasi agar satu penugasan tidak memiliki kelompok_id DAN kelas_id sekaligus
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'penugasan_guru_cakupan_eksklusif'
  ) then
    alter table public.penugasan_guru
      add constraint penugasan_guru_cakupan_eksklusif
      check (not (kelompok_id is not null and kelas_id is not null));
  end if;
end $$;

-- 4. Perbarui index unique
-- Index lama menolak jika kelompok_id is null, sehingga membuat penugasan multi-kelas bentrok
drop index if exists public.penugasan_guru_seluruh_uq;
create unique index if not exists penugasan_guru_seluruh_uq
  on public.penugasan_guru (guru_id, program_id, periode_id)
  where kelompok_id is null and kelas_id is null;

create unique index if not exists penugasan_guru_kelas_uq
  on public.penugasan_guru (guru_id, program_id, periode_id, kelas_id)
  where kelas_id is not null;

create index if not exists penugasan_guru_kelas_idx
  on public.penugasan_guru (kelas_id);

-- 5. Perbarui fungsi guru_bisa_nilai(p_peserta_program_id uuid)
create or replace function public.guru_bisa_nilai(p_peserta_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.peserta_program pp
    join public.penugasan_guru pg
      on pg.program_id = pp.program_id
     and pg.periode_id = pp.periode_id
     and pg.guru_id = (select auth.uid())
     and (
       -- Cakupan 1: Seluruh program
       (pg.kelompok_id is null and pg.kelas_id is null)
       -- Cakupan 2: Spesifik kelompok
       or (pg.kelompok_id is not null and pg.kelompok_id = pp.kelompok_id)
       -- Cakupan 3: Spesifik kelas
       or (
         pg.kelas_id is not null and exists (
           select 1 from public.kelas_siswa ks
           where ks.periode_id = pp.periode_id
             and ks.siswa_id = pp.siswa_id
             and ks.kelas_id = pg.kelas_id
         )
       )
     )
    where pp.id = p_peserta_program_id
  )
$$;
