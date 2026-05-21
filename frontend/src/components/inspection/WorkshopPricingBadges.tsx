import type { WorkshopServicePricing } from "@/types";
import {
  formatInspectionPriceSar,
  pricingLabelAr,
} from "@/lib/inspection-pricing";
import { Banknote, MapPinned } from "lucide-react";

export function WorkshopPricingBadges({
  pricing,
  compact = false,
}: {
  pricing?: WorkshopServicePricing;
  compact?: boolean;
}) {
  if (!pricing || (pricing.workshopSar == null && pricing.fieldSar == null)) {
    return (
      <p className="text-xs text-gray-500">الأسعار تُحدَّد عند ربط الورشة</p>
    );
  }

  const items: { mode: "workshop" | "field"; amount: number }[] = [];
  if (pricing.workshopSar != null) {
    items.push({ mode: "workshop", amount: pricing.workshopSar });
  }
  if (pricing.fieldSar != null) {
    items.push({ mode: "field", amount: pricing.fieldSar });
  }

  return (
    <ul
      className={
        compact
          ? "flex flex-wrap gap-2"
          : "grid gap-2 sm:grid-cols-2"
      }
    >
      {items.map(({ mode, amount }) => (
        <li
          key={mode}
          className="flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2 text-sm"
        >
          {mode === "workshop" ? (
            <Banknote className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
          ) : (
            <MapPinned className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-gray-500">
              {pricingLabelAr(mode)}
            </p>
            <p className="font-semibold text-gray-900">
              {formatInspectionPriceSar(amount, pricing.currency)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
