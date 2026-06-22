"use client";

import { useMemo, useState, useTransition } from "react";
import { createVehicleMaintenanceRecordAction } from "@/app/actions/vehicle-maintenance-records";
import type {
  VehicleMaintenanceRecord,
  VehicleMaintenanceServiceType,
} from "@/types";

const SERVICE_LABELS: Record<VehicleMaintenanceServiceType, string> = {
  oil_change: "تغيير زيت",
  oil_filter: "فلتر زيت",
  air_filter: "فلتر هواء",
  cabin_filter: "فلتر مكيف",
  fuel_filter: "فلتر وقود",
  tires: "إطارات",
  brakes: "فرامل",
  battery: "بطارية",
  coolant: "سائل تبريد",
  transmission: "ناقل الحركة",
  obd_scan: "فحص كمبيوتر السيارة",
  periodic_inspection: "فحص دوري",
  other: "أخرى",
};

const SERVICE_OPTIONS = Object.entries(SERVICE_LABELS) as [
  VehicleMaintenanceServiceType,
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

function dueTone(record: VehicleMaintenanceRecord): string {
  if (!record.nextDueDate) return "bg-gray-50 text-gray-600";
  const due = new Date(record.nextDueDate).getTime();
  if (!Number.isFinite(due)) return "bg-gray-50 text-gray-600";
  const days = Math.ceil((due - Date.now()) / 86_400_000);
  if (days < 0) return "bg-red-50 text-red-700";
  if (days <= 14) return "bg-amber-50 text-amber-800";
  return "bg-emerald-50 text-emerald-700";
}

export function VehicleMaintenanceLog({
  records,
}: {
  records: VehicleMaintenanceRecord[];
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const upcoming = useMemo(() => {
    return records
      .filter((record) => record.nextDueDate)
      .sort(
        (a, b) =>
          new Date(a.nextDueDate!).getTime() -
          new Date(b.nextDueDate!).getTime()
      )
      .slice(0, 3);
  }, [records]);

  return (
    <section
      className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"
      dir="rtl"
      aria-labelledby="vehicle-maintenance-log-title"
    >
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-emerald-700">
          سجل الصيانة الدورية
        </p>
        <h3
          id="vehicle-maintenance-log-title"
          className="text-lg font-bold text-gray-950"
        >
          مواعيد الزيت والفلاتر والصيانة
        </h3>
        <p className="text-sm leading-6 text-gray-600">
          سجّل ما تم عمله للسيارة مرة واحدة، وحدد تاريخ أو عداد الاستحقاق
          القادم ليبقى تاريخها الفني واضحًا في ملفك.
        </p>
      </div>

      <form
        className="mt-4 grid gap-3 md:grid-cols-2"
        action={(fd) => {
          setMessage(null);
          startTransition(async () => {
            const result = await createVehicleMaintenanceRecordAction(fd);
            setMessage(
              result.ok ? "تم حفظ سجل الصيانة." : result.message
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
          <span className="text-xs font-medium text-gray-600">نوع الصيانة</span>
          <select
            name="service_type"
            required
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            defaultValue="oil_change"
          >
            {SERVICE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-600">
            تاريخ الصيانة
          </span>
          <input
            name="service_date"
            required
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
          <span className="text-xs font-medium text-gray-600">
            الورشة أو المزود
          </span>
          <input
            name="provider_name"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="اختياري"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-600">
            تاريخ الاستحقاق القادم
          </span>
          <input
            name="next_due_date"
            type="date"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-gray-600">
            عداد الاستحقاق القادم
          </span>
          <input
            name="next_due_odometer_km"
            inputMode="numeric"
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="كم"
          />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs font-medium text-gray-600">ملاحظات</span>
          <textarea
            name="notes"
            rows={2}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="مثال: زيت 5W-30، تغيير فلتر الزيت، ملاحظة عن الفرامل..."
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="min-h-[44px] rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60 md:col-span-2"
        >
          {pending ? "جاري الحفظ..." : "إضافة إلى سجل الصيانة"}
        </button>
      </form>

      {message && (
        <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
          {message}
        </p>
      )}

      {upcoming.length > 0 && (
        <div className="mt-5 rounded-xl bg-emerald-50/70 p-3">
          <p className="text-sm font-bold text-emerald-900">
            أقرب مواعيد قادمة
          </p>
          <ul className="mt-2 space-y-1 text-sm text-emerald-950">
            {upcoming.map((record) => (
              <li key={record.id}>
                {SERVICE_LABELS[record.serviceType]} -{" "}
                {formatDate(record.nextDueDate)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-5">
        <h4 className="text-sm font-bold text-gray-900">السجل المحفوظ</h4>
        {records.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            لا توجد عمليات صيانة محفوظة بعد.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-100">
            {records.map((record) => (
              <li key={record.id} className="px-3 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {SERVICE_LABELS[record.serviceType]}
                      {record.vehicleLabel ? ` - ${record.vehicleLabel}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatDate(record.serviceDate)}
                      {record.odometerKm != null
                        ? ` · ${record.odometerKm.toLocaleString("ar-SA")} كم`
                        : ""}
                      {record.providerName ? ` · ${record.providerName}` : ""}
                    </p>
                    {record.notes && (
                      <p className="mt-1 text-xs text-gray-600">
                        {record.notes}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${dueTone(
                      record
                    )}`}
                  >
                    القادم:{" "}
                    {record.nextDueDate
                      ? formatDate(record.nextDueDate)
                      : record.nextDueOdometerKm != null
                        ? `${record.nextDueOdometerKm.toLocaleString("ar-SA")} كم`
                        : "غير محدد"}
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
