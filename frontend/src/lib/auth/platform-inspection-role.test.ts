import { describe, expect, it } from "vitest";
import {
  platformTypeAllowedForInspectionLogin,
  resolveInspectionRoleFromPlatformUser,
} from "./platform-inspection-role";

describe("platform-inspection-role", () => {
  it("maps admin to inspection_admin", () => {
    expect(resolveInspectionRoleFromPlatformUser({ type: "admin" })).toBe(
      "inspection_admin"
    );
  });

  it("maps venue_owner to workshop_owner", () => {
    expect(resolveInspectionRoleFromPlatformUser({ type: "venue_owner" })).toBe(
      "workshop_owner"
    );
  });

  it("prefers explicit inspection_role from profile", () => {
    expect(
      resolveInspectionRoleFromPlatformUser({
        type: "user",
        inspectionRole: "inspector",
      })
    ).toBe("inspector");
  });

  it("maps workshop to workshop_owner", () => {
    expect(resolveInspectionRoleFromPlatformUser({ type: "workshop" })).toBe(
      "workshop_owner"
    );
  });

  it("allows known platform types for login", () => {
    expect(platformTypeAllowedForInspectionLogin("admin")).toBe(true);
    expect(platformTypeAllowedForInspectionLogin("venue_owner")).toBe(true);
    expect(platformTypeAllowedForInspectionLogin("workshop")).toBe(true);
    expect(platformTypeAllowedForInspectionLogin("guest")).toBe(false);
  });
});
