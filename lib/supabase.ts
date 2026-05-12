import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_ANON_KEY!;

const g = globalThis as unknown as { _supabase?: ReturnType<typeof createClient> };
export const supabase = g._supabase ?? createClient(url, key);
if (process.env.NODE_ENV !== "production") g._supabase = supabase;
