import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminClient: vi.fn(),
  ensureDasmCarOnCore: vi.fn(),
  verifyOwnedCar: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  requireAdminClient: mocks.requireAdminClient,
}));
vi.mock("@/lib/core/ensure-dasm-car-on-core", () => ({
  ensureDasmCarOnCore: mocks.ensureDasmCarOnCore,
}));
vi.mock("@/lib/core/verify-owned-car", () => ({
  verifyOwnedCar: mocks.verifyOwnedCar,
}));

import { createMobileInspectionRequest } from "./mobile-create-request";

describe("createMobileInspectionRequest", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores the owned Core car and does not create a fallback car", async () => {
    let requestInsert: Record<string, unknown> | null = null;
    const historyInsert = vi.fn().mockResolvedValue({ error: null });
    mocks.verifyOwnedCar.mockResolvedValue({
      ok: true,
      carId: 42,
      vehicleLabel: "Toyota Camry 2024",
    });
    mocks.requireAdminClient.mockReturnValue({
      from: (table: string) => {
        if (table === "inspection_requests") {
          return {
            insert: (row: Record<string, unknown>) => {
              requestInsert = row;
              return {
                select: () => ({
                  single: async () => ({
                    data: { id: "request-1" },
                    error: null,
                  }),
                }),
              };
            },
          };
        }
        if (table === "inspection_status_history") {
          return { insert: historyInsert };
        }
        throw new Error(`Unexpected table: ${table}`);
      },
    });

    await expect(
      createMobileInspectionRequest({
        userId: "88",
        title: "طلب فحص",
        vehicleLabel: "قيمة لا يعتمد عليها",
        dasmCarId: 42,
        platformToken: "platform-token",
        preferredSlotAt: "2099-06-12T10:30:00.000Z",
      })
    ).resolves.toEqual({ ok: true, requestId: "request-1" });

    expect(mocks.verifyOwnedCar).toHaveBeenCalledWith(42, "platform-token");
    expect(requestInsert).toMatchObject({
      dasm_car_id: "42",
      vehicle_label: "Toyota Camry 2024",
      dasm_user_id: "88",
    });
    expect(mocks.ensureDasmCarOnCore).not.toHaveBeenCalled();
    expect(historyInsert).toHaveBeenCalledOnce();
  });

  it("rejects a request without a future appointment before database access", async () => {
    await expect(
      createMobileInspectionRequest({
        userId: "88",
        title: "طلب فحص",
        vehicleLabel: "Toyota Camry 2024",
      })
    ).resolves.toEqual({
      ok: false,
      status: 422,
      message: "اختر تاريخ ووقت الموعد.",
    });

    expect(mocks.requireAdminClient).not.toHaveBeenCalled();
  });

  it("stops before database access when Core rejects ownership", async () => {
    mocks.verifyOwnedCar.mockResolvedValue({
      ok: false,
      status: 403,
      message: "المركبة غير موجودة ضمن مركبات هذا المستخدم.",
    });

    await expect(
      createMobileInspectionRequest({
        userId: "88",
        title: "طلب فحص",
        vehicleLabel: "",
        dasmCarId: 9,
        platformToken: "platform-token",
      })
    ).resolves.toMatchObject({ ok: false, status: 403 });

    expect(mocks.requireAdminClient).not.toHaveBeenCalled();
  });
});
