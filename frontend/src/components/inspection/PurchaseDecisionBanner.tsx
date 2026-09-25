import type { PurchaseDecision } from "@/lib/inspection/purchase-decision";

const TONE: Record<PurchaseDecision["code"], string> = {
  suitable:
    "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-100",
  negotiate:
    "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/35 dark:text-amber-100",
  high_risk:
    "border-red-300 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/35 dark:text-red-100",
};

export function PurchaseDecisionBanner({
  decision,
}: {
  decision: PurchaseDecision;
}) {
  return (
    <div className={`rounded-lg border p-4 ${TONE[decision.code]}`}>
      <p className="text-xs font-medium opacity-75">قرار الشراء الملخص</p>
      <p className="mt-1 text-xl font-bold">{decision.label}</p>
      <p className="mt-1 text-sm leading-relaxed opacity-90">{decision.summary}</p>
      <p className="mt-2 text-[11px] opacity-70">
        قرار إرشادي مبني على نتائج التقرير المعتمد، وليس ضماناً لحالة المركبة أو سعراً نهائياً.
      </p>
    </div>
  );
}
