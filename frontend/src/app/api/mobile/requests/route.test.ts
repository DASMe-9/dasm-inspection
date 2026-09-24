import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateMobileRequest: vi.fn(),
  listMobileRequestsForAuth: vi.fn(),
  mobileBearerFromRequest: vi.fn(),
  createMobileInspectionRequest: vi.fn(),
}));

vi.mock("@/lib/api/mobile-inspection-http", () => ({
  authenticateMobileRequest: mocks.authenticateMobileRequest,
  listMobileRequestsForAuth: mocks.listMobileRequestsForAuth,
  mobileBearerFromRequest: mocks.mobileBearerFromRequest,
}));
vi.mock("@/lib/api/mobile-create-request", () => ({
  createMobileInspectionRequest: mocks.createMobileInspectionRequest,
}));

import { POST } from "./route";

function request(body: Record<string, unknown>) {
  return new Request("https://inspect.dasm.com.sa/api/mobile/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/mobile/requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mobileBearerFromRequest.mockReturnValue("platform-token");
  });

  it("rejects dasm_user when the Core account is not a final user", async () => {
    mocks.authenticateMobileRequest.mockResolvedValue({
      ok: true,
      normalized: {
        userId: "88",
        inspectionRole: "dasm_user",
        dasmRoles: ["dealer"],
      },
    });

    const response = await POST(request({ title: "طلب فحص", dasm_car_id: 42 }) as never);

    expect(response.status).toBe(403);
    expect(mocks.createMobileInspectionRequest).not.toHaveBeenCalled();
  });

  it("passes the selected car and bearer token for a final user", async () => {
    mocks.authenticateMobileRequest.mockResolvedValue({
      ok: true,
      normalized: {
        userId: "88",
        inspectionRole: "dasm_user",
        dasmRoles: ["user"],
      },
    });
    mocks.createMobileInspectionRequest.mockResolvedValue({
      ok: true,
      requestId: "request-1",
    });

    const response = await POST(
      request({
        title: "طلب فحص",
        vehicle_label: "Toyota Camry 2024",
        dasm_car_id: 42,
      }) as never
    );

    expect(response.status).toBe(201);
    expect(mocks.createMobileInspectionRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "88",
        dasmCarId: 42,
        platformToken: "platform-token",
      })
    );
  });
});
