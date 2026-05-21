import type { InspectionRequestStatus } from "@/types";

/** حالات يسمح فيها للورشة بتسجيل/تعديل عرض إصلاح (منفصل عن رسوم الفحص). */
export const REPAIR_QUOTE_EDIT_STATUSES: InspectionRequestStatus[] = [
  "in_progress",
  "pending_review",
  "approved",
];

export function canEditRepairQuote(status: InspectionRequestStatus): boolean {
  return REPAIR_QUOTE_EDIT_STATUSES.includes(status);
}

export function parseRepairQuoteSar(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n) || n < 0) return null;
  if (n > 9_999_999.99) return null;
  return Math.round(n * 100) / 100;
}

export function normalizeRepairQuoteNotes(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  return s.slice(0, 2000);
}
