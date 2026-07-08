import { afterEach, describe, expect, it, vi } from "vitest";
import {
  INSPECTION_DASM_USER_COOKIE,
  INSPECTION_UI_ROLE_COOKIE,
} from "@/lib/cookies/inspection-gateway";

// hoisted so the vi.mock factories below can reference them safely.
const { redirectMock, cookieState } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  cookieState: { current: {} as Record<string, string> },
}));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieState.current[name] !== undefined
        ? { value: cookieState.current[name] }
        : undefined,
  }),
  headers: async () => new Headers(),
}));

import { requireWorkshopDashboardPersona } from "./require-workshop-persona.server";

function setRole(role: string) {
  cookieState.current = {
    [INSPECTION_UI_ROLE_COOKIE]: role,
    [INSPECTION_DASM_USER_COOKIE]: "319",
  };
}

describe("requireWorkshopDashboardPersona", () => {
  afterEach(() => {
    redirectMock.mockClear();
    cookieState.current = {};
  });

  it("redirects a customer (dasm_user) away from workshop financial pages", async () => {
    setRole("dasm_user");
    await expect(requireWorkshopDashboardPersona()).rejects.toThrow(
      "REDIRECT:/dashboard"
    );
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it.each(["inspector", "mechanic", "viewer"])(
    "redirects field role %s",
    async (role) => {
      setRole(role);
      await expect(requireWorkshopDashboardPersona()).rejects.toThrow("REDIRECT");
    }
  );

  it("redirects an unknown/unauthenticated persona", async () => {
    cookieState.current = {};
    await expect(requireWorkshopDashboardPersona()).rejects.toThrow("REDIRECT");
  });

  it.each(["workshop_owner", "workshop_manager", "super_admin", "inspection_admin"])(
    "allows workshop/admin role %s (no redirect)",
    async (role) => {
      setRole(role);
      await expect(requireWorkshopDashboardPersona()).resolves.toBeUndefined();
      expect(redirectMock).not.toHaveBeenCalled();
    }
  );
});
