import type { VehicleMaintenanceRecord } from "@/types";

export type MaintenanceReminderStatus = "overdue" | "due_soon" | "upcoming";

export interface MaintenanceReminder {
  recordId: string;
  serviceType: VehicleMaintenanceRecord["serviceType"];
  vehicleLabel: string | null;
  dasmCarId: string | null;
  nextDueDate: string | null;
  nextDueOdometerKm: number | null;
  status: MaintenanceReminderStatus;
  /** موجب = متبقٍّ، سالب = متأخّر. null إن لا تاريخ استحقاق. */
  daysUntilDue: number | null;
}

/** نافذة "قريباً" بالأيام. */
export const DUE_SOON_DAYS = 30;

const DAY_MS = 1000 * 60 * 60 * 24;

function startOfDay(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * يحسب تذكيرات الصيانة من سجلّات الصيانة.
 *
 * القاعدة (أفضل ممارسة): لكل (سيارة + نوع خدمة) يُؤخذ **أحدث** سجلّ فقط —
 * لأن صيانة لاحقة تُلغي استحقاق السابقة. تُشتق حالة الاستحقاق من nextDueDate.
 * دالة نقيّة (now مُمرَّر) قابلة للاختبار.
 */
export function computeMaintenanceReminders(
  records: VehicleMaintenanceRecord[],
  now: Date = new Date()
): MaintenanceReminder[] {
  // أحدث سجلّ لكل (سيارة|نوع خدمة).
  const latestByKey = new Map<string, VehicleMaintenanceRecord>();
  for (const r of records) {
    const key = `${r.dasmCarId ?? ""}|${r.serviceType}`;
    const current = latestByKey.get(key);
    if (!current || r.serviceDate > current.serviceDate) {
      latestByKey.set(key, r);
    }
  }

  const today = startOfDay(now);
  const reminders: MaintenanceReminder[] = [];

  for (const r of Array.from(latestByKey.values())) {
    // بلا تاريخ ولا عدّاد استحقاق ⇒ لا تذكير.
    if (!r.nextDueDate && r.nextDueOdometerKm == null) continue;

    let status: MaintenanceReminderStatus = "upcoming";
    let daysUntilDue: number | null = null;

    if (r.nextDueDate) {
      const due = Date.parse(r.nextDueDate);
      if (Number.isFinite(due)) {
        daysUntilDue = Math.round((startOfDay(new Date(due)) - today) / DAY_MS);
        status =
          daysUntilDue < 0
            ? "overdue"
            : daysUntilDue <= DUE_SOON_DAYS
              ? "due_soon"
              : "upcoming";
      }
    }

    reminders.push({
      recordId: r.id,
      serviceType: r.serviceType,
      vehicleLabel: r.vehicleLabel ?? null,
      dasmCarId: r.dasmCarId ?? null,
      nextDueDate: r.nextDueDate ?? null,
      nextDueOdometerKm: r.nextDueOdometerKm ?? null,
      status,
      daysUntilDue,
    });
  }

  const rank: Record<MaintenanceReminderStatus, number> = {
    overdue: 0,
    due_soon: 1,
    upcoming: 2,
  };

  return reminders.sort((a, b) => {
    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
    // داخل نفس الحالة: الأقرب استحقاقاً أولاً (الأكثر تأخّراً أولاً في overdue).
    const av = a.daysUntilDue ?? Number.MAX_SAFE_INTEGER;
    const bv = b.daysUntilDue ?? Number.MAX_SAFE_INTEGER;
    return av - bv;
  });
}
