import { WorkshopCard } from "@/components/inspection";
import { SectionCard, EmptyState } from "@/components/shared";
import { listWorkshops } from "@/lib/data/inspection";

export default async function WorkshopsPage() {
  const list = await listWorkshops();

  return (
    <div className="space-y-4" dir="rtl">
      <h2 className="text-lg font-bold text-gray-800">الورش المعتمدة</h2>
      <SectionCard>
        {list.length === 0 ? (
          <EmptyState
            title="لا ورش"
            description="طبّق الهجرة والبذور في Supabase (انظر supabase/migrations)."
          />
        ) : (
          <div className="space-y-3">
            {list.map((w) => (
              <WorkshopCard key={w.id} workshop={w} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
