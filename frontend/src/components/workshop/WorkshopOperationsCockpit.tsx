import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CarFront,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  Clock3,
  MapPin,
  UserRoundCheck,
  UsersRound,
  Wrench,
} from "lucide-react";
import type {
  WorkshopOperationsDashboard,
  WorkshopOperationsQueueItem,
} from "@/lib/api/workshop-operations";
import type { InspectionRequestStatus } from "@/types";

type Props = {
  dashboard: WorkshopOperationsDashboard;
  canReceiveWalkIn: boolean;
};

const STATUS_LABELS: Record<InspectionRequestStatus, string> = {
  draft: "مسودة",
  submitted: "بانتظار الإسناد",
  assigned: "مُسند",
  dispatched: "المفتش في الطريق",
  on_site: "المفتش في الموقع",
  in_progress: "قيد الفحص",
  pending_review: "بانتظار الاعتماد",
  approved: "معتمد",
  rejected: "مرفوض",
  cancelled: "ملغى",
};

const STAGE_INDEX: Record<InspectionRequestStatus, number> = {
  draft: 0,
  submitted: 0,
  assigned: 1,
  dispatched: 1,
  on_site: 2,
  in_progress: 2,
  pending_review: 3,
  approved: 4,
  rejected: 4,
  cancelled: 4,
};

