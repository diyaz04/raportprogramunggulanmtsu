-- Fase 2: rumpun & program, peserta lintas kelas, kelompok, penugasan guru, penanda tangan.
-- Jalankan SETELAH 20261021010000_master_data.sql.

create type public.jenis_program as enum ('standar', 'tahfidz', 'ksm', 'riset');
create type public.bahasa_program as enum ('id', 'en', 'ar');

-- ===== rumpun (pengelompokan di menu/dashboard, bukan unit akses) =====
create table public.rumpun_program (
  id      uuid primary key default gen_random_uuid(),
  kode    text not null unique,
  nama    text not null,
  urutan  smallint not null default 1
);

-- ===== program: unit sebenarnya — punya guru, peserta, dan rapor sendiri =====
create table public.program (
  id                    uuid primary key default gen_random_uuid(),
  rumpun_id             uuid not null references public.rumpun_program (id) on delete restrict,
  kode                  text not null unique,
  nama                  text not null,
  nama_arab             text,
  jenis                 public.jenis_program not null default 'standar',
  bahasa_utama          public.bahasa_program not null default 'id',
  tampilkan_terjemahan  boolean not null default false,
  judul_rapor           text not null,
  urutan                smallint not null default 1,
  kktp                  smallint check (kktp between 0 and 100),
  bobot_hafalan         smallint check (bobot_hafalan between 0 and 100), -- khusus jenis 'tahfidz'
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger program_set_updated_at
  before update on public.program
  for each row execute function public.set_updated_at();

create index program_rumpun_idx on public.program (rumpun_id, urutan);

-- ===== kelompok per program per periode (mis. "Halaqah 1", "English Club A") =====
create table public.kelompok_program (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references public.program (id) on delete cascade,
  periode_id  uuid not null references public.periode (id) on delete cascade,
  nama        text not null,
  created_at  timestamptz not null default now(),
  unique (program_id, periode_id, nama),
  unique (id, program_id, periode_id) -- dipakai FK komposit di peserta_program & penugasan_guru
);

-- ===== peserta: pusat data kepesertaan, lintas kelas, per periode per program =====
create table public.peserta_program (
  id           uuid primary key default gen_random_uuid(),
  periode_id   uuid not null references public.periode (id) on delete cascade,
  program_id   uuid not null references public.program (id) on delete cascade,
  siswa_id     uuid not null references public.siswa (id) on delete cascade,
  kelompok_id  uuid,
  created_at   timestamptz not null default now(),
  unique (periode_id, program_id, siswa_id),
  foreign key (kelompok_id, program_id, periode_id)
    references public.kelompok_program (id, program_id, periode_id) on delete set null
);

create index peserta_program_program_idx on public.peserta_program (program_id, periode_id);

-- ===== penugasan guru: guru boleh ditugaskan ke seluruh program (kelompok_id NULL) atau 1 kelompok =====
create table public.penugasan_guru (
  id           uuid primary key default gen_random_uuid(),
  guru_id      uuid not null references public.profiles (id) on delete cascade,
  program_id   uuid not null references public.program (id) on delete cascade,
  periode_id   uuid not null references public.periode (id) on delete cascade,
  kelompok_id  uuid,
  created_at   timestamptz not null default now(),
  foreign key (kelompok_id, program_id, periode_id)
    references public.kelompok_program (id, program_id, periode_id) on delete cascade
);

-- Unique parsial (bukan UNIQUE biasa) karena NULL dianggap beda di constraint UNIQUE standar.
create unique index penugasan_guru_seluruh_uq
  on public.penugasan_guru (guru_id, program_id, periode_id) where kelompok_id is null;
create unique index penugasan_guru_kelompok_uq
  on public.penugasan_guru (guru_id, program_id, periode_id, kelompok_id) where kelompok_id is not null;

create index penugasan_guru_program_idx on public.penugasan_guru (program_id, periode_id);

-- ===== penanda tangan: 1–3 guru per program per periode, urutan 1–3 (maks 3 dijamin oleh unique urutan) =====
create table public.penanda_tangan (
  id             uuid primary key default gen_random_uuid(),
  program_id     uuid not null references public.program (id) on delete cascade,
  periode_id     uuid not null references public.periode (id) on delete cascade,
  guru_id        uuid not null references public.profiles (id) on delete cascade,
  label_jabatan  text not null default 'Guru Program',
  urutan         smallint not null check (urutan between 1 and 3),
  created_at     timestamptz not null default now(),
  unique (program_id, periode_id, guru_id),
  unique (program_id, periode_id, urutan)
);

-- ===== RLS =====
alter table public.rumpun_program  enable row level security;
alter table public.program         enable row level security;
alter table public.kelompok_program enable row level security;
alter table public.peserta_program  enable row level security;
alter table public.penugasan_guru   enable row level security;
alter table public.penanda_tangan   enable row level security;

do $$
declare t text;
begin
  -- Baca: semua pengguna aktif (guru perlu melihat program & peserta lain untuk konteks dashboard).
  foreach t in array array[
    'rumpun_program', 'program', 'kelompok_program', 'peserta_program', 'penugasan_guru', 'penanda_tangan'
  ] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.app_role() is not null)',
      t || ': baca (pengguna aktif)', t);
  end loop;

  -- Tulis rumpun & program: admin saja (data struktural, mirip kelas/periode).
  foreach t in array array['rumpun_program', 'program'] loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.app_role() = ''admin'') with check (public.app_role() = ''admin'')',
      t || ': admin kelola', t);
  end loop;

  -- Tulis peserta/kelompok/penugasan/penanda tangan: admin & koordinator (mengatur peserta tiap periode).
  foreach t in array array['kelompok_program', 'peserta_program', 'penugasan_guru', 'penanda_tangan'] loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.app_role() in (''admin'', ''koordinator'')) with check (public.app_role() in (''admin'', ''koordinator''))',
      t || ': admin & koordinator kelola', t);
  end loop;
