import { WorkshopReviewsPanel } from "@/components/workshop/WorkshopReviewsPanel";
import { WorkshopSectionChrome } from "@/components/workshop/WorkshopSectionChrome";
import { requireWorkshopPage } from "@/lib/auth/resolve-workshop-page.server";
import { listWorkshopReviewsForOwner } from "@/lib/data/workshop-insights-data";

type Props = { searchParams: Promise<{ workshop_id?: string }> };

export default async function WorkshopReviewsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { workshop, workshopId } = await requireWorkshopPage(sp.workshop_id);
  const reviews = await listWorkshopReviewsForOwner(workshopId);
  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  return (
    <WorkshopSectionChrome
      workshop={workshop}
      workshopId={workshopId}
      title="تقييمات الورشة"
    >
      <WorkshopReviewsPanel reviews={reviews} pendingCount={pendingCount} />
    </WorkshopSectionChrome>
  );
}
