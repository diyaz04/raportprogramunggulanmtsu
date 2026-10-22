-- Fase 5: input nilai per indikator. RLS guru dibatasi ke program (dan kelompok, kalau
-- penugasannya per kelompok) yang ditugaskan padanya — sama persis dengan yang dicek di aplikasi
-- lewat `bisaNilaiPeserta`, supaya pesan error di UI jelas sebelum ditolak database.
-- Jalankan SETELAH 20261021040000_perbaiki_fk_komposit.sql.

create table public.nilai (
  id                           uuid primary key default gen_random_uuid(),
  peserta_program_id          uuid not null references public.peserta_program (id) on delete cascade,
  indikator_id                uuid not null references public.indikator (id) on delete cascade,
  nilai                        smallint not null check (nilai between 0 and 100),
  capaian_override             text,
  capaian_override_terjemahan  text,
  updated_by                   uuid references public.profiles (id),
  updated_at                   timestamptz not null default now(),
  unique (peserta_program_id, indikator_id)
);

create index nilai_peserta_idx on public.nilai (peserta_program_id);

-- Cegah salah pasang: indikator harus milik program+periode yang sama dengan pesertanya,
-- dan catat siapa yang terakhir mengubah (tidak bisa dipalsukan dari client).
create function public.cek_nilai_konsisten()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_pp_program uuid;
  v_pp_periode uuid;
  v_ind_program uuid;
  v_ind_periode uuid;
begin
  select program_id, periode_id into v_pp_program, v_pp_periode
  from public.peserta_program where id = new.peserta_program_id;
  if not found then
    raise exception 'Peserta tidak ditemukan';
  end if;

  select program_id, periode_id into v_ind_program, v_ind_periode
  from public.indikator where id = new.indikator_id;
  if not found then
    raise exception 'Indikator tidak ditemukan';
  end if;

  if v_pp_program <> v_ind_program or v_pp_periode <> v_ind_periode then
    raise exception 'Indikator tidak sesuai dengan program/periode peserta ini';
  end if;

  new.updated_by := (select auth.uid());
  new.updated_at := now();
  return new;
end;
$$;

create trigger nilai_cek_konsisten
  before insert or update on public.nilai
  for each row execute function public.cek_nilai_konsisten();

-- Guru boleh isi nilai peserta ini kalau ditugaskan ke SELURUH program (kelompok_id null),
-- atau ditugaskan khusus ke kelompok tempat peserta itu berada.
create function public.guru_bisa_nilai(p_peserta_program_id uuid)
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
     and (pg.kelompok_id is null or pg.kelompok_id = pp.kelompok_id)
    where pp.id = p_peserta_program_id
  )
$$;

revoke execute on function public.guru_bisa_nilai(uuid) from public, anon;
grant execute on function public.guru_bisa_nilai(uuid) to authenticated;

alter table public.nilai enable row level security;

create policy "nilai: baca (pengguna aktif)" on public.nilai
  for select to authenticated using (public.app_role() is not null);

create policy "nilai: admin, koordinator & guru ditugaskan kelola" on public.nilai
  for all to authenticated
  using (
    public.app_role() in ('admin', 'koordinator')
    or (public.app_role() = 'guru' and public.guru_bisa_nilai(peserta_program_id))
  )
  with check (
    public.app_role() in ('admin', 'koordinator')
    or (public.app_role() = 'guru' and public.guru_bisa_nilai(peserta_program_id))
  );
