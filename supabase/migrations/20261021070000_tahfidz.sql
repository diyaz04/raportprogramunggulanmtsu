-- Fase 6b: master data Al-Qur'an (seed di migrasi terpisah 20261021071000) + hafalan tahfidz.
-- Hafalan KUMULATIF: melekat ke siswa, bukan ke periode/peserta_program (lihat PERENCANAAN §2.3, §7).
-- Jalankan SETELAH 20261021060000_modul_khusus.sql.

-- ===== Master data Al-Qur'an (seed sekali, read-only dari aplikasi) =====
create table public.quran_surat (
  no          smallint primary key check (no between 1 and 114),
  nama_latin  text not null,
  nama_arab   text not null,
  jumlah_ayat smallint not null check (jumlah_ayat > 0)
);

-- Satu surat lintas-juz punya beberapa baris di sini (1 per juz yang memuatnya),
-- dengan rentang ayat KHUSUS untuk juz itu.
create table public.quran_juz_surat (
  id          uuid primary key default gen_random_uuid(),
  juz         smallint not null check (juz between 1 and 30),
  surat_no    smallint not null references public.quran_surat (no),
  ayat_awal   smallint not null check (ayat_awal > 0),
  ayat_akhir  smallint not null check (ayat_akhir >= ayat_awal),
  unique (juz, surat_no)
);

create index quran_juz_surat_surat_idx on public.quran_juz_surat (surat_no);

-- ===== Hafalan per surat (kumulatif per siswa) =====
create table public.tahfidz_hafalan (
  id                uuid primary key default gen_random_uuid(),
  siswa_id          uuid not null references public.siswa (id) on delete cascade,
  juz               smallint not null check (juz between 1 and 30),
  surat_no          smallint not null references public.quran_surat (no),
  ayat_awal         smallint not null check (ayat_awal > 0),
  ayat_akhir        smallint not null check (ayat_akhir >= ayat_awal),
  nilai             smallint check (nilai between 0 and 100), -- NULL = sudah dicatat, belum dinilai (mis. hasil "Tambah 1 juz penuh")
  periode_setor_id  uuid not null references public.periode (id),
  catatan           text,
  updated_by        uuid references public.profiles (id),
  updated_at        timestamptz not null default now(),
  unique (siswa_id, juz, surat_no)
);

create index tahfidz_hafalan_siswa_idx on public.tahfidz_hafalan (siswa_id);

-- Rentang ayat harus berada DI DALAM batas juz untuk surat itu (boleh sebagian, utk hafalan belum penuh).
create function public.cek_rentang_ayat_tahfidz()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_awal smallint;
  v_akhir smallint;
begin
  select ayat_awal, ayat_akhir into v_awal, v_akhir
  from public.quran_juz_surat where juz = new.juz and surat_no = new.surat_no;

  if not found then
    raise exception 'Surat % tidak terdaftar di juz %', new.surat_no, new.juz;
  end if;
  if new.ayat_awal < v_awal or new.ayat_akhir > v_akhir then
    raise exception 'Rentang ayat di luar batas juz % untuk surat ini (% sampai %)', new.juz, v_awal, v_akhir;
  end if;

  new.updated_by := (select auth.uid());
  new.updated_at := now();
  return new;
end;
$$;

create trigger tahfidz_hafalan_cek_rentang
  before insert or update on public.tahfidz_hafalan
  for each row execute function public.cek_rentang_ayat_tahfidz();

-- Guru boleh catat/nilai hafalan siswa ini kalau siswa ikut Tahfidz di periode AKTIF dan guru
-- ditugaskan ke Tahfidz (seluruh program, atau khusus kelompok tempat siswa itu berada).
create function public.guru_bisa_tahfidz(p_siswa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.program thf
    join public.periode per on per.aktif
    join public.peserta_program pp
      on pp.program_id = thf.id and pp.periode_id = per.id and pp.siswa_id = p_siswa_id
    join public.penugasan_guru pg
      on pg.program_id = thf.id and pg.periode_id = per.id and pg.guru_id = (select auth.uid())
     and (pg.kelompok_id is null or pg.kelompok_id = pp.kelompok_id)
    where thf.kode = 'THF'
  )
$$;

revoke execute on function public.guru_bisa_tahfidz(uuid) from public, anon;
grant execute on function public.guru_bisa_tahfidz(uuid) to authenticated;

-- ===== RLS =====
alter table public.quran_surat     enable row level security;
alter table public.quran_juz_surat enable row level security;
alter table public.tahfidz_hafalan enable row level security;

create policy "quran_surat: baca (pengguna aktif)" on public.quran_surat
  for select to authenticated using (public.app_role() is not null);
create policy "quran_surat: admin kelola" on public.quran_surat
  for all to authenticated using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

create policy "quran_juz_surat: baca (pengguna aktif)" on public.quran_juz_surat
  for select to authenticated using (public.app_role() is not null);
create policy "quran_juz_surat: admin kelola" on public.quran_juz_surat
  for all to authenticated using (public.app_role() = 'admin') with check (public.app_role() = 'admin');

create policy "tahfidz_hafalan: baca (pengguna aktif)" on public.tahfidz_hafalan
  for select to authenticated using (public.app_role() is not null);

create policy "tahfidz_hafalan: admin, koordinator & guru ditugaskan kelola" on public.tahfidz_hafalan
  for all to authenticated
  using (public.app_role() in ('admin', 'koordinator') or (public.app_role() = 'guru' and public.guru_bisa_tahfidz(siswa_id)))
  with check (public.app_role() in ('admin', 'koordinator') or (public.app_role() = 'guru' and public.guru_bisa_tahfidz(siswa_id)));
