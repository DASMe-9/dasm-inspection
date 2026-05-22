import { permanentRedirect } from "next/navigation";
import { notFound } from "next/navigation";
import { WorkshopPublicProfileView } from "@/components/inspection/WorkshopPublicProfileView";
import { WorkshopReviewsSection } from "@/components/inspection/WorkshopReviewsSection";
import {
  getInspectorsForWorkshop,
  resolveWorkshopRouteParam,
} from "@/lib/data/inspection";
import { toWorkshopPublicProfile } from "@/lib/workshop-public-profile";
import { isWorkshopUuid } from "@/lib/workshop-slug";

export default async function WorkshopPublicPage({
  params,
}: {
  params: { slug: string };
}) {
  const key = params.slug?.trim();
  if (!key) notFound();

  const resolved = await resolveWorkshopRouteParam(key);
  if (!resolved) notFound();

  if (
    isWorkshopUuid(key) &&
    resolved.canonicalSlug.toLowerCase() !== key.toLowerCase()
  ) {
    permanentRedirect(`/workshops/${resolved.canonicalSlug}`);
  }

  const inspectors = await getInspectorsForWorkshop(resolved.workshop.id);
  const profile = toWorkshopPublicProfile(resolved.workshop, inspectors);

  return (
    <>
      <WorkshopPublicProfileView profile={profile} />
      <WorkshopReviewsSection
        workshopId={resolved.workshop.id}
        workshopSlug={resolved.canonicalSlug}
      />
    </>
  );
}
