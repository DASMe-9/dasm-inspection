import type { ReportItemStatus } from "@/types";

export type PurchaseDecisionCode = "suitable" | "negotiate" | "high_risk";

export type PurchaseDecision = {
  code: PurchaseDecisionCode;
  label: string;
  summary: string;
};

export function derivePurchaseDecision(
  items: Array<{ status: ReportItemStatus }>
): PurchaseDecision {
  if (items.some((item) => item.status === "fail")) {
    return {
      code: "high_risk",
      label: "عالي المخاطر",
      summary: "يتضمن التقرير أعطالاً تستلزم فحص تكلفة الإصلاح قبل قرار الشراء.",
    };
  }

  if (items.some((item) => item.status === "warn")) {
    return {
      code: "negotiate",
      label: "يحتاج تفاوضاً",
      summary: "توجد ملاحظات يمكن استخدامها لتقدير الإصلاح والتفاوض على السعر.",
    };
  }

  if (!items.some((item) => item.status === "pass")) {
    return {
      code: "negotiate",
      label: "يحتاج تفاوضاً",
      summary: "لا تتوفر نتائج كافية لاتخاذ قرار شراء مطمئن؛ اطلب استكمال الفحص أولاً.",
    };
  }

  return {
    code: "suitable",
    label: "مناسب",
    summary: "لم يسجل التقرير المعتمد أعطالاً أو ملاحظات مؤثرة على قرار الشراء.",
  };
}
