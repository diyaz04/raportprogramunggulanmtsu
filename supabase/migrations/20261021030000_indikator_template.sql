-- Fase 3: skala predikat, indikator (per program per periode), template deskripsi per predikat.
-- Jalankan SETELAH 20261021020000_program.sql.

create type public.predikat_kode as enum ('A', 'B', 'C', 'D', 'SARAN');

-- ===== skala predikat: global (program_id NULL) atau override per program =====
create table public.skala_predikat (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid references public.program (id) on delete cascade, -- NULL = default global
  kode        text not null check (kode in ('A', 'B', 'C', 'D')),
  min         smallint not null check (min between 0 and 100),
  max         smallint not null check (max between 0 and 100 and max >= min),
  label       text not null,
  label_en    text not null,
  label_ar    text not null
);

-- NULL dianggap beda di UNIQUE biasa, jadi dipisah jadi 2 index parsial.
create unique index skala_predikat_global_uq on public.skala_predikat (kode) where program_id is null;
create unique index skala_predikat_program_uq on public.skala_predikat (program_id, kode) where program_id is not null;

-- ===== indikator: terikat ke program + periode (klon manual tiap semester lewat aplikasi) =====
create table public.indikator (
  id               uuid primary key default gen_random_uuid(),
  program_id       uuid not null references public.program (id) on delete cascade,
  periode_id       uuid not null references public.periode (id) on delete cascade,
  nama             text not null,
  nama_terjemahan  text,
  nama_arab        text,
  keterangan       text,
  bobot            smallint not null default 1 check (bobot > 0),
  urutan           smallint not null default 1,
  aktif            boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (program_id, periode_id, nama)
);

create trigger indikator_set_updated_at
  before update on public.indikator
  for each row execute function public.set_updated_at();

create index indikator_program_idx on public.indikator (program_id, periode_id, urutan);

-- ===== template deskripsi: 1 kalimat per indikator x predikat (A/B/C/D) + 1 saran tindak lanjut =====
create table public.template_deskripsi (
  id               uuid primary key default gen_random_uuid(),
  indikator_id     uuid not null references public.indikator (id) on delete cascade,
  predikat_kode    public.predikat_kode not null,
  teks             text,
  teks_terjemahan  text,
  updated_at       timestamptz not null default now(),
  unique (indikator_id, predikat_kode)
);

create trigger template_deskripsi_set_updated_at
  before update on public.template_deskripsi
  for each row execute function public.set_updated_at();

-- ===== Guru hanya boleh kelola indikator/template program yang ditugaskan padanya =====
create function public.guru_ditugaskan(p_program_id uuid, p_periode_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.penugasan_guru
    where program_id = p_program_id and periode_id = p_periode_id and guru_id = (select auth.uid())
  )
$$;

revoke execute on function public.guru_ditugaskan(uuid, uuid) from public, anon;
grant execute on function public.guru_ditugaskan(uuid, uuid) to authenticated;

-- ===== RLS =====
alter table public.skala_predikat    enable row level security;
alter table public.indikator         enable row level security;
alter table public.template_deskripsi enable row level security;

create policy "skala_predikat: baca (pengguna aktif)" on public.skala_predikat
  for select to authenticated using (public.app_role() is not null);

create policy "skala_predikat: admin kelola" on public.skala_predikat
  for all to authenticated
  using (public.app_role() = 'admin')
  with check (public.app_role() = 'admin');

create policy "indikator: baca (pengguna aktif)" on public.indikator
  for select to authenticated using (public.app_role() is not null);

create policy "indikator: admin, koordinator & guru ditugaskan kelola" on public.indikator
  for all to authenticated
  using (
    public.app_role() in ('admin', 'koordinator')
    or (public.app_role() = 'guru' and public.guru_ditugaskan(program_id, periode_id))
  )
  with check (
    public.app_role() in ('admin', 'koordinator')
    or (public.app_role() = 'guru' and public.guru_ditugaskan(program_id, periode_id))
  );

create policy "template_deskripsi: baca (pengguna aktif)" on public.template_deskripsi
  for select to authenticated using (public.app_role() is not null);

create policy "template_deskripsi: admin, koordinator & guru ditugaskan kelola" on public.template_deskripsi
  for all to authenticated
  using (
    public.app_role() in ('admin', 'koordinator')
    or (
      public.app_role() = 'guru'
      and exists (
        select 1 from public.indikator i
        where i.id = indikator_id and public.guru_ditugaskan(i.program_id, i.periode_id)
      )
    )
  )
  with check (
    public.app_role() in ('admin', 'koordinator')
    or (
      public.app_role() = 'guru'
      and exists (
        select 1 from public.indikator i
        where i.id = indikator_id and public.guru_ditugaskan(i.program_id, i.periode_id)
      )
    )
  );

-- ===== Seed: skala predikat global default (A-D) =====
insert into public.skala_predikat (program_id, kode, min, max, label, label_en, label_ar) values
  (null, 'A', 90, 100, 'Sangat Baik',       'Excellent',          'ممتاز (Mumtaz)'),
  (null, 'B', 80, 89,  'Baik',              'Good',               'جيد جدا (Jayyid Jiddan)'),
  (null, 'C', 70, 79,  'Cukup',             'Fair',               'جيد (Jayyid)'),
  (null, 'D', 0,  69,  'Perlu Bimbingan',   'Needs Improvement',  'مقبول (Maqbul)');
