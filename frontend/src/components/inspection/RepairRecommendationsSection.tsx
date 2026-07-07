import { addRepairRecommendationFormAction } from "@/app/actions/repair-recommendations";
import { SectionCard } from "@/components/shared";
import { getInspectionAuthContext } from "@/lib/auth/inspection-context.server";
import {
  listRepairRecommendationsForRequest,
  type RepairRecommendation,
} from "@/lib/data/repair-recommendations-data";

const SEVERITY: Record<
  RepairRecommendation["severity"],
  { label: string; cls: string }
> = {
  advisory: { label: "إرشادي", cls: "bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-200" },
  minor: { label: "بسيط", cls: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300" },
  major: { label: "مهم", cls: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  critical: { label: "حرِج", cls: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" },
};

const STATUS_LABEL: Record<RepairRecommendation["status"], string> = {
  suggested: "مقترحة",
  accepted: "مقبولة",
  declined: "مرفوضة",
  completed: "منجزة",
};

const EDITOR_ROLES = new Set([
  "super_admin",
  "inspection_admin",
  "workshop_owner",
  "workshop_manager",
  "inspector",
  "mechanic",
]);

export async function RepairRecommendationsSection({
  requestId,
  reportId,
}: {
  requestId: string;
  reportId?: string | null;
}) {
  const [recommendations, ctx] = await Promise.all([
    listRepairRecommendationsForRequest(requestId),
    getInspectionAuthContext(),
  ]);
  const canEdit = !!ctx?.inspectionRole && EDITOR_ROLES.has(ctx.inspectionRole);

  if (recommendations.length === 0 && !canEdit) return null;

  return (
    <SectionCard title="توصيات الإصلاح">
      {recommendations.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-slate-400">لا توصيات إصلاح بعد.</p>
      ) : (
        <ul className="space-y-2">
          {recommendations.map((r) => {
            const sev = SEVERITY[r.severity];
            return (
              <li
                key={r.id}
                className="rounded-xl border border-gray-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{r.title}</p>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sev.cls}`}>
                      {sev.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      {STATUS_LABEL[r.status]}
                    </span>
                  </div>
                </div>
                {r.description && (
                  <p className="mt-1 text-xs text-gray-600 dark:text-slate-300">{r.description}</p>
                )}
                {r.estimatedCostSar != null && (
                  <p className="mt-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    التكلفة التقديرية: {r.estimatedCostSar.toLocaleString("en-US")} ر.س
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canEdit && (
        <form
          action={addRepairRecommendationFormAction}
          className="mt-4 grid gap-3 border-t border-gray-100 pt-4 dark:border-slate-700 sm:grid-cols-2"
        >
          <input type="hidden" name="request_id" value={requestId} />
          {reportId && <input type="hidden" name="report_id" value={reportId} />}
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-gray-600 dark:text-slate-300">العنوان</span>
            <input
              name="title"
              required
              maxLength={200}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              placeholder="مثال: استبدال تيل الفرامل الأمامي"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-gray-600 dark:text-slate-300">الوصف (اختياري)</span>
            <textarea
              name="description"
              maxLength={2000}
              rows={2}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-600 dark:text-slate-300">الأهمية</span>
            <select
              name="severity"
              defaultValue="advisory"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="advisory">إرشادي</option>
              <option value="minor">بسيط</option>
              <option value="major">مهم</option>
              <option value="critical">حرِج</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-600 dark:text-slate-300">التكلفة التقديرية (ر.س)</span>
            <input
              name="estimated_cost_sar"
              type="number"
              min="0"
              step="0.01"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              placeholder="اختياري"
            />
          </label>
          <button
            type="submit"
            className="sm:col-span-2 rounded-xl bg-[#1E74E8] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1857b8]"
          >
            إضافة توصية
          </button>
        </form>
      )}
    </SectionCard>
  );
}
