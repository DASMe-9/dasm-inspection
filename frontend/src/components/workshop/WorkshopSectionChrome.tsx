import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WorkshopManageNav } from "@/components/workshop/WorkshopManageNav";
import type { Workshop } from "@/types";

/**
 * إطار صفحات إدارة الورشة (فريق، أسعار، …) — تبويب تشغيل واحد فقط.
 * صفحة «ملف الورشة» لا تستخدم هذا المكوّن؛ لها تجربة مستقلة بنمط بروفايل المعرض.
 * `showHeader=false` يخفي العنوان وزر الرجوع عندما تكون الصفحة مغطاة بالشريط الجانبي.
 */
export function WorkshopSectionChrome({
  workshop,
  workshopId,
  title,
  children,
  showHeader = true,
}: {
  workshop: Workshop;
  workshopId: string;
  title: string;
  children: React.ReactNode;
  showHeader?: boolean;
}) {
  const q = `workshop_id=${workshopId}`;

  return (
    <div className="space-y-5" dir="rtl">
      {showHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {title}
            </p>
            <h1 className="mt-0.5 truncate text-xl font-bold text-slate-900 dark:text-white md:text-2xl">
              {workshop.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {workshop.city}
            </p>
          </div>
          <Link
            href={`/workshop?${q}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            لوحة الورشة
          </Link>
        </div>
      ) : null}

      <WorkshopManageNav />

      {children}
    </div>
  );
}
