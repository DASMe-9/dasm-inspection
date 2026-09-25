import type { Workshop } from "@/types";

export function toMobileWorkshopRow(workshop: Workshop) {
  return {
    id: workshop.id,
    slug: workshop.slug,
    name: workshop.name,
    city: workshop.city,
    is_verified: workshop.isVerified,
    phone: workshop.phone?.trim() || null,
    pricing: workshop.pricing ?? null,
    rating_average: workshop.ratingSummary?.average ?? null,
    rating_count: workshop.ratingSummary?.count ?? 0,
  };
}
