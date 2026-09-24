import { describe, expect, it, vi } from "vitest";
import { verifyOwnedCar } from "./verify-owned-car";

describe("verifyOwnedCar", () => {
  it("accepts the authenticated owner's car and derives its label", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            car: { id: 42, make: "Toyota", model: "Camry", year: 2024 },
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    await expect(verifyOwnedCar(42, "token", fetcher)).resolves.toEqual({
      ok: true,
      carId: 42,
      vehicleLabel: "Toyota Camry 2024",
    });
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining("/api/cars/42"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
      })
    );
  });

  it("rejects a car Core does not expose to the authenticated user", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));
    await expect(verifyOwnedCar(9, "token", fetcher)).resolves.toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it("reports Core failures as unavailable instead of an ownership denial", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    await expect(verifyOwnedCar(9, "token", fetcher)).resolves.toMatchObject({
      ok: false,
      status: 503,
    });
  });
});
