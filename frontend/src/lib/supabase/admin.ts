import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function requireAdminClient(): SupabaseClient {
  const c = getAdminClient();
  if (!c) {
    throw new Error(
      "Supabase غير مهيأ: عيّن NEXT_PUBLIC_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return c;
}

/**
 * Admin client whose every request opts out of Next.js' fetch Data Cache.
 * Required on security-sensitive read paths (e.g. the public tokenized report)
 * where a stale cached row would keep a revoked/unapproved report reachable.
 */
export function getFreshAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
