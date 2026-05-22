import { WorkshopFieldCalendarPanel } from "@/components/workshop/WorkshopFieldCalendarPanel";
import { WorkshopFieldMapPanel } from "@/components/workshop/WorkshopFieldMapPanel";
import { WorkshopSectionChrome } from "@/components/workshop/WorkshopSectionChrome";
import { requireWorkshopPage } from "@/lib/auth/resolve-workshop-page.server";
import { listWorkshopFieldRequests } from "@/lib/data/workshop-field-data";

type Props = { searchParams: Promise<{ workshop_id?: string }> };

export default async function WorkshopFieldPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { workshop, workshopId } = await requireWorkshopPage(sp.workshop_id);
  const fieldRequests = await listWorkshopFieldRequests(workshopId);

  return (
    <WorkshopSectionChrome
      workshop={workshop}
      workshopId={workshopId}
      title="التشغيل الميداني"
    >
      <WorkshopFieldCalendarPanel
        workshopId={workshopId}
        requests={fieldRequests}
      />
      <WorkshopFieldMapPanel
        workshopCity={workshop.city}
        requests={fieldRequests}
      />
    </WorkshopSectionChrome>
  );
}
