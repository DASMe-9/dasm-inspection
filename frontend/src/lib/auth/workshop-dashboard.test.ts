import { describe, expect, it } from "vitest";
import {
  isWorkshopDashboardRole,
  isWorkshopOperatorRole,
  parseWorkshopIdParam,
} from "./workshop-dashboard";

describe("workshop-dashboard", () => {
  it("recognizes workshop operator roles", () => {
    expect(isWorkshopOperatorRole("workshop_owner")).toBe(true);
    expect(isWorkshopOperatorRole("workshop_manager")).toBe(true);
    expect(isWorkshopOperatorRole("inspector")).toBe(false);
  });

  it("allows dashboard roles including admins", () => {
    expect(isWorkshopDashboardRole("workshop_owner")).toBe(true);
    expect(isWorkshopDashboardRole("inspection_admin")).toBe(true);
    expect(isWorkshopDashboardRole("dasm_user")).toBe(false);
  });

  it("parses workshop_id query param", () => {
    const id = "a1b2c3d4-e5f6-4789-abcd-ef0123456789";
    expect(parseWorkshopIdParam(id)).toBe(id);
    expect(parseWorkshopIdParam("not-uuid")).toBeNull();
    expect(parseWorkshopIdParam(undefined)).toBeNull();
  });
});
