-- Migrasi: Fungsi reset_semua_data untuk membersihkan seluruh data siswa, kelas, dan pembelajaran
-- tanpa menghapus akun pengguna (auth.users), profil guru (profiles), master program, dan pengaturan madrasah.

create or replace function public.reset_semua_data(p_reset_indikator boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_siswa int := 0;
  v_kelas int := 0;
  v_nilai int := 0;
  v_rapor int := 0;
  v_kehadiran int := 0;
  v_riset int := 0;
  v_tahfidz int := 0;
  v_prestasi int := 0;
  v_peserta int := 0;
  v_kelompok int := 0;
  v_indikator int := 0;
  v_template int := 0;
begin
  if public.app_role() <> 'admin' then
    raise exception 'Hanya admin yang boleh mereset semua data';
  end if;

  -- 1. Hapus nilai siswa
  delete from public.nilai;
  get diagnostics v_nilai = row_count;

  -- 2. Hapus rapor
  delete from public.rapor;
  get diagnostics v_rapor = row_count;

  -- 3. Hapus kehadiran modul khusus
  delete from public.kehadiran_program;
  get diagnostics v_kehadiran = row_count;

  -- 4. Hapus proyek riset
  delete from public.riset_proyek;
  get diagnostics v_riset = row_count;

  -- 5. Hapus setoran hafalan tahfidz
  delete from public.tahfidz_hafalan;
  get diagnostics v_tahfidz = row_count;

  -- 6. Hapus prestasi lomba siswa
  delete from public.prestasi;
  get diagnostics v_prestasi = row_count;

  -- 7. Hapus peserta program
  delete from public.peserta_program;
  get diagnostics v_peserta = row_count;

  -- 8. Hapus penempatan kelas siswa
  delete from public.kelas_siswa;

  -- 9. Hapus siswa
  delete from public.siswa;
  get diagnostics v_siswa = row_count;

  -- 10. Hapus rombel kelas
  delete from public.kelas;
  get diagnostics v_kelas = row_count;

  -- 11. Bersihkan kelompok_program dari penugasan_guru agar penugasan guru tetap ada di program secara umum
  delete from public.penugasan_guru
  where kelompok_id is not null
    and exists (
      select 1 from public.penugasan_guru pg2
      where pg2.guru_id = penugasan_guru.guru_id
        and pg2.program_id = penugasan_guru.program_id
        and pg2.periode_id = penugasan_guru.periode_id
        and pg2.kelompok_id is null
    );
  update public.penugasan_guru set kelompok_id = null;

  delete from public.kelompok_program;
  get diagnostics v_kelompok = row_count;

  -- 12. Opsi reset indikator jika p_reset_indikator = true
  if p_reset_indikator then
    delete from public.template_deskripsi;
    get diagnostics v_template = row_count;

    delete from public.indikator;
    get diagnostics v_indikator = row_count;
  end if;

  -- 13. Catat ke audit log
  insert into public.audit_log (siapa, tabel, aksi, data_baru)
  values (
    (select auth.uid()),
    'reset_semua',
    'reset_semua_data',
    jsonb_build_object(
      'siswa', v_siswa,
      'kelas', v_kelas,
      'nilai', v_nilai,
      'rapor', v_rapor,
      'kehadiran', v_kehadiran,
      'riset_proyek', v_riset,
      'tahfidz_hafalan', v_tahfidz,
      'prestasi', v_prestasi,
      'peserta_program', v_peserta,
      'kelompok_program', v_kelompok,
      'indikator', v_indikator,
      'template_deskripsi', v_template
    )
  );

  return jsonb_build_object(
    'siswa', v_siswa,
    'kelas', v_kelas,
    'nilai', v_nilai,
    'rapor', v_rapor,
    'kehadiran', v_kehadiran,
    'riset_proyek', v_riset,
    'tahfidz_hafalan', v_tahfidz,
    'prestasi', v_prestasi,
    'peserta_program', v_peserta,
    'kelompok_program', v_kelompok,
    'indikator', v_indikator,
    'template_deskripsi', v_template
  );
end;
$$;

revoke execute on function public.reset_semua_data(boolean) from public, anon;
grant execute on function public.reset_semua_data(boolean) to authenticated;
