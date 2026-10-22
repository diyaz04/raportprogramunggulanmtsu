// Kunci publishable (sb_publishable_...) aman dipakai di browser. Kunci "anon" lama (JWT)
// juga bisa ditaruh di variabel yang sama.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  url && key && url.startsWith("http") && !url.includes("your-project"),
);

export function getSupabaseEnv() {
  if (!url || !key) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY di .env.local",
    );
  }
  return { url, key };
}
