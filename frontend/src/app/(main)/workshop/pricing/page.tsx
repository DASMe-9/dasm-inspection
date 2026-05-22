import { WorkshopSectionChrome } from "@/components/workshop/WorkshopSectionChrome";
import { WorkshopPricingPanel } from "@/components/workshop/WorkshopPricingPanel";
import { requireWorkshopPage } from "@/lib/auth/resolve-workshop-page.server";
import { getWorkshopPricingForManage } from "@/lib/data/workshop-management-data";

type Props = { searchParams: Promise<{ workshop_id?: string }> };

export default async function WorkshopPricingPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { workshop, workshopId } = await requireWorkshopPage(sp.workshop_id);
  const pricing = await getWorkshopPricingForManage(workshopId);

  return (
    <WorkshopSectionChrome
      workshop={workshop}
      workshopId={workshopId}
      title="إدارة الأسعار"
    >
      <WorkshopPricingPanel
        workshopId={workshopId}
        workshopSlug={workshop.slug}
        pricing={pricing}
      />
    </WorkshopSectionChrome>
  );
}
