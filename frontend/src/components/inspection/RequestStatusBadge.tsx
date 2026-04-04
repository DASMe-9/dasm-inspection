"use client";

import type { InspectionRequestStatus } from "@/types";
import { TOKENS } from "@/lib/theme";
import { cn } from "@/lib/utils";

const LABELS: Record<InspectionRequestStatus, string> = {
  draft: "مسودة",
  submitted: "مُرسل",
  assigned: "مُسند",
  in_progress: "قيد التنفيذ",
  pending_review: "بانتظار المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
  cancelled: "ملغى",
};

function statusColor(s: InspectionRequestStatus): string {
  switch (s) {
    case "approved":
      return TOKENS.colors.semantic.success;
    case "rejected":
    case "cancelled":
      return TOKENS.colors.semantic.error;
    case "pending_review":
    case "submitted":
      return TOKENS.colors.semantic.warning;
    default:
      return TOKENS.colors.semantic.info;
  }
}

export function RequestStatusBadge({ status }: { status: InspectionRequestStatus }) {
  return (
    <span
      className={cn("text-xs font-medium px-2 py-1 rounded text-white")}
      style={{ backgroundColor: statusColor(status) }}
      dir="rtl"
    >
      {LABELS[status]}
    </span>
  );
}
