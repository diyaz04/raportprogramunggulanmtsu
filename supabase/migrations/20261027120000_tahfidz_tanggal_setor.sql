-- Tanggal setor per surat (tanggal kalender hafalan itu dicatat/disetorkan), beda dari
-- `periode_setor_id` yang cuma nunjuk semester. Nullable: data lama belum punya tanggalnya,
-- dan nggak di-set otomatis oleh trigger cek_rentang_ayat_tahfidz (itu cuma urus updated_at).
alter table public.tahfidz_hafalan add column tanggal date;
