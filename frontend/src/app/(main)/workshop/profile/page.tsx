import { WorkshopSectionChrome } from "@/components/workshop/WorkshopSectionChrome";
import { WorkshopProfileHub } from "@/components/workshop/WorkshopProfileHub";
import { requireWorkshopPage } from "@/lib/auth/resolve-workshop-page.server";

type Props = { searchParams: Promise<{ workshop_id?: string }> };

export default async function WorkshopProfilePage({ searchParams }: Props) {
  const sp = await searchParams;
  const { workshop, workshopId } = await requireWorkshopPage(sp.workshop_id);

  return (
    <WorkshopSectionChrome
      workshop={workshop}
      workshopId={workshopId}
      title="ملف الورشة"
    >
      <WorkshopProfileHub
        workshopId={workshopId}
        workshopSlug={workshop.slug}
        workshop={workshop}
      />
    </WorkshopSectionChrome>
  );
}
