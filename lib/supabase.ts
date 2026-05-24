import { createClient } from "@supabase/supabase-js";

type SupabaseClient = ReturnType<typeof createClient>;
const g = globalThis as unknown as { _supabase?: SupabaseClient };

export function getSupabase(): SupabaseClient {
  if (g._supabase) return g._supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set");
  g._supabase = createClient(url, key);
  return g._supabase;
}
