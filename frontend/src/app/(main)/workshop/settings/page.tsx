import { WorkshopSectionChrome } from "@/components/workshop/WorkshopSectionChrome";
import { WorkshopSettingsPanel } from "@/components/workshop/WorkshopSettingsPanel";
import { requireWorkshopPage } from "@/lib/auth/resolve-workshop-page.server";

type Props = { searchParams: Promise<{ workshop_id?: string }> };

export default async function WorkshopSettingsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { workshop, workshopId } = await requireWorkshopPage(sp.workshop_id);

  return (
    <WorkshopSectionChrome
      workshop={workshop}
      workshopId={workshopId}
      title="إعدادات الورشة والتحقق"
    >
      <WorkshopSettingsPanel
        workshopId={workshopId}
        workshopSlug={workshop.slug}
        workshop={workshop}
      />
    </WorkshopSectionChrome>
  );
}
