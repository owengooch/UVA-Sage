import type { ProfileGetResponse } from "@/lib/saved-profile";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

/**
 * Load profile from the server, refreshing the Supabase session once if the first
 * attempt is unauthenticated (common right after sign-in or on a cold navigation).
 */
export async function fetchProfileForBrowserClient(): Promise<{
  ok: boolean;
  status: number;
  data: ProfileGetResponse | null;
}> {
  const url = "/api/profile";
  const get = () => fetch(url, { credentials: "same-origin" });

  let res = await get();
  if (res.status === 401) {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (session) {
      await supabase.auth.refreshSession();
      await new Promise((r) => setTimeout(r, 200));
      res = await get();
    }
  }

  if (!res.ok) {
    return { ok: false, status: res.status, data: null };
  }

  const data = (await res.json()) as ProfileGetResponse | { error?: string };
  if (data && typeof data === "object" && "error" in data && data.error) {
    return { ok: false, status: res.status, data: null };
  }

  return { ok: true, status: res.status, data: data as ProfileGetResponse };
}
