import { moderateWorkshopReviewFormAction } from "@/app/actions/workshop-reviews";
import { SectionCard } from "@/components/shared";
import { listPendingWorkshopReviews } from "@/lib/data/workshop-reviews-data";
import { listWorkshops } from "@/lib/data/inspection";

export async function WorkshopReviewModerationPanel() {
  const [pending, workshops] = await Promise.all([
    listPendingWorkshopReviews(),
    listWorkshops(),
  ]);
  const workshopNames = new Map(workshops.map((w) => [w.id, w.name]));

  if (pending.length === 0) {
    return (
      <SectionCard title="مراجعة تقييمات الورش">
        <p className="text-sm text-gray-600">لا تقييمات بانتظار المراجعة.</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="مراجعة تقييمات الورش">
      <ul className="space-y-4">
        {pending.map((r) => (
          <li
            key={r.id}
            className="rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3"
          >
            <p className="text-sm font-semibold text-gray-900">
              {workshopNames.get(r.workshopId) ?? r.workshopId}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              تقييم {r.rating}/5 · مستخدم {r.dasmUserId}
            </p>
            {r.comment && (
              <p className="mt-2 text-sm text-gray-800">{r.comment}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <form action={moderateWorkshopReviewFormAction}>
                <input type="hidden" name="review_id" value={r.id} />
                <input type="hidden" name="decision" value="approved" />
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  اعتماد
                </button>
              </form>
              <form action={moderateWorkshopReviewFormAction} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="review_id" value={r.id} />
                <input type="hidden" name="decision" value="rejected" />
                <input
                  name="rejection_reason"
                  placeholder="سبب الرفض (اختياري)"
                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs min-w-[12rem]"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-900"
                >
                  رفض
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
