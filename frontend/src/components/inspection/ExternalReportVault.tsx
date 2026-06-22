"use client";

import { useState, useTransition } from "react";
import { uploadExternalVehicleReportAction } from "@/app/actions/external-vehicle-reports";
import type { ExternalVehicleReport } from "@/types";

const OCR_STATUS_LABEL: Record<ExternalVehicleReport["ocrStatus"], string> = {
  pending: "بانتظار القراءة الآلية",
  processing: "جاري التحليل",
  processed: "تم التحليل",
  failed: "تعذر التحليل",
};

function formatDate(iso?: string): string {
  if (!iso) return "غير محدد";
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
export function ExternalReportVault({
  reports,
}: {
  reports: ExternalVehicleReport[];
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      dir="rtl"
      aria-labelledby="external-report-vault-title"
    >
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-slate-500">
          تكامل تقارير خارجية
        </p>
        <h3
          id="external-report-vault-title"
          className="text-lg font-bold text-gray-950"
        >
          سجل السيارة الفني
        </h3>
        <p className="text-sm leading-6 text-gray-600">
          ارفع تقرير فحص من ورشة أو شركة أخرى ليُحفظ في ملفك. القراءة الآلية
          تسجل التقرير أولاً ثم تستخرج الملخص ومواعيد الصيانة عند تفعيل
          المعالج.
        </p>
      </div>

      <form
        className="mt-4 grid gap-3 md:grid-cols-2"
        action={(fd) => {
          setMessage(null);
          startTransition(async () => {
            const result = await uploadExternalVehicleReportAction(fd);
            setMessage(
              result.ok
                ? "تم حفظ التقرير في سجلك الفني."
                : result.message
            );
          });
        }}
      >
        <label className="block">
          <span className="text-xs font-medium text-gray-600">السيارة</span>
          <input
            name="vehicle_label"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="مثال: كيا كادينزا 2018"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-600">
            رقم السيارة في داسم
          </span>
          <input
            name="dasm_car_id"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="اختياري"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-600">
            مصدر التقرير
          </span>
          <input
            name="report_source"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="اسم الورشة أو الشركة"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-600">
            تاريخ التقرير
          </span>
          <input
            name="report_date"
            type="date"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs font-medium text-gray-600">
            ملف التقرير
          </span>
          <input
            name="file"
            required
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="mt-1 w-full rounded-xl border border-dashed border-gray-300 px-3 py-3 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="min-h-[44px] rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60 md:col-span-2"
        >
          {pending ? "جاري الحفظ..." : "حفظ التقرير في السجل"}
        </button>
      </form>

      {message && (
        <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
          {message}
        </p>
      )}

      <div className="mt-5">
        <h4 className="text-sm font-bold text-gray-900">التقارير المحفوظة</h4>
        {reports.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            لا توجد تقارير خارجية محفوظة بعد.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-100">
            {reports.map((report) => (
              <li key={report.id} className="px-3 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {report.vehicleLabel || report.fileName}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {report.reportSource || "مصدر غير محدد"} ·{" "}
                      {formatDate(report.reportDate || report.createdAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                    {OCR_STATUS_LABEL[report.ocrStatus]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
