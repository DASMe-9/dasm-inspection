import { SectionCard } from "@/components/shared";
import {
  computeMaintenanceReminders,
  type MaintenanceReminder,
} from "@/lib/maintenance-reminders";
import type { VehicleMaintenanceRecord } from "@/types";

const SERVICE_LABELS: Record<string, string> = {
  oil_change: "تغيير الزيت",
  oil_filter: "فلتر الزيت",
  air_filter: "فلتر الهواء",
  cabin_filter: "فلتر المقصورة",
  fuel_filter: "فلتر الوقود",
  tires: "الإطارات",
  brakes: "الفرامل",
  battery: "البطارية",
  coolant: "سائل التبريد",
  transmission: "ناقل الحركة",
  obd_scan: "فحص OBD",
  periodic_inspection: "الفحص الدوري",
  other: "أخرى",
};

const STYLES: Record<
  MaintenanceReminder["status"],
  { badge: string; card: string; label: string }
> = {
  overdue: {
    badge: "bg-red-100 text-red-700",
    card: "border-red-200 bg-red-50/50",
    label: "متأخّرة",
  },
  due_soon: {
    badge: "bg-amber-100 text-amber-800",
    card: "border-amber-200 bg-amber-50/50",
    label: "قريباً",
  },
  upcoming: {
    badge: "bg-gray-100 text-gray-600",
    card: "border-gray-200 bg-white",
    label: "لاحقاً",
  },
};

function dueText(r: MaintenanceReminder): string {
  if (r.daysUntilDue == null) {
    return r.nextDueOdometerKm != null
      ? `عند ${r.nextDueOdometerKm.toLocaleString("en-US")} كم`
      : "";
  }
  if (r.daysUntilDue < 0) return `متأخّرة ${Math.abs(r.daysUntilDue)} يوم`;
  if (r.daysUntilDue === 0) return "مستحقّة اليوم";
  return `خلال ${r.daysUntilDue} يوم`;
}

export function MaintenanceReminders({
  records,
}: {
  records: VehicleMaintenanceRecord[];
}) {
  // نعرض المتأخّر والقريب فقط (الأكثر أهمية للعميل).
  const reminders = computeMaintenanceReminders(records).filter(
    (r) => r.status === "overdue" || r.status === "due_soon"
  );

  if (reminders.length === 0) return null;

  return (
    <SectionCard title="تذكيرات الصيانة">
      <div className="space-y-2">
        {reminders.map((r) => {
          const s = STYLES[r.status];
          return (
            <div
              key={r.recordId}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 ${s.card}`}
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {SERVICE_LABELS[r.serviceType] ?? r.serviceType}
                  {r.vehicleLabel ? ` — ${r.vehicleLabel}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-gray-600">{dueText(r)}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.badge}`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
