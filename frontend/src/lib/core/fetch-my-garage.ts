import "server-only";

import { DASM_API_URL } from "@/lib/api/inspection-http-auth";

export type CoreGarageVehicle = {
  id: string;
  title: string;
  make: string | null;
  model: string | null;
  year: string | null;
  plate: string | null;
  imageUrl: string | null;
  odometer: string | null;
  odometerUnit: string;
  marketCategory: string | null;
  condition: string | null;
};

type CoreGarageResponse = {
  success?: boolean;
  data?: {
    cars?: Array<Record<string, unknown>>;
  };
};

function optionalText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
}

export async function fetchMyGarage(
  token: string
): Promise<CoreGarageVehicle[] | null> {
  const cleanToken = token.trim();
  if (!cleanToken) return null;

  try {
    const response = await fetch(
      `${DASM_API_URL.replace(/\/+$/, "")}/api/me/garage`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${cleanToken}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(3_000),
      }
    );
    if (!response.ok) return null;

    const payload = (await response.json()) as CoreGarageResponse;
    if (!payload.success || !Array.isArray(payload.data?.cars)) return null;

    return payload.data.cars.flatMap((row) => {
      const id = optionalText(row.id);
      if (!id) return [];
      return [
        {
          id,
          title: optionalText(row.title) ?? `مركبة #${id}`,
          make: optionalText(row.make),
          model: optionalText(row.model),
          year: optionalText(row.year),
          plate: optionalText(row.plate),
          imageUrl: optionalText(row.image_url),
          odometer: optionalText(row.odometer ?? row.odometer_reading),
          odometerUnit: optionalText(row.odometer_unit) ?? "km",
          marketCategory: optionalText(row.market_category),
          condition: optionalText(row.condition),
        },
      ];
    });
  } catch {
    return null;
  }
}
