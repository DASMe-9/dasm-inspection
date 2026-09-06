import { describe, expect, it } from "vitest";
import { hasSupabaseSessionCookie } from "./has-supabase-session-cookie";

describe("hasSupabaseSessionCookie", () => {
  it("skips anonymous and unrelated application cookies", () => {
    expect(hasSupabaseSessionCookie([])).toBe(false);
    expect(hasSupabaseSessionCookie(["theme", "dasm_access_token"])).toBe(false);
  });

  it("recognizes regular and chunked Supabase auth cookies", () => {
    expect(hasSupabaseSessionCookie(["sb-project-auth-token"])).toBe(true);
    expect(hasSupabaseSessionCookie(["sb-project-auth-token.0"])).toBe(true);
  });
});
