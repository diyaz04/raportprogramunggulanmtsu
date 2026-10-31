-- Migrasi: Indikator per tingkatan kelas (7, 8, 9, atau NULL untuk semua tingkat).
-- Jalankan SETELAH 20261027120000_tahfidz_tanggal_setor.sql.

-- 1. Tambah kolom tingkat pada tabel indikator
alter table public.indikator
  add column if not exists tingkat smallint check (tingkat between 7 and 9);

-- 2. Hapus unique constraint lama yang hanya mengunci (program_id, periode_id, nama)
alter table public.indikator
  drop constraint if exists indikator_program_id_periode_id_nama_key;

-- 3. Ganti dengan unique index yang menyertakan tingkat (coalesce tingkat NULL menjadi 0)
create unique index if not exists indikator_program_tingkat_nama_uq
  on public.indikator (program_id, periode_id, coalesce(tingkat, 0), nama);

-- 4. Index untuk query cepat per program, periode, tingkat, dan urutan
create index if not exists indikator_program_tingkat_idx
  on public.indikator (program_id, periode_id, tingkat, urutan);

-- 5. Perbarui fungsi cek_nilai_konsisten agar mencegah input nilai indikator tingkat lain
create or replace function public.cek_nilai_konsisten()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_pp_program uuid;
  v_pp_periode uuid;
  v_pp_siswa uuid;
  v_ind_program uuid;
  v_ind_periode uuid;
  v_ind_tingkat smallint;
  v_siswa_tingkat smallint;
begin
  select program_id, periode_id, siswa_id into v_pp_program, v_pp_periode, v_pp_siswa
  from public.peserta_program where id = new.peserta_program_id;
  if not found then
    raise exception 'Peserta tidak ditemukan';
  end if;

  select program_id, periode_id, tingkat into v_ind_program, v_ind_periode, v_ind_tingkat
  from public.indikator where id = new.indikator_id;
  if not found then
    raise exception 'Indikator tidak ditemukan';
  end if;

  if v_pp_program <> v_ind_program or v_pp_periode <> v_ind_periode then
    raise exception 'Indikator tidak sesuai dengan program/periode peserta ini';
  end if;

  if v_ind_tingkat is not null then
    select k.tingkat into v_siswa_tingkat
    from public.kelas_siswa ks
    join public.kelas k on k.id = ks.kelas_id
    where ks.siswa_id = v_pp_siswa and ks.periode_id = v_pp_periode;

    if v_siswa_tingkat is not null and v_siswa_tingkat <> v_ind_tingkat then
      raise exception 'Indikator tingkat % tidak dapat diberikan ke siswa kelas tingkat %', v_ind_tingkat, v_siswa_tingkat;
    end if;
  end if;

  new.updated_by := (select auth.uid());
  new.updated_at := now();
  return new;
end;
$$;
