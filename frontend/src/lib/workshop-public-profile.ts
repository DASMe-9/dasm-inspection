import type { Inspector, Workshop } from "@/types";

/** حقول آمنة للعرض العام (بدون login). */
export type WorkshopPublicProfile = {
  id: string;
  slug: string;
  name: string;
  city: string;
  isVerified: boolean;
  phone?: string;
  email?: string;
  pricing?: Workshop["pricing"];
  inspectors: Array<{ id: string; fullName: string }>;
};

export function toWorkshopPublicProfile(
  workshop: Workshop,
  inspectors: Inspector[]
): WorkshopPublicProfile {
  const showContact = workshop.isVerified;
  return {
    id: workshop.id,
    slug: workshop.slug,
    name: workshop.name,
    city: workshop.city,
    isVerified: workshop.isVerified,
    phone: showContact ? workshop.phone : undefined,
    email: showContact ? workshop.email : undefined,
    pricing: workshop.pricing,
    inspectors: inspectors
      .filter((i) => i.active)
      .map((i) => ({ id: i.id, fullName: i.fullName })),
  };
}
