import { WorkshopSectionChrome } from "@/components/workshop/WorkshopSectionChrome";
import { WorkshopTeamPanel } from "@/components/workshop/WorkshopTeamPanel";
import { requireWorkshopPage } from "@/lib/auth/resolve-workshop-page.server";
import { listAllWorkshopInspectors } from "@/lib/data/workshop-management-data";

type Props = { searchParams: Promise<{ workshop_id?: string }> };

export default async function WorkshopTeamPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { workshop, workshopId } = await requireWorkshopPage(sp.workshop_id);
  const inspectors = await listAllWorkshopInspectors(workshopId);

  return (
    <WorkshopSectionChrome
      workshop={workshop}
      workshopId={workshopId}
      title="إدارة الفريق"
    >
      <WorkshopTeamPanel
        workshopId={workshopId}
        workshopSlug={workshop.slug}
        inspectors={inspectors}
      />
    </WorkshopSectionChrome>
  );
}
