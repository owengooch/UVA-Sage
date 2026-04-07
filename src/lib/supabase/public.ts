import { createClient } from "@supabase/supabase-js";

/** Server-side reads using the anon key (requires RLS policies that allow SELECT). */
export const createPublicSupabaseClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");
