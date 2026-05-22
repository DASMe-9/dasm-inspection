import { Download } from "lucide-react";
import { SectionCard } from "@/components/shared";
import type { WorkshopExportDataset } from "@/types/workshop-insights";

const EXPORT_ITEMS: {
  dataset: WorkshopExportDataset;
  title: string;
  description: string;
}[] = [
  {
    dataset: "requests",
    title: "طلبات الفحص",
    description: "كل طلبات الورشة مع الحالة ونوع الخدمة والتواريخ.",
  },
  {
    dataset: "reviews",
    title: "التقييمات",
    description: "تقييمات العملاء بكل حالات المراجعة.",
  },
  {
    dataset: "followers",
    title: "المتابعون",
    description: "قائمة معرفات مستخدمي داسم الذين يتابعون الورشة.",
  },
];

export function WorkshopExportPanel({ workshopId }: { workshopId: string }) {
  const q = new URLSearchParams({ workshop_id: workshopId });

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        تنزيل ملف CSV بترميز UTF-8 (متوافق مع Excel). يتطلّب تسجيل دخول بنفس
        صلاحية لوحة الورشة.
      </p>
      <ul className="grid gap-3 md:grid-cols-1">
        {EXPORT_ITEMS.map((item) => {
          const params = new URLSearchParams(q);
          params.set("dataset", item.dataset);
          const href = `/api/workshop/export?${params.toString()}`;
          return (
            <li key={item.dataset}>
              <SectionCard>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="mt-1 text-xs text-gray-600">
                      {item.description}
                    </p>
                  </div>
                  <a
                    href={href}
                    download
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-violet-800"
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    تنزيل CSV
                  </a>
                </div>
              </SectionCard>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
