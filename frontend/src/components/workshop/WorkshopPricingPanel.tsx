"use client";

import { useState } from "react";
import { saveWorkshopPricingAction } from "@/app/actions/workshop-management";
import {
  formatInspectionPriceSar,
  pricingLabelAr,
} from "@/lib/inspection-pricing";
import { workshopUi } from "@/lib/workshop-ui";
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
      <section className={workshopUi.callout}>
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
        <p className={workshopUi.calloutHint}>
          اترك الحقل فارغًا لاستخدام سعر المنصّة الافتراضي لتلك الخدمة.
        </p>
      </section>

      <section className={workshopUi.card}>
        <h2 className={workshopUi.cardTitle}>أسعار الورشة</h2>
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
            <span className={workshopUi.label}>
              {pricingLabelAr("workshop")} (ريال)
            </span>
            <input
              name="workshop_sar"
              type="number"
              min={0}
              step="0.01"
              defaultValue={pricing.workshopSar ?? ""}
              className={workshopUi.input}
              placeholder={
                pricing.platformWorkshopSar != null
                  ? String(pricing.platformWorkshopSar)
                  : ""
              }
            />
          </label>

          <label className="block">
            <span className={workshopUi.label}>
              {pricingLabelAr("field")} (ريال)
            </span>
            <input
              name="field_sar"
              type="number"
              min={0}
              step="0.01"
              defaultValue={pricing.fieldSar ?? ""}
              className={workshopUi.input}
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
            className={workshopUi.primaryBtn}
          >
            {pending ? "جارٍ الحفظ…" : "حفظ الأسعار"}
          </button>
        </form>
        {message && (
          <p className={`mt-3 ${workshopUi.muted}`} role="status">
            {message}
          </p>
        )}
      </section>
    </div>
  );
}
