import { WorkshopReputationHub } from "@/components/workshop/WorkshopReputationHub";
import { WorkshopSectionChrome } from "@/components/workshop/WorkshopSectionChrome";
import { requireWorkshopPage } from "@/lib/auth/resolve-workshop-page.server";
import {
  listWorkshopFollowers,
  listWorkshopReviewsForOwner,
} from "@/lib/data/workshop-insights-data";

type Props = {
  searchParams: Promise<{ workshop_id?: string; tab?: string }>;
};

export default async function WorkshopReputationPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { workshop, workshopId } = await requireWorkshopPage(sp.workshop_id);

  const [followers, reviews] = await Promise.all([
    listWorkshopFollowers(workshopId),
    listWorkshopReviewsForOwner(workshopId),
  ]);

  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const approved = reviews.filter((r) => r.status === "approved");
  const averageRating =
    approved.length > 0
      ? approved.reduce((sum, r) => sum + r.rating, 0) / approved.length
      : null;

  return (
    <WorkshopSectionChrome
      workshop={workshop}
      workshopId={workshopId}
      title="التقييمات والمتابعون"
    >
      <WorkshopReputationHub
        initialTab={sp.tab}
        followers={followers}
        reviews={reviews}
        pendingCount={pendingCount}
        stats={{
          followerCount: followers.length,
          reviewCount: reviews.length,
          pendingCount,
          averageRating,
        }}
      />
    </WorkshopSectionChrome>
  );
}
