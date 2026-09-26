import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { fetchMyGarage } from "./fetch-my-garage";

describe("fetchMyGarage", () => {
  afterEach(() => vi.restoreAllMocks());

  it("maps the authenticated Core garage without copying ownership data", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            cars: [
              {
                id: 71,
                title: "Toyota Camry 2021",
                plate: "أ ب ج 1234",
                odometer: 84000,
                odometer_unit: "km",
                market_category: "regularCars",
                condition: "good",
              },
            ],
          },
        }),
        { status: 200 }
      )
    );

    await expect(fetchMyGarage("token-1")).resolves.toEqual([
      expect.objectContaining({
        id: "71",
        title: "Toyota Camry 2021",
        odometer: "84000",
        marketCategory: "regularCars",
      }),
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/me/garage"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token-1" }),
      })
    );
  });

  it("fails explicitly when Core is unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 503 }));
    await expect(fetchMyGarage("token-1")).resolves.toBeNull();
  });
});
