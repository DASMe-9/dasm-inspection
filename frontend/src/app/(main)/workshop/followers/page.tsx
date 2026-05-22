import { WorkshopFollowersPanel } from "@/components/workshop/WorkshopFollowersPanel";
import { WorkshopSectionChrome } from "@/components/workshop/WorkshopSectionChrome";
import { requireWorkshopPage } from "@/lib/auth/resolve-workshop-page.server";
import { listWorkshopFollowers } from "@/lib/data/workshop-insights-data";

type Props = { searchParams: Promise<{ workshop_id?: string }> };

export default async function WorkshopFollowersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { workshop, workshopId } = await requireWorkshopPage(sp.workshop_id);
  const followers = await listWorkshopFollowers(workshopId);

  return (
    <WorkshopSectionChrome
      workshop={workshop}
      workshopId={workshopId}
      title="متابعو الورشة"
    >
      <WorkshopFollowersPanel followers={followers} />
    </WorkshopSectionChrome>
  );
}
