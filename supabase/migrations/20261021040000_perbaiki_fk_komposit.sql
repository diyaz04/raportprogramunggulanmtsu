-- Perbaikan: PostgREST (API Supabase) TIDAK BISA meng-embed lewat foreign key komposit
-- (mis. `foreign key (kelas_id, periode_id) references kelas (id, periode_id)`), jadi
-- query seperti `kelas_siswa(count)` atau `kelompok:kelompok_id(nama)` gagal dengan error
-- "Could not find a relationship ... in the schema cache".
--
-- Perbaikannya: FK jadi kolom tunggal biasa (kelas_id -> kelas.id, kelompok_id -> kelompok_program.id),
-- konsistensi periode/program yang tadinya dijamin FK komposit sekarang dijaga lewat trigger.
-- Jalankan SETELAH 20261021030000_indikator_template.sql.

-- ===== kelas_siswa: kelas_id jadi FK kolom tunggal, periode_id divalidasi lewat trigger =====
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
    where contype = 'f' and conrelid = 'public.kelas_siswa'::regclass and confrelid = 'public.kelas'::regclass
  loop
    execute format('alter table public.kelas_siswa drop constraint %I', r.conname);
  end loop;
end;
$$;

alter table public.kelas_siswa
  add constraint kelas_siswa_kelas_id_fkey foreign key (kelas_id) references public.kelas (id) on delete cascade;

create function public.cek_kelas_siswa_periode()
returns trigger
language plpgsql
set search_path = ''
as $$
declare v_periode_id uuid;
begin
  select periode_id into v_periode_id from public.kelas where id = new.kelas_id;

  if not found then
    raise exception 'Kelas tidak ditemukan';
  end if;
  if v_periode_id <> new.periode_id then
    raise exception 'Kelas tersebut bukan milik periode baris ini';
  end if;

  return new;
end;
$$;

create trigger kelas_siswa_cek_periode
  before insert or update on public.kelas_siswa
  for each row execute function public.cek_kelas_siswa_periode();

-- ===== peserta_program & penugasan_guru: kelompok_id jadi FK kolom tunggal =====
do $$
declare r record;
begin
  for r in
    select conname, conrelid::regclass as tbl from pg_constraint
    where contype = 'f'
      and confrelid = 'public.kelompok_program'::regclass
      and conrelid in ('public.peserta_program'::regclass, 'public.penugasan_guru'::regclass)
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
  end loop;
end;
$$;

alter table public.peserta_program
  add constraint peserta_program_kelompok_id_fkey
  foreign key (kelompok_id) references public.kelompok_program (id) on delete set null;

alter table public.penugasan_guru
  add constraint penugasan_guru_kelompok_id_fkey
  foreign key (kelompok_id) references public.kelompok_program (id) on delete cascade;

create function public.cek_kelompok_konsisten()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_program_id uuid;
  v_periode_id uuid;
begin
  if new.kelompok_id is null then
    return new;
  end if;

  select program_id, periode_id into v_program_id, v_periode_id
  from public.kelompok_program where id = new.kelompok_id;

  if not found then
    raise exception 'Kelompok tidak ditemukan';
  end if;
  if v_program_id <> new.program_id or v_periode_id <> new.periode_id then
    raise exception 'Kelompok tersebut bukan milik program/periode baris ini';
  end if;

  return new;
end;
$$;

create trigger peserta_program_cek_kelompok
  before insert or update on public.peserta_program
  for each row execute function public.cek_kelompok_konsisten();

create trigger penugasan_guru_cek_kelompok
  before insert or update on public.penugasan_guru
  for each row execute function public.cek_kelompok_konsisten();

-- Supabase biasanya auto-reload schema cache PostgREST setelah DDL; paksa reload kalau belum.
notify pgrst, 'reload schema';
