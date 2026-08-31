import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  INSPECTION_HEADER_DASM_ROLES,
  INSPECTION_HEADER_INSPECTION_ROLE,
  INSPECTION_HEADER_INSPECTOR_RECORD_ID,
  INSPECTION_HEADER_USER_ID,
  INSPECTION_HEADER_VERIFIED,
  INSPECTION_HEADER_WORKSHOP_ID,
} from "@/lib/auth/inspection-headers";

const { headerState } = vi.hoisted(() => ({
  headerState: { current: {} as Record<string, string> },
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(headerState.current),
  cookies: async () => ({ get: () => undefined }),
}));

import { canAccessInspectionResource } from "./resource-ownership.server";

function setJwt(claims: {
  role: string;
  userId?: string;
  workshopId?: string;
  inspectorRecordId?: string;
}) {
  headerState.current = {
    [INSPECTION_HEADER_VERIFIED]: "1",
    [INSPECTION_HEADER_INSPECTION_ROLE]: claims.role,
    [INSPECTION_HEADER_USER_ID]: claims.userId ?? "u-1",
    [INSPECTION_HEADER_DASM_ROLES]: JSON.stringify([claims.role]),
    ...(claims.workshopId ? { [INSPECTION_HEADER_WORKSHOP_ID]: claims.workshopId } : {}),
    ...(claims.inspectorRecordId
      ? { [INSPECTION_HEADER_INSPECTOR_RECORD_ID]: claims.inspectorRecordId }
      : {}),
  };
}

describe("canAccessInspectionResource", () => {
  beforeEach(() => {
    vi.stubEnv("DASM_JWT_ENFORCE", "true");
  });

  afterEach(() => {
    headerState.current = {};
    vi.unstubAllEnvs();
  });

  it("allows everything when JWT enforcement is off (unchanged current behavior)", async () => {
    vi.stubEnv("DASM_JWT_ENFORCE", "false");
    headerState.current = {};
    await expect(
      canAccessInspectionResource({ workshopId: "w-1", inspectorId: null, dasmUserId: null })
    ).resolves.toBe(true);
  });

  it("allows when enforcement is on but the request carries no verified JWT context (middleware's job, not this gate's — same fail-open convention as getInspectionAuthContext elsewhere)", async () => {
    headerState.current = {};
    await expect(
      canAccessInspectionResource({ workshopId: "w-1", inspectorId: null, dasmUserId: null })
    ).resolves.toBe(true);
  });

  it.each(["inspection_admin", "super_admin"])("always allows admin role %s", async (role) => {
    setJwt({ role });
    await expect(
      canAccessInspectionResource({ workshopId: "other-workshop", inspectorId: null, dasmUserId: null })
    ).resolves.toBe(true);
  });

  it("allows a workshop operator only for their own workshop's resource", async () => {
    setJwt({ role: "workshop_owner", workshopId: "w-1" });
    await expect(
      canAccessInspectionResource({ workshopId: "w-1", inspectorId: null, dasmUserId: null })
    ).resolves.toBe(true);
    await expect(
      canAccessInspectionResource({ workshopId: "w-2", inspectorId: null, dasmUserId: null })
    ).resolves.toBe(false);
  });

  it("allows an inspector only for their own assigned resource", async () => {
    setJwt({ role: "inspector", inspectorRecordId: "insp-1" });
    await expect(
      canAccessInspectionResource({ workshopId: null, inspectorId: "insp-1", dasmUserId: null })
    ).resolves.toBe(true);
    await expect(
      canAccessInspectionResource({ workshopId: null, inspectorId: "insp-2", dasmUserId: null })
    ).resolves.toBe(false);
  });

  it("allows a dasm_user only for their own resource, never by guessing another user's id", async () => {
    setJwt({ role: "dasm_user", userId: "319" });
    await expect(
      canAccessInspectionResource({ workshopId: null, inspectorId: null, dasmUserId: "319" })
    ).resolves.toBe(true);
    await expect(
      canAccessInspectionResource({ workshopId: null, inspectorId: null, dasmUserId: "999" })
    ).resolves.toBe(false);
  });

  it("closes by default for an unrecognized role", async () => {
    setJwt({ role: "viewer" });
    await expect(
      canAccessInspectionResource({ workshopId: "w-1", inspectorId: null, dasmUserId: null })
    ).resolves.toBe(false);
  });
});
