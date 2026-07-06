import { describe, expect, it } from "vitest";
import {
  resolveInspectionPersona,
  shouldScopeRequestsToPlatformUser,
  visibleNavKeys,
} from "./resolve-inspection-persona";
import {
  INSPECTION_HEADER_INSPECTION_ROLE,
  INSPECTION_HEADER_USER_ID,
  INSPECTION_HEADER_VERIFIED,
} from "./inspection-headers";
import {
  INSPECTION_DASM_USER_COOKIE,
  INSPECTION_UI_ROLE_COOKIE,
} from "@/lib/cookies/inspection-gateway";

function cookiesFrom(entries: Record<string, string>) {
  return {
    get(name: string) {
      const v = entries[name];
      return v !== undefined ? { value: v } : undefined;
    },
  };
}

describe("resolveInspectionPersona", () => {
  it("prefers verified JWT inspection role", () => {
    const h = new Headers();
    h.set(INSPECTION_HEADER_VERIFIED, "1");
    h.set(INSPECTION_HEADER_INSPECTION_ROLE, "inspector");
    h.set(INSPECTION_HEADER_USER_ID, "user-1");
    const c = cookiesFrom({});
    const r = resolveInspectionPersona(h, c as never);
    expect(r.persona).toBe("inspector");
    expect(r.platformUserId).toBe("user-1");
    expect(r.trust).toBe("jwt");
    expect(shouldScopeRequestsToPlatformUser(r)).toBe(false);
  });

  it("uses gateway cookie hint for dasm_user", () => {
    const h = new Headers();
    const c = cookiesFrom({
      [INSPECTION_UI_ROLE_COOKIE]: "dasm_user",
      [INSPECTION_DASM_USER_COOKIE]: "dasm-42",
    });
    const r = resolveInspectionPersona(h, c as never);
    expect(r.persona).toBe("dasm_user");
    expect(r.platformUserId).toBe("dasm-42");
    expect(r.trust).toBe("gateway_cookie");
    expect(shouldScopeRequestsToPlatformUser(r)).toBe(true);
  });

  it("falls back to unknown", () => {
    const r = resolveInspectionPersona(new Headers(), cookiesFrom({}) as never);
    expect(r.persona).toBe("unknown");
    expect(visibleNavKeys(r.persona).has("subscription")).toBe(true);
  });

  it("hides subscription from inspector nav", () => {
    const keys = visibleNavKeys("inspector");
    expect(keys.has("subscription")).toBe(false);
    expect(keys.has("requests")).toBe(true);
  });

  it("hides workshop dashboard nav from non-workshop personas", () => {
    for (const p of ["dasm_user", "inspector", "viewer", "unknown"] as const) {
      expect(visibleNavKeys(p).has("workshop_dashboard")).toBe(false);
    }
  });

  it("shows workshop dashboard nav for workshop_owner", () => {
    const keys = visibleNavKeys("workshop_owner");
    expect(keys.has("workshop_dashboard")).toBe(true);
    expect(keys.has("dashboard")).toBe(false);
    expect(keys.has("my_inspections")).toBe(false);
    expect(keys.has("requests")).toBe(true);
  });
});
