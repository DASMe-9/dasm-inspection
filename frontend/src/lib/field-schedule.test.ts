import { describe, expect, it } from "vitest";
import {
  fieldJobCalendarDate,
  groupFieldJobsByDay,
  hasFieldMapCoordinates,
  openStreetMapPinUrl,
} from "./field-schedule";
import type { InspectionRequest } from "@/types";

function req(partial: Partial<InspectionRequest>): InspectionRequest {
  return {
    id: "1",
    title: "t",
    dasm_car_id: "c",
    vehicleLabel: "v",
    status: "assigned",
    serviceMode: "field",
    createdAt: "2026-05-01T10:00:00Z",
    updatedAt: "2026-05-01T10:00:00Z",
    ...partial,
  };
}

describe("field-schedule", () => {
  it("prefers field_scheduled_at for calendar day", () => {
    expect(
      fieldJobCalendarDate(
        req({
          fieldScheduledAt: "2026-05-10T08:00:00Z",
          dispatchedAt: "2026-05-09T08:00:00Z",
          createdAt: "2026-05-01T10:00:00Z",
        })
      )
    ).toBe("2026-05-10");
  });

  it("detects coordinates", () => {
    expect(hasFieldMapCoordinates(req({ fieldServiceLat: 24.7, fieldServiceLng: 46.6 }))).toBe(
      true
    );
    expect(hasFieldMapCoordinates(req({}))).toBe(false);
  });

  it("groups by day", () => {
    const map = groupFieldJobsByDay([
      req({ id: "a", createdAt: "2026-05-01T10:00:00Z" }),
      req({ id: "b", createdAt: "2026-05-02T10:00:00Z" }),
      req({ id: "c", createdAt: "2026-05-01T12:00:00Z" }),
    ]);
    expect(map.get("2026-05-01")?.length).toBe(2);
    expect(map.get("2026-05-02")?.length).toBe(1);
  });

  it("builds OSM pin url", () => {
    expect(openStreetMapPinUrl(24.7, 46.6)).toContain("24.7");
  });
});
