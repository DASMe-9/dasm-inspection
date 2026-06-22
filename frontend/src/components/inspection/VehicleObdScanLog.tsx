"use client";

import { useState, useTransition } from "react";
import { createVehicleObdScanAction } from "@/app/actions/vehicle-obd-scans";
import type { VehicleObdScan, VehicleObdScanSeverity } from "@/types";

const SEVERITY_LABELS: Record<VehicleObdScanSeverity, string> = {
  clear: "سليم",
  info: "معلومة",
  warning: "تنبيه",
  critical: "حرج",
  unknown: "غير محدد",
};

const SEVERITY_TONES: Record<VehicleObdScanSeverity, string> = {
  clear: "bg-emerald-50 text-emerald-700",
  info: "bg-sky-50 text-sky-700",
  warning: "bg-amber-50 text-amber-800",
  critical: "bg-red-50 text-red-700",
  unknown: "bg-gray-50 text-gray-600",
};

const SEVERITY_OPTIONS = Object.entries(SEVERITY_LABELS) as [
  VehicleObdScanSeverity,
  string,
][];

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

export function VehicleObdScanLog({ scans }: { scans: VehicleObdScan[] }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <section
      className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm"
      dir="rtl"
      aria-labelledby="vehicle-obd-scan-log-title"
    >
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-sky-700">
          فحص كمبيوتر السيارة
        </p>
        <h3
          id="vehicle-obd-scan-log-title"
          className="text-lg font-bold text-gray-950"
        >
          أكواد الأعطال وقراءات OBD
        </h3>
        <p className="text-sm leading-6 text-gray-600">
          إذا كان لدى المستخدم قارئ OBD يمكنه تسجيل نتيجة الفحص بنفسه الآن.
          لاحقًا يقرأ تطبيق الجوال من القارئ مباشرة ويحدث سجل السيارة بنفس
          العقد.
        </p>
      </div>

      <form
        className="mt-4 grid gap-3 md:grid-cols-2"
        action={(fd) => {
          setMessage(null);
          startTransition(async () => {
            const result = await createVehicleObdScanAction(fd);
            setMessage(
              result.ok ? "تم حفظ فحص كمبيوتر السيارة." : result.message
            );
          });
        }}
      >
        <label className="block">
          <span className="text-xs font-medium text-gray-600">السيارة</span>
          <input
            name="vehicle_label"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="مثال: تويوتا كامري 2021"
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
          <span className="text-xs font-medium text-gray-600">تاريخ الفحص</span>
          <input
            name="scan_date"
            type="date"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-600">
            عداد السيارة
          </span>
          <input
            name="odometer_km"
            inputMode="numeric"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="كم"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-600">نوع القارئ</span>
          <input
            name="reader_name"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="ELM327 أو اسم الجهاز"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-600">البروتوكول</span>
          <input
            name="protocol"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="ISO 15765-4 CAN"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-600">VIN</span>
          <input
            name="vin"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="اختياري"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-600">
            فولت البطارية
          </span>
          <input
            name="battery_voltage"
            inputMode="decimal"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="12.6"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-600">نتيجة الفحص</span>
          <select
            name="severity"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            defaultValue="unknown"
          >
            {SEVERITY_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs font-medium text-gray-600">
            أكواد الأعطال
          </span>
          <textarea
            name="dtc_codes"
            rows={2}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="مثال: P0300, P0420. اتركه فارغًا إذا لا توجد أكواد."
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs font-medium text-gray-600">ملخص القراءة</span>
          <textarea
            name="summary"
            rows={2}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="مثال: لا توجد أكواد نشطة، جاهزية الانبعاثات مكتملة..."
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="min-h-[44px] rounded-xl bg-sky-700 px-4 text-sm font-bold text-white transition hover:bg-sky-800 disabled:opacity-60 md:col-span-2"
        >
          {pending ? "جاري الحفظ..." : "إضافة فحص الكمبيوتر إلى سجل السيارة"}
        </button>
      </form>

      {message ? (
        <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
          {message}
        </p>
      ) : null}

      <div className="mt-5">
        <h4 className="text-sm font-bold text-gray-900">فحوصات الكمبيوتر</h4>
        {scans.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            لا توجد فحوصات كمبيوتر محفوظة بعد.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-100">
            {scans.map((scan) => (
              <li key={scan.id} className="px-3 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {scan.vehicleLabel || scan.vin || "سيارة غير محددة"}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatDate(scan.scanDate)}
                      {scan.odometerKm != null
                        ? ` · ${scan.odometerKm.toLocaleString("ar-SA")} كم`
                        : ""}
                      {scan.readerName ? ` · ${scan.readerName}` : ""}
                    </p>
                    {scan.dtcCodes.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {scan.dtcCodes.map((code) => (
                          <span
                            key={code}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-emerald-700">
                        لا توجد أكواد أعطال مسجلة.
                      </p>
                    )}
                    {scan.summary ? (
                      <p className="mt-1 text-xs text-gray-600">
                        {scan.summary}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      SEVERITY_TONES[scan.severity]
                    }`}
                  >
                    {SEVERITY_LABELS[scan.severity]}
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
