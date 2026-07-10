import Link from "next/link";
import { Building2 } from "lucide-react";
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
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#0B1E3A_0%,#12294a_100%)] px-5 py-5 shadow-md md:px-6">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#1E74E8_0%,#2FBF4E_100%)]"
          aria-hidden
        />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-sky-300">{title}</p>
            <h1 className="mt-1 flex items-center gap-2 text-xl font-bold text-white md:text-2xl">
              <Building2 className="h-6 w-6 text-[#2FBF4E]" aria-hidden />
              {workshop.name}
            </h1>
            <p className="mt-1 text-sm text-slate-300">{workshop.city}</p>
          </div>
          <Link
            href={`/workshop?${q}`}
            className="inline-flex items-center rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            ← لوحة الورشة
          </Link>
        </div>
      </section>
      <WorkshopManageNav />
      {children}
    </div>
  );
}