function formatSchedule(value: string | null): string {
  if (!value) return "دون موعد";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "دون موعد";
  return new Intl.DateTimeFormat("ar-SA-u-ca-gregory", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function StatusPill({ item }: { item: WorkshopOperationsQueueItem }) {
  const className = item.isOverdue
    ? "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
    : item.status === "pending_review"
      ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
      : item.status === "in_progress" || item.status === "on_site"
        ? "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-200"
        : "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${className}`}>
      {item.isOverdue ? "متأخر" : STATUS_LABELS[item.status]}
    </span>
  );
}

function VehicleProgressRail({ status }: { status: InspectionRequestStatus }) {
  const activeIndex = STAGE_INDEX[status];
  const labels = ["استقبال", "إسناد", "فحص", "مراجعة", "اعتماد"];

  return (
    <div className="min-w-[210px]" aria-label={`مرحلة المركبة: ${STATUS_LABELS[status]}`}>
      <div className="flex items-center gap-1" aria-hidden="true">
        {labels.map((label, index) => (
          <span
            key={label}
            className={`h-1.5 flex-1 rounded-full ${
              index <= activeIndex
                ? index === activeIndex
                  ? "bg-[#22A06B]"
                  : "bg-[#8ED9B5] dark:bg-[#326C53]"
                : "bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400">
        <span>استقبال</span>
        <span>فحص</span>
        <span>اعتماد</span>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone?: "neutral" | "danger" | "warning" | "success";
}) {
  const toneClass = {
    neutral: "text-slate-900 dark:text-white",
    danger: "text-red-700 dark:text-red-300",
    warning: "text-amber-700 dark:text-amber-300",
    success: "text-emerald-700 dark:text-emerald-300",
  }[tone];

  return (
    <div className="border-l border-slate-200 px-4 last:border-l-0 dark:border-slate-700">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <p className={`mt-2 text-3xl font-black tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}

export function WorkshopOperationsCockpit({
  dashboard,
  canReceiveWalkIn,
}: Props) {
  const { workshop, summary, queue, inspectors } = dashboard;
  const alerts = [
    summary.overdue > 0
      ? { label: `${summary.overdue} متأخر عن الموعد`, tone: "danger" as const }
      : null,
    summary.unassignedRequests > 0
      ? { label: `${summary.unassignedRequests} دون مفتش`, tone: "warning" as const }
      : null,
    summary.pendingReview > 0
      ? { label: `${summary.pendingReview} ينتظر الاعتماد`, tone: "info" as const }
      : null,
  ].filter(Boolean) as Array<{ label: string; tone: "danger" | "warning" | "info" }>;

  return (
    <div className="space-y-5" dir="rtl">
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#F8FAFC] shadow-sm dark:border-slate-700 dark:bg-[#101A29]">
        <div className="flex flex-col gap-5 border-b border-slate-200 px-5 py-5 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between lg:px-7">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#177A52] dark:text-[#76D7AA]">
              <Activity className="h-4 w-4" />
              <span>مركز قيادة الورشة</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>{workshop.isVerified ? "ورشة معتمدة" : "ورشة قيد الاعتماد"}</span>
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 dark:text-white lg:text-3xl">
              {workshop.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {workshop.city}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" /> آخر تحديث تشغيلي الآن
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/requests"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E74E8] dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <ClipboardCheck className="h-4 w-4" /> كل الطلبات
            </Link>
            {canReceiveWalkIn ? (
              <Link
                href="#walk-in-inspection"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#177A52] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#11643F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E74E8] focus-visible:ring-offset-2"
              >
                <CarFront className="h-4 w-4" /> استقبال مركبة
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-5 bg-white px-2 py-5 dark:bg-[#0D1624] md:grid-cols-4 lg:grid-cols-7">
          <Metric label="داخل التشغيل" value={summary.activeRequests} icon={<CarFront className="h-4 w-4" />} />
          <Metric label="متأخرة" value={summary.overdue} icon={<AlertTriangle className="h-4 w-4" />} tone="danger" />
          <Metric label="دون مفتش" value={summary.unassignedRequests} icon={<UsersRound className="h-4 w-4" />} tone="warning" />
          <Metric label="قيد الفحص" value={summary.inProgress} icon={<Wrench className="h-4 w-4" />} />
          <Metric label="تنتظر الاعتماد" value={summary.pendingReview} icon={<ClipboardCheck className="h-4 w-4" />} tone="warning" />
          <Metric label="مفتشون متاحون" value={summary.availableInspectors} icon={<UserRoundCheck className="h-4 w-4" />} tone="success" />
          <Metric label="فريق نشط" value={summary.activeInspectors} icon={<UsersRound className="h-4 w-4" />} />
        </div>
      </section>

      <section
        className={`flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-3 ${
          alerts.length > 0
            ? "border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/25"
            : "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/25"
        }`}
        aria-label="تنبيهات التشغيل"
      >
        {alerts.length > 0 ? (
          <>
            <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-300" />
            <span className="ml-2 text-sm font-black text-slate-900 dark:text-slate-100">يحتاج تدخلك الآن:</span>
            {alerts.map((alert) => (
              <span
                key={alert.label}
                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                  alert.tone === "danger"
                    ? "border-red-200 bg-white text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                    : alert.tone === "warning"
                      ? "border-amber-200 bg-white text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                      : "border-sky-200 bg-white text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200"
                }`}
              >
                {alert.label}
              </span>
            ))}
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />
            <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
              لا توجد حالات متأخرة أو طلبات معلّقة دون مفتش.
            </span>
          </>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">مسار المركبات الحي</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">الطلب، مرحلته الحالية، والإجراء التالي في مكان واحد.</p>
            </div>
            <Link href="/requests" className="inline-flex items-center gap-1 text-sm font-bold text-[#1E74E8] hover:underline">
              صندوق العمل <ArrowLeft className="h-4 w-4" />
            </Link>
          </header>

          {queue.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
              <div className="rounded-2xl bg-slate-100 p-4 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <CarFront className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-black text-slate-900 dark:text-white">لا توجد مركبات داخل التشغيل</h3>
              <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                استقبل مركبة زائر أو انتظر وصول أول طلب مرتبط بالورشة.
              </p>
              {canReceiveWalkIn ? (
                <Link href="#walk-in-inspection" className="mt-4 text-sm font-bold text-[#177A52] hover:underline">
                  فتح بطاقة استقبال مركبة
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-right text-sm">
                <thead className="bg-slate-50 text-xs font-bold text-slate-500 dark:bg-slate-800/70 dark:text-slate-300">
                  <tr>
                    <th className="px-5 py-3">المركبة</th>
                    <th className="px-4 py-3">الموعد</th>
                    <th className="px-4 py-3">الحالة</th>
                    <th className="px-4 py-3">مسار العمل</th>
                    <th className="px-5 py-3">الإجراء التالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {queue.map((item) => (
                    <tr key={item.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-950 dark:text-white">{item.vehicleLabel}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {item.title} · {item.serviceMode === "field" ? "فحص ميداني" : "داخل الورشة"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                          <CalendarClock className="h-4 w-4 text-slate-400" /> {formatSchedule(item.scheduledAt)}
                        </span>
                      </td>
                      <td className="px-4 py-4"><StatusPill item={item} /></td>
                      <td className="px-4 py-4"><VehicleProgressRail status={item.status} /></td>
                      <td className="px-5 py-4">
                        <Link
                          href={item.nextAction.href}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800 transition hover:border-[#177A52] hover:text-[#177A52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E74E8] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        >
                          {item.nextAction.label} <ArrowLeft className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-slate-950 dark:text-white">حالة فريق الفحص</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">الحمل الحالي لكل مفتش.</p>
            </div>
            <UsersRound className="h-5 w-5 text-slate-400" />
          </div>

          <div className="mt-4 space-y-2">
            {inspectors.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                لم يُضف مفتشون إلى هذه الورشة بعد.
              </div>
            ) : (
              inspectors.map((inspector) => (
                <div key={inspector.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        inspector.availability === "available"
                          ? "bg-emerald-500"
                          : inspector.availability === "busy"
                            ? "bg-amber-500"
                            : "bg-slate-400"
                      }`} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900 dark:text-white">{inspector.name}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                          {inspector.currentVehicle ?? (inspector.availability === "available" ? "متاح الآن" : "غير متصل")}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-black tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {inspector.workload}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link href="/workshop/team" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#1E74E8] hover:underline">
            إدارة الفريق <ArrowLeft className="h-4 w-4" />
          </Link>
        </aside>
      </div>

      <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
        <CircleDot className="h-3 w-3" />
        مصدر التشغيل: {dashboard.source === "core_laravel" ? "لارافيل المركزي" : "مصدر الفحص الانتقالي"}
      </p>
    </div>
  );
}
