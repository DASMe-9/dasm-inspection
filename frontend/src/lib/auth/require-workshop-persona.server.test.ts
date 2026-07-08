import { afterEach, describe, expect, it, vi } from "vitest";
import {
  INSPECTION_DASM_USER_COOKIE,
  INSPECTION_UI_ROLE_COOKIE,
} from "@/lib/cookies/inspection-gateway";

// hoisted so the vi.mock factory below can reference it safely.
const { cookieState } = vi.hoisted(() => ({
  cookieState: { current: {} as Record<string, string> },
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieState.current[name] !== undefined
        ? { value: cookieState.current[name] }
        : undefined,
  }),
  headers: async () => new Headers(),
}));

import {
  resolveIsWorkshopFinancialViewer,
  resolveWalletAudience,
} from "./require-workshop-persona.server";

function setRole(role: string) {
  cookieState.current = {
    [INSPECTION_UI_ROLE_COOKIE]: role,
    [INSPECTION_DASM_USER_COOKIE]: "319",
  };
}

describe("resolveIsWorkshopFinancialViewer", () => {
  afterEach(() => {
    cookieState.current = {};
  });

  it.each(["dasm_user", "inspector", "mechanic", "viewer"])(
    "denies non-workshop role %s (customer never sees B2B tiers)",
    async (role) => {
      setRole(role);
      await expect(resolveIsWorkshopFinancialViewer()).resolves.toBe(false);
    }
  );

  it("denies an unknown/unauthenticated persona", async () => {
    cookieState.current = {};
    await expect(resolveIsWorkshopFinancialViewer()).resolves.toBe(false);
  });

  it.each(["workshop_owner", "workshop_manager", "super_admin", "inspection_admin"])(
    "allows workshop/admin role %s",
    async (role) => {
      setRole(role);
      await expect(resolveIsWorkshopFinancialViewer()).resolves.toBe(true);
    }
  );
});

describe("resolveWalletAudience", () => {
  afterEach(() => {
    cookieState.current = {};
  });

  it("customer (dasm_user) → customer wallet view", async () => {
    setRole("dasm_user");
    await expect(resolveWalletAudience()).resolves.toBe("customer");
  });

  it.each(["workshop_owner", "workshop_manager", "super_admin", "inspection_admin"])(
    "%s → workshop wallet view",
    async (role) => {
      setRole(role);
      await expect(resolveWalletAudience()).resolves.toBe("workshop");
    }
  );

  it.each(["inspector", "mechanic", "viewer"])(
    "field role %s → no wallet",
    async (role) => {
      setRole(role);
      await expect(resolveWalletAudience()).resolves.toBe("none");
    }
  );

  it("unknown/unauthenticated → no wallet", async () => {
    cookieState.current = {};
    await expect(resolveWalletAudience()).resolves.toBe("none");
  });
});
