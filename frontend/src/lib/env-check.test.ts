import { describe, it, expect } from "vitest";
import { findMissingCriticalEnv, CRITICAL_ENV } from "./env-check";

const FULL = {
  NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "svc",
  DASM_INSPECTION_INTERNAL_PULL_TOKEN: "tok",
  DASM_GATEWAY_API_KEYS: "k1,k2",
};

describe("findMissingCriticalEnv", () => {
  it("returns empty when all critical vars are present", () => {
    expect(findMissingCriticalEnv(FULL)).toEqual([]);
  });

  it("accepts either publishable or anon key for the browser key", () => {
    expect(
      findMissingCriticalEnv({
        ...FULL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: "pub",
      })
    ).toEqual([]);
  });

  it("flags a missing critical var (and treats blank as missing)", () => {
    const missing = findMissingCriticalEnv({
      ...FULL,
      DASM_INSPECTION_INTERNAL_PULL_TOKEN: "  ",
    });
    expect(missing).toContain("DASM_INSPECTION_INTERNAL_PULL_TOKEN");
  });

  it("reports both browser-key alternatives when neither is set", () => {
    const missing = findMissingCriticalEnv({
      ...FULL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
    });
    expect(missing.some((m) => m.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY"))).toBe(true);
  });

  it("covers exactly the declared critical specs", () => {
    expect(findMissingCriticalEnv({}).length).toBe(CRITICAL_ENV.length);
  });
});
