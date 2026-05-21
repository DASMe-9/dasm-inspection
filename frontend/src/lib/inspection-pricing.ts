import type { InspectionServiceMode, WorkshopServicePricing } from "@/types";

export type PricingRow = {
  workshop_id: string | null;
  service_mode: InspectionServiceMode;
  price_sar: number;
  currency: string;
};

/** يبني خريطة أسعار لكل ورشة مع دمج الافتراضي العام (workshop_id = null). */
export function buildWorkshopPricingMap(
  rows: PricingRow[]
): Map<string | null, WorkshopServicePricing> {
  const map = new Map<string | null, WorkshopServicePricing>();

  for (const row of rows) {
    const key = row.workshop_id;
    const existing =
      map.get(key) ??
      ({
        workshopSar: null,
        fieldSar: null,
        currency: row.currency || "SAR",
      } satisfies WorkshopServicePricing);

    const price = Number(row.price_sar);
    if (row.service_mode === "workshop") {
      existing.workshopSar = price;
    } else {
      existing.fieldSar = price;
    }
    existing.currency = row.currency || "SAR";
    map.set(key, existing);
  }

  return map;
}

/** سعر فعّال: تخصيص الورشة إن وُجد، وإلا الافتراضي العام. */
export function resolveWorkshopServicePrice(
  workshopId: string | null | undefined,
  mode: InspectionServiceMode,
  map: Map<string | null, WorkshopServicePricing>
): { amountSar: number | null; currency: string; source: "workshop" | "platform" | "none" } {
  const platform = map.get(null);
  const workshop = workshopId ? map.get(workshopId) : undefined;

  const fromWorkshop =
    mode === "workshop" ? workshop?.workshopSar : workshop?.fieldSar;
  if (fromWorkshop != null && Number.isFinite(fromWorkshop)) {
    return {
      amountSar: fromWorkshop,
      currency: workshop?.currency ?? platform?.currency ?? "SAR",
      source: "workshop",
    };
  }

  const fromPlatform =
    mode === "workshop" ? platform?.workshopSar : platform?.fieldSar;
  if (fromPlatform != null && Number.isFinite(fromPlatform)) {
    return {
      amountSar: fromPlatform,
      currency: platform?.currency ?? "SAR",
      source: "platform",
    };
  }

  return { amountSar: null, currency: "SAR", source: "none" };
}

export function formatInspectionPriceSar(
  amount: number | null | undefined,
  currency = "SAR"
): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  const formatted = new Intl.NumberFormat("ar-SA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return currency === "SAR" ? `${formatted} ر.س` : `${formatted} ${currency}`;
}

export function pricingLabelAr(mode: InspectionServiceMode): string {
  return mode === "workshop" ? "في الورشة" : "ميداني";
}
