import { WorkshopExportPanel } from "@/components/workshop/WorkshopExportPanel";
import { WorkshopSectionChrome } from "@/components/workshop/WorkshopSectionChrome";
import { requireWorkshopPage } from "@/lib/auth/resolve-workshop-page.server";

type Props = { searchParams: Promise<{ workshop_id?: string }> };

export default async function WorkshopExportPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { workshop, workshopId } = await requireWorkshopPage(sp.workshop_id);

  return (
    <WorkshopSectionChrome
      workshop={workshop}
      workshopId={workshopId}
      title="تصدير البيانات"
    >
      <WorkshopExportPanel workshopId={workshopId} />
    </WorkshopSectionChrome>
  );
}