end;
$$;

-- ===== Seed: 6 rumpun, 10 program =====
insert into public.rumpun_program (kode, nama, urutan) values
  ('ING', 'Bahasa Inggris', 1),
  ('ARB', 'Bahasa Arab', 2),
  ('THF', 'Tahfidz', 3),
  ('AGM', 'Keagamaan', 4),
  ('KSM', 'KSM', 5),
  ('RST', 'Riset', 6);

insert into public.program (rumpun_id, kode, nama, nama_arab, jenis, bahasa_utama, tampilkan_terjemahan, judul_rapor, urutan, bobot_hafalan)
select r.id, v.kode, v.nama, v.nama_arab, v.jenis::public.jenis_program, v.bahasa_utama::public.bahasa_program, v.tampilkan_terjemahan, v.judul_rapor, v.urutan, v.bobot_hafalan
from (values
  ('ING',      'ING',     'Bahasa Inggris',   null,                 'standar', 'en', true,  'Program Unggulan Bahasa Inggris',   1, null::smallint),
  ('ARB',      'ARB',     'Bahasa Arab',       null,                 'standar', 'ar', true,  'Program Unggulan Bahasa Arab',       1, null::smallint),
  ('THF',      'THF',     'Tahfidz Al-Qur''an', null,                 'tahfidz', 'id', false, 'Program Unggulan Tahfidz Al-Qur''an', 1, 60::smallint),
  ('AGM',      'AGM',     'Keagamaan',         null,                 'standar', 'id', false, 'Program Unggulan Keagamaan',         1, null::smallint),
  ('KSM',      'KSM-MAT', 'KSM Matematika',    null,                 'ksm',     'id', false, 'KSM — Matematika',                   1, null::smallint),
  ('KSM',      'KSM-IPA', 'KSM IPA',           null,                 'ksm',     'id', false, 'KSM — IPA',                          2, null::smallint),
  ('KSM',      'KSM-IPS', 'KSM IPS',           null,                 'ksm',     'id', false, 'KSM — IPS',                          3, null::smallint),
  ('RST',      'RST-AGM', 'Riset Keagamaan',   null,                 'riset',   'id', false, 'Riset — Keagamaan',                  1, null::smallint),
  ('RST',      'RST-HUM', 'Riset Humaniora',   null,                 'riset',   'id', false, 'Riset — Humaniora',                  2, null::smallint),
  ('RST',      'RST-SNS', 'Riset Sains',       null,                 'riset',   'id', false, 'Riset — Sains',                      3, null::smallint)
) as v(rumpun_kode, kode, nama, nama_arab, jenis, bahasa_utama, tampilkan_terjemahan, judul_rapor, urutan, bobot_hafalan)
join public.rumpun_program r on r.kode = v.rumpun_kode;
