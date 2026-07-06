import { describe, it, expect } from "vitest";
import { computeMaintenanceReminders } from "./maintenance-reminders";
import type { VehicleMaintenanceRecord } from "@/types";

const NOW = new Date("2026-07-06T12:00:00.000Z");

function rec(
  over: Partial<VehicleMaintenanceRecord> & {
    id: string;
    serviceType: VehicleMaintenanceRecord["serviceType"];
    serviceDate: string;
  }
): VehicleMaintenanceRecord {
  return {
    dasmUserId: "u1",
    source: "user_entry",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...over,
  } as VehicleMaintenanceRecord;
}

describe("computeMaintenanceReminders", () => {
  it("classifies overdue / due_soon / upcoming by next due date", () => {
    const out = computeMaintenanceReminders(
      [
        rec({ id: "a", serviceType: "brakes", serviceDate: "2026-01-01", nextDueDate: "2026-06-01", dasmCarId: "c1" }), // overdue
        rec({ id: "b", serviceType: "oil_change", serviceDate: "2026-06-01", nextDueDate: "2026-07-20", dasmCarId: "c1" }), // due_soon (14d)
        rec({ id: "c", serviceType: "tires", serviceDate: "2026-06-01", nextDueDate: "2026-12-01", dasmCarId: "c1" }), // upcoming
      ],
      NOW
    );
    expect(out.map((r) => r.status)).toEqual(["overdue", "due_soon", "upcoming"]);
    expect(out[0].recordId).toBe("a");
    expect(out[1].daysUntilDue).toBe(14);
  });

  it("uses only the latest record per car+service (supersedes older due)", () => {
    const out = computeMaintenanceReminders(
      [
        rec({ id: "old", serviceType: "oil_change", serviceDate: "2026-01-01", nextDueDate: "2026-04-01", dasmCarId: "c1" }), // would be overdue
        rec({ id: "new", serviceType: "oil_change", serviceDate: "2026-06-15", nextDueDate: "2026-12-15", dasmCarId: "c1" }), // supersedes → upcoming
      ],
      NOW
    );
    expect(out).toHaveLength(1);
    expect(out[0].recordId).toBe("new");
    expect(out[0].status).toBe("upcoming");
  });

  it("excludes records with no next-due date and no next-due odometer", () => {
    const out = computeMaintenanceReminders(
      [rec({ id: "x", serviceType: "battery", serviceDate: "2026-05-01" })],
      NOW
    );
    expect(out).toHaveLength(0);
  });

  it("keeps same service type separate per car", () => {
    const out = computeMaintenanceReminders(
      [
        rec({ id: "c1", serviceType: "oil_change", serviceDate: "2026-06-01", nextDueDate: "2026-06-01", dasmCarId: "car-1" }),
        rec({ id: "c2", serviceType: "oil_change", serviceDate: "2026-06-01", nextDueDate: "2026-12-01", dasmCarId: "car-2" }),
      ],
      NOW
    );
    expect(out).toHaveLength(2);
  });
});
