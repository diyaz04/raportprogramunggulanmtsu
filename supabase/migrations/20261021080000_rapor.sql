-- Fase 7: rapor per peserta x program — alur draft -> review -> disetujui -> terkunci (snapshot).
-- Perhitungan nilai akhir/predikat & kode_verifikasi/QR dibuat di aplikasi (TypeScript, lib/rapor/),
-- bukan fungsi Postgres — supaya bisa di-unit-test sama seperti mesin deskripsi (Fase 4), dan karena
-- hasilnya langsung ditulis ke kolom `nilai_akhir`/`predikat` di sini, jadi tetap 1 sumber kebenaran
-- (ditulis sekali saat draft dibuat/diperbarui, bukan dihitung ulang berkali-kali di tempat berbeda).
-- Jalankan SETELAH 20261021071000_tahfidz_seed.sql.

create type public.status_rapor as enum ('draft', 'review', 'disetujui', 'terkunci');

alter table public.pengaturan
  add column watermark_aktif boolean not null default true,
  add column watermark_teks text not null default '* MTsS KH. A. Wahab Muhsin Sukahideng *';

create table public.rapor (
  id                        uuid primary key default gen_random_uuid(),
  peserta_program_id        uuid not null unique references public.peserta_program (id) on delete cascade,
  nilai_akhir               smallint check (nilai_akhir between 0 and 100),
  predikat                  text check (predikat in ('A', 'B', 'C', 'D')),
  catatan_auto              text,
  catatan_auto_terjemahan   text,
  catatan_final             text,
  catatan_final_terjemahan  text,
  diedit_manual             boolean not null default false,
  status                    public.status_rapor not null default 'draft',
  kode_verifikasi           text unique,
  snapshot                  jsonb,
  disetujui_oleh            uuid references public.profiles (id),
  dikunci_oleh              uuid references public.profiles (id),
  diterbitkan_at            timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create trigger rapor_set_updated_at
  before update on public.rapor
  for each row execute function public.set_updated_at();

create index rapor_status_idx on public.rapor (status);

alter table public.rapor enable row level security;

create policy "rapor: baca (pengguna aktif)" on public.rapor
  for select to authenticated using (public.app_role() is not null);

-- Siapa boleh apa, tergantung status BARIS SAAT INI (using = baris lama, with check = baris baru):
--  - admin         : bebas kapan saja.
--  - koordinator   : bebas selama baris belum terkunci (termasuk langkah penguncian itu sendiri —
--                    "memfinalkan rapor" per PERENCANAAN.md §6), tapi tidak bisa menyentuh yang sudah terkunci.
--  - kepala        : hanya saat draf diajukan (review) atau sudah disetujui — menyetujui lalu mengunci.
--  - guru          : hanya saat draft/review, dan hanya untuk peserta yang ditugaskan padanya.
create policy "rapor: kelola sesuai status & role" on public.rapor
  for all to authenticated
  using (
    public.app_role() = 'admin'
    or (public.app_role() = 'koordinator' and status <> 'terkunci')
    or (public.app_role() = 'kepala' and status in ('review', 'disetujui'))
    or (public.app_role() = 'guru' and status in ('draft', 'review') and public.guru_bisa_nilai(peserta_program_id))
  )
  with check (
    public.app_role() = 'admin'
    or public.app_role() = 'koordinator'
    or (public.app_role() = 'kepala' and status in ('disetujui', 'terkunci'))
    or (public.app_role() = 'guru' and status in ('draft', 'review') and public.guru_bisa_nilai(peserta_program_id))
  );
