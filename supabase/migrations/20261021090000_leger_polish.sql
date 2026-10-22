-- Fase 8: audit_log (jejak perubahan status rapor + unduhan leger) dan RPC publik untuk
-- /verifikasi/[kode] (hanya mengembalikan kolom aman, bukan seluruh isi rapor).
-- Jalankan SETELAH 20261021080000_rapor.sql.

create table public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  siapa      uuid references public.profiles (id),
  tabel      text not null,
  aksi       text not null,
  data_lama  jsonb,
  data_baru  jsonb,
  waktu      timestamptz not null default now()
);

create index audit_log_tabel_idx on public.audit_log (tabel, waktu desc);

alter table public.audit_log enable row level security;

create policy "audit_log: admin baca" on public.audit_log
  for select to authenticated using (public.app_role() = 'admin');

-- Siapa pun boleh mencatat aksinya SENDIRI (tidak bisa memalsukan aksi atas nama orang lain).
create policy "audit_log: catat aksi sendiri" on public.audit_log
  for insert to authenticated with check (siapa = (select auth.uid()));

-- Catat otomatis tiap kali status rapor berubah (draft/review/disetujui/terkunci).
create function public.catat_perubahan_status_rapor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.audit_log (siapa, tabel, aksi, data_lama, data_baru)
    values (
      (select auth.uid()),
      'rapor',
      'ubah_status',
      jsonb_build_object('status', old.status),
      jsonb_build_object('status', new.status, 'peserta_program_id', new.peserta_program_id)
    );
  end if;
  return new;
end;
$$;

create trigger rapor_catat_status
  after update on public.rapor
  for each row execute function public.catat_perubahan_status_rapor();

-- Verifikasi publik: hanya data yang aman ditampilkan ke siapa pun (tanpa login), tidak ada
-- rincian nilai per indikator atau catatan guru. security definer supaya anon bisa baca
-- walau RLS tabel rapor/profiles/dll mengharuskan app_role() is not null.
create function public.verifikasi_rapor(p_kode text)
returns table (
  nama_siswa text,
  nama_program text,
  tahun_ajaran text,
  semester public.semester,
  nilai_akhir smallint,
  predikat text,
  diterbitkan_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.nama, pr.nama, pe.tahun_ajaran, pe.semester, r.nilai_akhir, r.predikat, r.diterbitkan_at
  from public.rapor r
  join public.peserta_program pp on pp.id = r.peserta_program_id
  join public.siswa s on s.id = pp.siswa_id
  join public.program pr on pr.id = pp.program_id
  join public.periode pe on pe.id = pp.periode_id
  where r.kode_verifikasi = p_kode and r.status = 'terkunci'
$$;

grant execute on function public.verifikasi_rapor(text) to anon, authenticated;
