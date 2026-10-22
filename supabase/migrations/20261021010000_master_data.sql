-- Fase 1: master data (periode, kelas, siswa, keanggotaan kelas, pengaturan) + storage logo.
-- Jalankan SETELAH 20261021000000_profiles.sql.

create type public.semester as enum ('ganjil', 'genap');
create type public.jenis_kelamin as enum ('L', 'P');

-- ===== email di profil (agar daftar guru bisa menampilkan email tanpa kunci rahasia) =====
alter table public.profiles add column email text;

update public.profiles p set email = u.email from auth.users u where u.id = p.id;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nama, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'nama', ''), split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

-- ===== periode =====
create table public.periode (
  id            uuid primary key default gen_random_uuid(),
  tahun_ajaran  text not null check (tahun_ajaran ~ '^\d{4}/\d{4}$'),
  semester      public.semester not null,
  aktif         boolean not null default false,
  tanggal_rapor date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (tahun_ajaran, semester)
);

-- Hanya boleh ada satu periode aktif.
create unique index periode_satu_aktif on public.periode (aktif) where aktif;

create trigger periode_set_updated_at
  before update on public.periode
  for each row execute function public.set_updated_at();

-- Mengaktifkan satu periode secara atomik (security invoker: RLS tetap berlaku, hanya admin yang berhasil).
create function public.aktifkan_periode(p_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.periode set aktif = false where aktif and id <> p_id;
  update public.periode set aktif = true where id = p_id;
end;
$$;

revoke execute on function public.aktifkan_periode(uuid) from public, anon;
grant execute on function public.aktifkan_periode(uuid) to authenticated;

-- ===== kelas (per periode) =====
create table public.kelas (
  id          uuid primary key default gen_random_uuid(),
  periode_id  uuid not null references public.periode (id) on delete cascade,
  nama        text not null,
  tingkat     smallint not null check (tingkat between 7 and 9),
  created_at  timestamptz not null default now(),
  unique (periode_id, nama),
  unique (id, periode_id) -- dipakai FK komposit di kelas_siswa
);

-- ===== siswa =====
create table public.siswa (
  id          uuid primary key default gen_random_uuid(),
  nis         text not null unique,
  nisn        text unique,
  nama        text not null,
  nama_arab   text,
  jk          public.jenis_kelamin not null,
  aktif       boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger siswa_set_updated_at
  before update on public.siswa
  for each row execute function public.set_updated_at();

create index siswa_nama_idx on public.siswa (lower(nama));

-- ===== keanggotaan kelas: satu siswa hanya satu kelas per periode =====
create table public.kelas_siswa (
  id          uuid primary key default gen_random_uuid(),
  periode_id  uuid not null,
  kelas_id    uuid not null,
  siswa_id    uuid not null references public.siswa (id) on delete cascade,
  foreign key (kelas_id, periode_id) references public.kelas (id, periode_id) on delete cascade,
  unique (periode_id, siswa_id)
);

create index kelas_siswa_kelas_idx on public.kelas_siswa (kelas_id);

-- ===== pengaturan madrasah (satu baris) =====
create table public.pengaturan (
  id               boolean primary key default true check (id),
  instansi_induk   text not null default 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
  nama_madrasah    text not null default 'MTSS KH.A.WAHAB MUHSIN SUKAHIDENG',
  alamat           text not null default 'JL. MAKAM PAHLAWAN KHZ. MUSTHOFA SUKAMANAH KP. BAGEUR',
  wilayah          text not null default 'Kecamatan Sukarame, Kabupaten Tasikmalaya - Jawa Barat',
  kota             text not null default 'Tasikmalaya',
  kepala_nama      text,
  kepala_nip       text,
  logo_kiri_url    text,
  logo_kanan_url   text,
  updated_at       timestamptz not null default now()
);

insert into public.pengaturan (id) values (true);

create trigger pengaturan_set_updated_at
  before update on public.pengaturan
  for each row execute function public.set_updated_at();

-- ===== RLS: semua pengguna aktif boleh membaca, hanya admin yang menulis =====
alter table public.periode      enable row level security;
alter table public.kelas        enable row level security;
alter table public.siswa        enable row level security;
alter table public.kelas_siswa  enable row level security;
alter table public.pengaturan   enable row level security;

do $$
declare t text;
begin
  foreach t in array array['periode', 'kelas', 'siswa', 'kelas_siswa', 'pengaturan'] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.app_role() is not null)',
      t || ': baca (pengguna aktif)', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.app_role() = ''admin'') with check (public.app_role() = ''admin'')',
      t || ': admin kelola', t);
  end loop;
end;
$$;

-- ===== Storage: bucket publik untuk logo (kop rapor dicetak, jadi logo harus bisa dibuka tanpa login) =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pengaturan', 'pengaturan', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "pengaturan storage: admin tulis"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'pengaturan' and public.app_role() = 'admin')
  with check (bucket_id = 'pengaturan' and public.app_role() = 'admin');
