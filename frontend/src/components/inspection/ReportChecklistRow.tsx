"use client";

import type { InspectionReportItem } from "@/types";
import { TOKENS } from "@/lib/theme";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<InspectionReportItem["status"], string> = {
  pass: "مطابق",
  warn: "ملاحظة",
  fail: "غير مطابق",
  na: "لا ينطبق",
};

export function ReportChecklistRow({ item }: { item: InspectionReportItem }) {
  const color =
    item.status === "pass"
      ? TOKENS.colors.semantic.success
      : item.status === "warn"
        ? TOKENS.colors.semantic.warning
        : item.status === "fail"
          ? TOKENS.colors.semantic.error
          : "#9CA3AF";

  return (
    <div
      className={cn("rounded-lg border p-3 bg-white")}
      style={{ borderColor: color }}
      dir="rtl"
    >
      <div className="flex justify-between gap-2">
        <div>
          <p className="text-xs text-gray-500">{item.section}</p>
          <p className="font-medium">{item.label}</p>
          {item.notes && (
            <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
          )}
        </div>
        <span
          className="text-xs font-medium px-2 py-1 rounded text-white shrink-0 h-fit"
          style={{ backgroundColor: color }}
        >
          {STATUS_LABEL[item.status]}
        </span>
      </div>
    </div>
  );
}
