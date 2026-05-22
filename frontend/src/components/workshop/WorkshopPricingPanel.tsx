"use client";

import { useState } from "react";
import { saveWorkshopPricingAction } from "@/app/actions/workshop-management";
import {
  formatInspectionPriceSar,
  pricingLabelAr,
} from "@/lib/inspection-pricing";
import type { WorkshopPricingOverride } from "@/types/workshop-management";

export function WorkshopPricingPanel({
  workshopId,
  workshopSlug,
  pricing,
}: {
  workshopId: string;
  workshopSlug: string;
  pricing: WorkshopPricingOverride;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 text-sm text-amber-900">
        <p className="font-semibold">أسعار المنصّة (مرجع)</p>
        <ul className="mt-2 space-y-1">
          <li>
            {pricingLabelAr("workshop")}:{" "}
            {pricing.platformWorkshopSar != null
              ? formatInspectionPriceSar(pricing.platformWorkshopSar, pricing.currency)
              : "—"}
          </li>
          <li>
            {pricingLabelAr("field")}:{" "}
            {pricing.platformFieldSar != null
              ? formatInspectionPriceSar(pricing.platformFieldSar, pricing.currency)
              : "—"}
          </li>
        </ul>
        <p className="mt-2 text-xs text-amber-800/80">
          اترك الحقل فارغًا لاستخدام سعر المنصّة الافتراضي لتلك الخدمة.
        </p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-gray-900">أسعار الورشة</h2>
        <form
          className="grid max-w-md gap-4"
          action={async (fd) => {
            setPending(true);
            setMessage(null);
            const r = await saveWorkshopPricingAction(fd);
            setMessage(r.ok ? "تم حفظ الأسعار." : r.message);
            setPending(false);
          }}
        >
          <input type="hidden" name="workshop_id" value={workshopId} />
          <input type="hidden" name="workshop_slug" value={workshopSlug} />
          <input type="hidden" name="currency" value={pricing.currency} />

          <label className="block">
            <span className="text-xs font-medium text-gray-600">
              {pricingLabelAr("workshop")} (ريال)
            </span>
            <input
              name="workshop_sar"
              type="number"
              min={0}
              step="0.01"
              defaultValue={pricing.workshopSar ?? ""}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder={
                pricing.platformWorkshopSar != null
                  ? String(pricing.platformWorkshopSar)
                  : ""
              }
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-600">
              {pricingLabelAr("field")} (ريال)
            </span>
            <input
              name="field_sar"
              type="number"
              min={0}
              step="0.01"
              defaultValue={pricing.fieldSar ?? ""}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder={
                pricing.platformFieldSar != null
                  ? String(pricing.platformFieldSar)
                  : ""
              }
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-800 disabled:opacity-60"
          >
            {pending ? "جارٍ الحفظ…" : "حفظ الأسعار"}
          </button>
        </form>
        {message && (
          <p className="mt-3 text-sm text-gray-600" role="status">
            {message}
          </p>
        )}
      </section>
    </div>
  );
}
