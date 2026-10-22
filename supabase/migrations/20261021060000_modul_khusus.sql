-- Fase 6a: data khusus tiap program — prestasi (KSM), proyek riset, kehadiran.
-- (Master data Al-Qur'an + hafalan tahfidz ada di migrasi terpisah 20261021070000_tahfidz.sql
-- karena datanya besar dan independen dari modul ini.)
-- Jalankan SETELAH 20261021050000_nilai.sql.

create type public.tingkat_lomba as enum ('madrasah', 'kabupaten', 'provinsi', 'nasional');
create type public.tahap_riset as enum ('proposal', 'pengambilan_data', 'laporan', 'presentasi');

-- ===== Prestasi (riwayat lomba, terutama KSM) — tidak terikat periode =====
create table public.prestasi (
  id          uuid primary key default gen_random_uuid(),
  siswa_id    uuid not null references public.siswa (id) on delete cascade,
  program_id  uuid not null references public.program (id) on delete cascade,
  nama_lomba  text not null,
  tingkat     public.tingkat_lomba not null,
  peringkat   text,
  tanggal     date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger prestasi_set_updated_at
  before update on public.prestasi
  for each row execute function public.set_updated_at();

create index prestasi_siswa_idx on public.prestasi (siswa_id);
create index prestasi_program_idx on public.prestasi (program_id);

-- ===== Proyek riset: 1 baris per peserta per periode =====
create table public.riset_proyek (
  id                  uuid primary key default gen_random_uuid(),
  peserta_program_id  uuid not null unique references public.peserta_program (id) on delete cascade,
  judul               text,
  tahap               public.tahap_riset not null default 'proposal',
  updated_at          timestamptz not null default now()
);

create trigger riset_proyek_set_updated_at
  before update on public.riset_proyek
  for each row execute function public.set_updated_at();

-- ===== Kehadiran pembinaan program: 1 baris per peserta per periode =====
create table public.kehadiran_program (
  id                  uuid primary key default gen_random_uuid(),
  peserta_program_id  uuid not null unique references public.peserta_program (id) on delete cascade,
  hadir               smallint not null default 0 check (hadir >= 0),
  sakit               smallint not null default 0 check (sakit >= 0),
  izin                smallint not null default 0 check (izin >= 0),
  alpa                smallint not null default 0 check (alpa >= 0),
  updated_at          timestamptz not null default now()
);

create trigger kehadiran_program_set_updated_at
  before update on public.kehadiran_program
  for each row execute function public.set_updated_at();

-- ===== Otorisasi guru: prestasi tidak terikat periode, jadi cukup cek guru PERNAH/SEDANG
-- ditugaskan ke program itu (tanpa syarat kelompok, karena prestasi bukan data per-peserta/kelompok). =====
create function public.guru_pegang_program(p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.penugasan_guru
    where program_id = p_program_id and guru_id = (select auth.uid())
  )
$$;

revoke execute on function public.guru_pegang_program(uuid) from public, anon;
grant execute on function public.guru_pegang_program(uuid) to authenticated;

-- ===== RLS =====
alter table public.prestasi          enable row level security;
alter table public.riset_proyek      enable row level security;
alter table public.kehadiran_program enable row level security;

create policy "prestasi: baca (pengguna aktif)" on public.prestasi
  for select to authenticated using (public.app_role() is not null);

create policy "prestasi: admin, koordinator & guru pemegang program kelola" on public.prestasi
  for all to authenticated
  using (public.app_role() in ('admin', 'koordinator') or (public.app_role() = 'guru' and public.guru_pegang_program(program_id)))
  with check (public.app_role() in ('admin', 'koordinator') or (public.app_role() = 'guru' and public.guru_pegang_program(program_id)));

create policy "riset_proyek: baca (pengguna aktif)" on public.riset_proyek
  for select to authenticated using (public.app_role() is not null);

-- `guru_bisa_nilai` sudah ada sejak Fase 5: guru boleh kalau ditugaskan ke seluruh program,
-- atau khusus ke kelompok tempat peserta itu berada — batas yang sama persis dipakai di sini.
create policy "riset_proyek: admin, koordinator & guru ditugaskan kelola" on public.riset_proyek
  for all to authenticated
  using (public.app_role() in ('admin', 'koordinator') or (public.app_role() = 'guru' and public.guru_bisa_nilai(peserta_program_id)))
  with check (public.app_role() in ('admin', 'koordinator') or (public.app_role() = 'guru' and public.guru_bisa_nilai(peserta_program_id)));

create policy "kehadiran_program: baca (pengguna aktif)" on public.kehadiran_program
  for select to authenticated using (public.app_role() is not null);

create policy "kehadiran_program: admin, koordinator & guru ditugaskan kelola" on public.kehadiran_program
  for all to authenticated
  using (public.app_role() in ('admin', 'koordinator') or (public.app_role() = 'guru' and public.guru_bisa_nilai(peserta_program_id)))
  with check (public.app_role() in ('admin', 'koordinator') or (public.app_role() = 'guru' and public.guru_bisa_nilai(peserta_program_id)));
