import Link from "next/link";
import { WorkshopManageNav } from "@/components/workshop/WorkshopManageNav";
import type { Workshop } from "@/types";

export function WorkshopSectionChrome({
  workshop,
  workshopId,
  title,
  children,
}: {
  workshop: Workshop;
  workshopId: string;
  title: string;
  children: React.ReactNode;
}) {
  const q = `workshop_id=${workshopId}`;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-violet-800/90">{title}</p>
          <h1 className="text-xl font-bold text-gray-900">{workshop.name}</h1>
        </div>
        <Link
          href={`/workshop?${q}`}
          className="text-sm font-semibold text-gray-600 hover:text-violet-700"
        >
          ← لوحة الورشة
        </Link>
      </div>
      <WorkshopManageNav />
      {children}
    </div>
  );
}
