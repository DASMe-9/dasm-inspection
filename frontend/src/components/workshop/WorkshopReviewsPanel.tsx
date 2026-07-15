import Link from "next/link";
import { SectionCard } from "@/components/shared";
import type { WorkshopReview } from "@/types";

const STATUS_STYLES: Record<
  WorkshopReview["status"],
  { label: string; className: string }
> = {
  pending: {
    label: "بانتظار المراجعة",
    className:
      "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  },
  approved: {
    label: "معتمد — يظهر للعامة",
    className:
      "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
  },
  rejected: {
    label: "مرفوض",
    className: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  },
};

export function WorkshopReviewsPanel({
  reviews,
  pendingCount,
}: {
  reviews: WorkshopReview[];
  pendingCount: number;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        التقييمات المعتمدة تظهر في{" "}
        <span className="font-medium text-slate-800 dark:text-slate-200">
          الصفحة العامة
        </span>{" "}
        للورشة. المراجعة والاعتماد يتمّان من إدارة المنصّة في الإعدادات.
        {pendingCount > 0 && (
          <span className="mr-1 font-semibold text-amber-800 dark:text-amber-300">
            {" "}
            ({pendingCount} بانتظار المراجعة)
          </span>
        )}
      </p>

      {reviews.length === 0 ? (
        <SectionCard>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            لا توجد تقييمات بعد.
          </p>
        </SectionCard>
      ) : (
        <SectionCard title={`التقييمات (${reviews.length})`}>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {reviews.map((r) => {
              const st = STATUS_STYLES[r.status];
              return (
                <li key={r.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {r.rating}/5
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        مستخدم {r.dasmUserId}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.className}`}
                    >
                      {st.label}
                    </span>
                  </div>
                  {r.comment && (
                    <p className="mt-2 text-sm text-slate-800 dark:text-slate-200">
                      {r.comment}
                    </p>
                  )}
                  {r.status === "rejected" && r.rejectionReason && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      سبب الرفض: {r.rejectionReason}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {new Date(r.createdAt).toLocaleString("ar-SA")}
                  </p>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400">
        إدارة المنصّة:{" "}
        <Link
          href="/settings"
          className="font-semibold text-[#1E74E8] hover:underline"
        >
          الإعدادات → مراجعة التقييمات
        </Link>
      </p>
    </div>
  );
}
