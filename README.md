# Rapor Program Unggulan — MTsS KH. A. Wahab Muhsin Sukahideng

Next.js 16 (App Router) + shadcn/ui + Supabase. Rencana lengkap ada di [PERENCANAAN.md](PERENCANAAN.md).

## Menjalankan

1. **Buat project Supabase** di https://supabase.com, lalu ambil URL dan *publishable key*
   dari *Project Settings → API Keys*.
2. **Salin env**: `copy .env.example .env.local`, lalu isi dua variabelnya.
3. **Jalankan SQL berurutan** di *SQL Editor*: `20261021000000_profiles.sql`, lalu `20261021010000_master_data.sql`
   (periode, kelas, siswa, pengaturan, dan bucket storage logo).
4. **Matikan pendaftaran mandiri**: *Authentication → Sign In / Providers → Allow new users to sign up* = off.
5. **Buat akun admin pertama**: *Authentication → Users → Add user* (isi email + password, centang auto-confirm),
   lalu jalankan SQL bootstrap yang ada di akhir file migrasi untuk menjadikannya `admin` dan `aktif`.
6. `npm install` (jika belum) → `npm run dev` → buka http://localhost:3000.

## Opsional: buat akun guru dari dalam aplikasi

Isi `SUPABASE_SECRET_KEY` di `.env.local` (kunci **secret** dari Project Settings → API Keys). Kunci ini melewati RLS,
hanya dibaca di server, dan **jangan** diberi awalan `NEXT_PUBLIC_`. Tanpa kunci ini, akun tetap bisa dibuat lewat
Supabase → Authentication → Users lalu diaktifkan di menu *Guru & Akun*.

## Catatan teknis

- **Next.js 16** memakai `proxy.ts` (pengganti `middleware.ts`) dan **Cache Components**: membaca sesi/cookies
  wajib di dalam `<Suspense>` (lihat `src/app/(dashboard)/layout.tsx`).
- Otorisasi berlapis: `src/proxy.ts` (cek optimistik) → `src/lib/auth.ts` (Data Access Layer) → **RLS** di database.
- Akun baru otomatis **nonaktif** sampai admin mengaktifkannya.
- Hanya kunci *publishable* yang boleh ada di `NEXT_PUBLIC_*`. Jangan pernah menaruh `service_role` di sana.
