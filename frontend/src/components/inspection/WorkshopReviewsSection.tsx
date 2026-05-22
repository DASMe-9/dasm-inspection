import { SectionCard } from "@/components/shared";
import { WorkshopReviewForm } from "@/components/inspection/WorkshopReviewForm";
import { resolveDasmUserId } from "@/lib/auth/resolve-dasm-user-id.server";
import {
  listApprovedWorkshopReviews,
  listEligibleReviewRequests,
} from "@/lib/data/workshop-reviews-data";
import { averageWorkshopRating } from "@/lib/workshop-reviews";
import { Star } from "lucide-react";

export async function WorkshopReviewsSection({
  workshopId,
  workshopSlug,
}: {
  workshopId: string;
  workshopSlug: string;
}) {
  const [reviews, dasmUserId] = await Promise.all([
    listApprovedWorkshopReviews(workshopId),
    resolveDasmUserId(),
  ]);
  const eligible = dasmUserId
    ? await listEligibleReviewRequests(dasmUserId, workshopId)
    : [];
  const summary = averageWorkshopRating(reviews.map((r) => r.rating));

  return (
    <div className="space-y-6">
      <SectionCard title="تقييمات العملاء">
        {summary ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 font-bold text-amber-700">
              <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden />
              {summary.average}
            </span>
            <span className="text-gray-600">({summary.count} تقييم معتمد)</span>
          </div>
        ) : (
          <p className="mb-4 text-sm text-gray-600">لا تقييمات منشورة بعد.</p>
        )}

        {reviews.length > 0 && (
          <ul className="mb-6 space-y-3">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3"
              >
                <div className="flex items-center gap-1 text-amber-600">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" aria-hidden />
                  ))}
                  <span className="sr-only">{r.rating} من 5</span>
                </div>
                {r.comment && (
                  <p className="mt-2 text-sm text-gray-800 leading-relaxed">{r.comment}</p>
                )}
                <p className="mt-1 text-[10px] text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString("ar-SA")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="أضف تقييماً">
        <p className="mb-3 text-xs text-gray-600">
          يُقبل التقييم فقط بعد اعتماد تقرير فحصك مع هذه الورشة؛ يمرّ بمراجعة قبل الظهور
          للعامة.
        </p>
        <WorkshopReviewForm
          workshopId={workshopId}
          workshopSlug={workshopSlug}
          eligibleRequests={eligible}
          dasmUserId={dasmUserId}
        />
      </SectionCard>
    </div>
  );
}
