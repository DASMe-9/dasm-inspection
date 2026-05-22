import { rowsToCsv } from "@/lib/csv-format";
import type { InspectionRequest } from "@/types";
import type { WorkshopFollower } from "@/types/workshop-insights";
import type { WorkshopReview } from "@/types";

const REVIEW_STATUS_AR: Record<WorkshopReview["status"], string> = {
  pending: "بانتظار المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
};

export function buildRequestsCsv(requests: InspectionRequest[]): string {
  const header = [
    "معرف الطلب",
    "العنوان",
    "المركبة",
    "الحالة",
    "نوع الخدمة",
    "معرف المستخدم",
    "معرف المفتش",
    "تاريخ الإنشاء",
    "آخر تحديث",
  ];
  const rows = requests.map((r) => [
    r.id,
    r.title,
    r.vehicleLabel,
    r.status,
    r.serviceMode,
    r.dasm_user_id ?? "",
    r.inspectorId ?? "",
    r.createdAt,
    r.updatedAt,
  ]);
  return rowsToCsv([header, ...rows]);
}

export function buildReviewsCsv(reviews: WorkshopReview[]): string {
  const header = [
    "معرف التقييم",
    "التقييم",
    "الحالة",
    "التعليق",
    "معرف المستخدم",
    "معرف الطلب",
    "تاريخ الإرسال",
  ];
  const rows = reviews.map((r) => [
    r.id,
    String(r.rating),
    REVIEW_STATUS_AR[r.status],
    r.comment ?? "",
    r.dasmUserId,
    r.inspectionRequestId,
    r.createdAt,
  ]);
  return rowsToCsv([header, ...rows]);
}

export function buildFollowersCsv(followers: WorkshopFollower[]): string {
  const header = ["معرف المتابع", "معرف مستخدم داسم", "تاريخ المتابعة"];
  const rows = followers.map((f) => [f.id, f.dasmUserId, f.createdAt]);
  return rowsToCsv([header, ...rows]);
}

/** UTF-8 BOM helps Excel open Arabic headers correctly. */
export function csvResponseBody(csv: string): string {
  return `\uFEFF${csv}`;
}
