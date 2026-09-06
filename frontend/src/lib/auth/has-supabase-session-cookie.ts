/** Supabase SSR stores the session in sb-<project-ref>-auth-token cookies. */
export function hasSupabaseSessionCookie(cookieNames: readonly string[]): boolean {
  return cookieNames.some(
    (name) => name.startsWith("sb-") && name.includes("-auth-token")
  );
}
