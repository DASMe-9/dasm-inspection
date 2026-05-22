import { WorkshopAreasPanel } from "@/components/workshop/WorkshopAreasPanel";
import { WorkshopSectionChrome } from "@/components/workshop/WorkshopSectionChrome";
import { requireWorkshopPage } from "@/lib/auth/resolve-workshop-page.server";
import { listWorkshopServiceAreas } from "@/lib/data/workshop-management-data";

type Props = { searchParams: Promise<{ workshop_id?: string }> };

export default async function WorkshopAreasPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { workshop, workshopId } = await requireWorkshopPage(sp.workshop_id);
  const areas = await listWorkshopServiceAreas(workshopId);

  return (
    <WorkshopSectionChrome
      workshop={workshop}
      workshopId={workshopId}
      title="مناطق الخدمة"
    >
      <WorkshopAreasPanel
        workshopId={workshopId}
        workshopSlug={workshop.slug}
        areas={areas}
      />
    </WorkshopSectionChrome>
  );
}
