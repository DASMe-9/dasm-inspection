import type { InspectionServiceMode, WorkshopServicePricing } from "@/types";

export type ComparableWorkshop = {
  id: string;
  name: string;
  pricing?: WorkshopServicePricing | null;
};

export type WorkshopOffer<T extends ComparableWorkshop> = {
  workshop: T;
  amountSar: number | null;
};

/** Priced workshops first from lowest to highest; unavailable prices last. */
export function compareWorkshopOffers<T extends ComparableWorkshop>(
  workshops: readonly T[],
  mode: InspectionServiceMode
): WorkshopOffer<T>[] {
  return workshops
    .map((workshop) => ({
      workshop,
      amountSar:
        mode === "field"
          ? workshop.pricing?.fieldSar ?? null
          : workshop.pricing?.workshopSar ?? null,
    }))
    .sort((a, b) => {
      if (a.amountSar == null && b.amountSar != null) return 1;
      if (a.amountSar != null && b.amountSar == null) return -1;
      if (a.amountSar != null && b.amountSar != null && a.amountSar !== b.amountSar) {
        return a.amountSar - b.amountSar;
      }
      return a.workshop.name.localeCompare(b.workshop.name, "ar");
    });
}
