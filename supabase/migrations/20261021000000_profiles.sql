-- Fase 0: profil pengguna + role + RLS.
-- Jalankan lewat Supabase Dashboard > SQL Editor (atau `supabase db push` jika memakai CLI).

create type public.user_role as enum ('admin', 'koordinator', 'guru', 'kepala');

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nama        text not null,
  nip         text,
  role        public.user_role not null default 'guru',
  -- Akun baru NONAKTIF sampai admin mengaktifkan, jadi pendaftaran mandiri tidak memberi akses.
  aktif       boolean not null default false,
  ttd_url     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Role pengguna saat ini (security definer supaya policy RLS tidak rekursif).
create function public.app_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid()) and aktif
$$;

revoke execute on function public.app_role() from public, anon;
grant execute on function public.app_role() to authenticated;

-- Setiap akun auth baru otomatis mendapat profil (nonaktif, role guru).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nama)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nama', ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;

-- Pengguna boleh membaca profilnya sendiri (termasuk yang masih nonaktif, supaya bisa dicek aplikasi).
create policy "profiles: baca milik sendiri"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

-- Admin aktif boleh melihat dan mengelola semua profil.
create policy "profiles: admin kelola semua"
  on public.profiles for all
  to authenticated
  using (public.app_role() = 'admin')
  with check (public.app_role() = 'admin');

-- Pengguna biasa TIDAK punya policy update/insert/delete, jadi tidak bisa menaikkan role sendiri.

/*
  Bootstrap admin pertama (jalankan SEKALI setelah membuat akun di Authentication > Users):

  update public.profiles
     set role = 'admin', aktif = true, nama = 'Nama Anda'
   where id = (select id from auth.users where email = 'email-anda@contoh.sch.id');
*/
