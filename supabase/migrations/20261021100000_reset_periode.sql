-- Tombol "Reset Data Periode" di Pengaturan: admin bisa membersihkan SEMUA inputan 1 periode
-- (nilai, rapor termasuk yang sudah terkunci, kehadiran, proyek riset, hafalan tahfidz yang
-- disetor pada periode itu, prestasi yang tercatat pada program periode itu) — biasanya dipakai
-- buat bersih-bersih data uji coba sebelum madrasah mulai pakai aplikasi beneran.
-- SECURITY INVOKER (bukan definer): mengandalkan RLS admin yang sudah ada di tiap tabel,
-- bukan jalan pintas yang melewatinya — jadi kalau suatu saat RLS admin dicabut, fungsi ini
-- otomatis ikut berhenti bekerja juga (bukan lubang keamanan tersendiri).
-- Jalankan SETELAH 20261021090000_leger_polish.sql.

create function public.reset_data_periode(p_periode_id uuid)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_ids uuid[];
  v_nilai int := 0;
  v_rapor int := 0;
  v_kehadiran int := 0;
  v_riset int := 0;
  v_tahfidz int := 0;
  v_prestasi int := 0;
begin
  if public.app_role() <> 'admin' then
    raise exception 'Hanya admin yang boleh mereset data periode';
  end if;

  select array_agg(id) into v_ids from public.peserta_program where periode_id = p_periode_id;

  if v_ids is not null then
    delete from public.nilai where peserta_program_id = any(v_ids);
    get diagnostics v_nilai = row_count;

    delete from public.rapor where peserta_program_id = any(v_ids);
    get diagnostics v_rapor = row_count;

    delete from public.kehadiran_program where peserta_program_id = any(v_ids);
    get diagnostics v_kehadiran = row_count;

    delete from public.riset_proyek where peserta_program_id = any(v_ids);
    get diagnostics v_riset = row_count;
  end if;

  -- Hafalan kumulatif: hanya yang DISETOR pada periode ini yang dihapus, riwayat periode
  -- lain (sebelum/sesudahnya) tetap aman karena tahfidz_hafalan bukan data per-periode.
  delete from public.tahfidz_hafalan where periode_setor_id = p_periode_id;
  get diagnostics v_tahfidz = row_count;

  -- Prestasi tidak punya kolom periode_id sendiri; cakupannya didekati lewat siswa+program
  -- yang terdaftar sebagai peserta pada periode ini.
  delete from public.prestasi pr
  using public.peserta_program pp
  where pp.periode_id = p_periode_id
    and pr.siswa_id = pp.siswa_id
    and pr.program_id = pp.program_id;
  get diagnostics v_prestasi = row_count;

  insert into public.audit_log (siapa, tabel, aksi, data_baru)
  values (
    (select auth.uid()),
    'reset_periode',
    'reset_data_periode',
    jsonb_build_object(
      'periode_id', p_periode_id,
      'nilai', v_nilai, 'rapor', v_rapor, 'kehadiran', v_kehadiran,
      'riset_proyek', v_riset, 'tahfidz_hafalan', v_tahfidz, 'prestasi', v_prestasi
    )
  );

  return jsonb_build_object(
    'nilai', v_nilai, 'rapor', v_rapor, 'kehadiran', v_kehadiran,
    'riset_proyek', v_riset, 'tahfidz_hafalan', v_tahfidz, 'prestasi', v_prestasi
  );
end;
$$;

revoke execute on function public.reset_data_periode(uuid) from public, anon;
grant execute on function public.reset_data_periode(uuid) to authenticated;
