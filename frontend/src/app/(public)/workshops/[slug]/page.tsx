import { permanentRedirect } from "next/navigation";
import { notFound } from "next/navigation";
import { WorkshopPublicProfileView } from "@/components/inspection/WorkshopPublicProfileView";
import { WorkshopFollowPanel } from "@/components/inspection/WorkshopFollowPanel";
import { WorkshopReviewsSection } from "@/components/inspection/WorkshopReviewsSection";
import { SectionCard } from "@/components/shared";
import { resolveDasmUserId } from "@/lib/auth/resolve-dasm-user-id.server";
import {
  getWorkshopFollowerCount,
  isFollowingWorkshop,
} from "@/lib/data/workshop-follows-data";
import {
  getInspectorsForWorkshop,
  resolveWorkshopRouteParam,
} from "@/lib/data/inspection";
import { getWorkshopPublicStats } from "@/lib/data/workshop-public-stats";
import { listApprovedWorkshopReviews } from "@/lib/data/workshop-reviews-data";
import { toWorkshopPublicProfile } from "@/lib/workshop-public-profile";
import { averageWorkshopRating } from "@/lib/workshop-reviews";
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

  const dasmUserId = await resolveDasmUserId();
  const [inspectors, followerCount, following, reviews, stats] =
    await Promise.all([
      getInspectorsForWorkshop(resolved.workshop.id),
      getWorkshopFollowerCount(resolved.workshop.id),
      dasmUserId
        ? isFollowingWorkshop(dasmUserId, resolved.workshop.id)
        : Promise.resolve(false),
      listApprovedWorkshopReviews(resolved.workshop.id),
      getWorkshopPublicStats(resolved.workshop.id),
    ]);

  const ratingSummary = averageWorkshopRating(reviews.map((r) => r.rating));
  const profile = toWorkshopPublicProfile(resolved.workshop, inspectors, {
    ratingSummary,
    stats,
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6">
      <WorkshopPublicProfileView profile={profile} />
      <SectionCard title="متابعة الورشة">
        <WorkshopFollowPanel
          workshopId={resolved.workshop.id}
          workshopSlug={resolved.canonicalSlug}
          followerCount={followerCount}
          isFollowing={following}
          dasmUserId={dasmUserId}
        />
      </SectionCard>
      <WorkshopReviewsSection
        workshopId={resolved.workshop.id}
        workshopSlug={resolved.canonicalSlug}
      />
    </div>
  );
}
