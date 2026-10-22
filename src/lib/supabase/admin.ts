import "server-only";
import { createClient } from "@supabase/supabase-js";

// Kunci rahasia (sb_secret_... atau service_role lama) MELEWATI RLS. Aturan:
// - hanya dibaca di server, jangan pernah memakai awalan NEXT_PUBLIC_
// - hanya dipakai setelah requireRole("admin") lolos
export const adaSecretKey = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY,
);

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("SUPABASE_SECRET_KEY belum diisi di .env.local");

  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
