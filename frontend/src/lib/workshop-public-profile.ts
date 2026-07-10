import type { Inspector, Workshop, WorkshopEducationalVideo } from "@/types";
import type { WorkshopPublicStats } from "@/lib/data/workshop-public-stats";

export type WorkshopRatingSummary = {
  average: number;
  count: number;
} | null;

/** حقول آمنة للعرض العام (بدون login). */
export type WorkshopPublicProfile = {
  id: string;
  slug: string;
  name: string;
  city: string;
  isVerified: boolean;
  isFeatured: boolean;
  featuredProgramLabel?: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  instagram?: string;
  mapLink?: string;
  workingHours?: string;
  pricing?: Workshop["pricing"];
  galleryUrls: string[];
  repairShowcaseUrls: string[];
  educationalVideos: WorkshopEducationalVideo[];
  inspectors: Array<{ id: string; fullName: string }>;
  ratingSummary: WorkshopRatingSummary;
  stats: WorkshopPublicStats;
};

export function toWorkshopPublicProfile(
  workshop: Workshop,
  inspectors: Inspector[],
  options?: {
    ratingSummary?: WorkshopRatingSummary;
    stats?: WorkshopPublicStats;
  }
): WorkshopPublicProfile {
  const showContact = workshop.isVerified;
  return {
    id: workshop.id,
    slug: workshop.slug,
    name: workshop.name,
    city: workshop.city,
    isVerified: workshop.isVerified,
    isFeatured: Boolean(workshop.isFeatured),
    featuredProgramLabel: workshop.featuredProgramLabel,
    description: workshop.description,
    logoUrl: workshop.logoUrl,
    coverUrl: workshop.coverUrl,
    phone: showContact ? workshop.phone : undefined,
    email: showContact ? workshop.email : undefined,
    whatsapp: showContact ? workshop.whatsapp : undefined,
    instagram: showContact ? workshop.instagram : undefined,
    mapLink: showContact ? workshop.mapLink : undefined,
    workingHours: showContact ? workshop.workingHours : undefined,
    pricing: workshop.pricing,
    galleryUrls: workshop.galleryUrls ?? [],
    repairShowcaseUrls: workshop.repairShowcaseUrls ?? [],
    educationalVideos: workshop.educationalVideos ?? [],
    inspectors: inspectors
      .filter((i) => i.active)
      .map((i) => ({ id: i.id, fullName: i.fullName })),
    ratingSummary: options?.ratingSummary ?? null,
    stats: options?.stats ?? {
      approvedInspectionCount: 0,
      recentInspections: [],
    },
  };
}
