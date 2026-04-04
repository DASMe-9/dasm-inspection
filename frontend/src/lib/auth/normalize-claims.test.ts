import { describe, expect, it } from "vitest";
import { normalizeInspectionClaims } from "./normalize-claims";

describe("normalizeInspectionClaims", () => {
  it("maps admin path", () => {
    const n = normalizeInspectionClaims({
      sub: "admin-1",
      inspection_role: "inspection_admin",
      dasm_roles: ["platform"],
    });
    expect(n.userId).toBe("admin-1");
    expect(n.inspectionRole).toBe("inspection_admin");
    expect(n.dasmRoles).toContain("platform");
  });

  it("maps workshop owner", () => {
    const n = normalizeInspectionClaims({
      sub: "wo-1",
      dasm_user_id: "dasm-99",
      inspection_role: "workshop_owner",
      workshop_id: "11111111-1111-4111-8111-111111111101",
    });
    expect(n.userId).toBe("dasm-99");
    expect(n.workshopId).toBe("11111111-1111-4111-8111-111111111101");
  });

  it("maps inspector", () => {
    const n = normalizeInspectionClaims({
      sub: "insp-sub",
      inspection_role: "inspector",
      inspector_record_id: "22222222-2222-4222-8222-222222222201",
    });
    expect(n.inspectionRole).toBe("inspector");
    expect(n.inspectorRecordId).toBe("22222222-2222-4222-8222-222222222201");
  });

  it("maps customer / dasm_user", () => {
    const n = normalizeInspectionClaims({
      sub: "cust-1",
      inspection_role: "dasm_user",
    });
    expect(n.userId).toBe("cust-1");
    expect(n.inspectionRole).toBe("dasm_user");
  });
});
