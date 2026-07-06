"use client";

import { useState, useTransition } from "react";
import { submitWorkshopReviewAction } from "@/app/actions/workshop-reviews";
import type { EligibleReviewRequest } from "@/lib/data/workshop-reviews-data";
import { Star } from "lucide-react";

export function WorkshopReviewForm({
  workshopId,
  workshopSlug,
  eligibleRequests,
  dasmUserId,
}: {
  workshopId: string;
  workshopSlug: string;
  eligibleRequests: EligibleReviewRequest[];
  dasmUserId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [rating, setRating] = useState(5);

  if (!dasmUserId) {
    return (
      <p className="text-sm text-gray-600">
        بعد تسجيل الدخول عبر داسم يمكنك تقييم الورشة إذا كان لديك فحص معتمد هنا.
      </p>
    );
  }

  if (eligibleRequests.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        لا يوجد طلب فحص معتمد مؤهل للتقييم لهذه الورشة، أو سبق أن أرسلت تقييماً.
      </p>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        const fd = new FormData(e.currentTarget);
        fd.set("rating", String(rating));
        startTransition(async () => {
          const res = await submitWorkshopReviewAction(fd);
          if (res.ok) {
            setOk(true);
            setMessage("شكراً — سيُراجع التقييم قبل النشر.");
          } else {
            setOk(false);
            setMessage(res.message);
          }
        });
      }}
    >
      <input type="hidden" name="workshop_id" value={workshopId} />
      <input type="hidden" name="workshop_slug" value={workshopSlug} />

      <div>
        <label htmlFor="inspection_request_id" className="text-xs font-medium text-gray-600">
          طلب الفحص المعتمد
        </label>
        <select
          id="inspection_request_id"
          name="inspection_request_id"
          required
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          defaultValue={eligibleRequests[0]?.id}
        >
          {eligibleRequests.map((r) => (
            <option key={r.id} value={r.id}>
              {r.vehicleLabel} — {r.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">التقييم</p>
        <div className="flex gap-1" role="radiogroup" aria-label="التقييم من 1 إلى 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className="rounded p-1 transition hover:bg-amber-50"
              aria-label={`${n} من 5`}
              aria-pressed={rating === n}
            >
              <Star
                className={`h-6 w-6 ${
                  n <= rating ? "fill-amber-400 text-amber-500" : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="text-xs font-medium text-gray-600">
          تعليق (اختياري)
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={3}
          maxLength={2000}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          placeholder="صف تجربتك مع الورشة بعد اعتماد الفحص"
        />
      </div>

      <button
        type="submit"
        disabled={pending || ok}
        className="rounded-xl bg-[#1E74E8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1857b8] disabled:opacity-60"
      >
        {pending ? "جاري الإرسال…" : ok ? "تم الإرسال" : "إرسال التقييم للمراجعة"}
      </button>

      {message && (
        <p
          className={`text-sm ${ok ? "text-emerald-700" : "text-red-600"}`}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}
