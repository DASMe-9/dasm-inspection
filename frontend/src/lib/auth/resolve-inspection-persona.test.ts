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

  it("falls back to unknown (and never exposes workshop financial nav)", () => {
    const r = resolveInspectionPersona(new Headers(), cookiesFrom({}) as never);
    expect(r.persona).toBe("unknown");
    // subscription (B2B workshop tiers) + wallet are workshop/admin only.
    expect(visibleNavKeys(r.persona).has("subscription")).toBe(false);
    expect(visibleNavKeys(r.persona).has("wallet")).toBe(false);
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

  it("shows workshop dashboard + subscription nav for workshop_owner", () => {
    const keys = visibleNavKeys("workshop_owner");
    expect(keys.has("workshop_dashboard")).toBe(true);
    expect(keys.has("subscription")).toBe(true); // workshops need their tiers page
    expect(keys.has("wallet")).toBe(true);
    expect(keys.has("dashboard")).toBe(false);
    expect(keys.has("my_inspections")).toBe(false);
    expect(keys.has("requests")).toBe(true);
  });

  it("customer (dasm_user) nav excludes subscription + wallet (B2B financial)", () => {
    const c = cookiesFrom({
      [INSPECTION_UI_ROLE_COOKIE]: "dasm_user",
      [INSPECTION_DASM_USER_COOKIE]: "319",
    });
    const r = resolveInspectionPersona(new Headers(), c as never);
    const keys = visibleNavKeys(r.persona);
    expect(r.persona).toBe("dasm_user");
    expect(keys.has("subscription")).toBe(false);
    expect(keys.has("wallet")).toBe(false);
    expect(keys.has("requests")).toBe(true);
    expect(keys.has("my_inspections")).toBe(true);
    expect(keys.has("workshops")).toBe(true);
  });

  // Regression guard: without DASM_JWT_ENFORCE every non-dasm_user role used to
  // collapse to "unknown" and get a generic nav. Each role must now resolve
  // from the gateway cookie so it gets its intended nav.
  it.each([
    "inspector",
    "mechanic",
    "workshop_owner",
    "workshop_manager",
    "viewer",
    "inspection_admin",
    "super_admin",
  ] as const)("resolves %s from the gateway cookie (no JWT)", (role) => {
    const c = cookiesFrom({
      [INSPECTION_UI_ROLE_COOKIE]: role,
      [INSPECTION_DASM_USER_COOKIE]: "319",
    });
    const r = resolveInspectionPersona(new Headers(), c as never);
    expect(r.persona).toBe(role);
    expect(r.trust).toBe("gateway_cookie");
    // non-dasm_user personas do not scope requests to a platform user
    expect(shouldScopeRequestsToPlatformUser(r)).toBe(false);
  });

  it("inspector resolved from cookie gets the inspector nav (no الاشتراك/المحفظة)", () => {
    const c = cookiesFrom({
      [INSPECTION_UI_ROLE_COOKIE]: "inspector",
      [INSPECTION_DASM_USER_COOKIE]: "319",
    });
    const r = resolveInspectionPersona(new Headers(), c as never);
    const keys = visibleNavKeys(r.persona);
    expect(r.persona).toBe("inspector");
    expect(keys.has("subscription")).toBe(false);
    expect(keys.has("wallet")).toBe(false);
    expect(keys.has("workshops")).toBe(true);
    expect(keys.has("requests")).toBe(true);
  });

  it("dasm_user without a user id falls back to unknown (cannot scope)", () => {
    const c = cookiesFrom({ [INSPECTION_UI_ROLE_COOKIE]: "dasm_user" });
    const r = resolveInspectionPersona(new Headers(), c as never);
    expect(r.persona).toBe("unknown");
  });

  // Per-persona nav snapshot — locks each role's intended sidebar so a future
  // change to visibleNavKeys can't silently regress role scoping.
  it.each([
    ["dasm_user", ["dashboard", "requests", "my_inspections", "workshops", "settings"]],
    ["inspector", ["dashboard", "requests", "my_inspections", "workshops", "settings"]],
    ["mechanic", ["dashboard", "requests", "my_inspections", "workshops", "settings"]],
    ["viewer", ["dashboard", "requests", "my_inspections", "workshops", "settings"]],
    ["unknown", ["dashboard", "requests", "my_inspections", "workshops", "settings"]],
    ["workshop_owner", ["workshop_dashboard", "requests", "wallet", "subscription", "settings"]],
    ["workshop_manager", ["workshop_dashboard", "requests", "wallet", "subscription", "settings"]],
  ] as const)("nav for %s matches its intent", (persona, expected) => {
    const keys = [...visibleNavKeys(persona)].sort();
    expect(keys).toEqual([...expected].sort());
  });
});
