import type { InspectionRequestStatus } from "@/types";

/** قيم مسموحة في Query لفلترة الحالة */
export const INSPECTION_REQUEST_STATUS_VALUES: readonly InspectionRequestStatus[] =
  [
    "draft",
    "submitted",
    "assigned",
    "in_progress",
    "pending_review",
    "approved",
    "rejected",
    "cancelled",
  ] as const;

export const INSPECTION_REQUEST_STATUS_LABELS: Record<
  InspectionRequestStatus,
  string
> = {
  draft: "مسودة",
  submitted: "مُقدَّم",
  assigned: "مُسنَّد",
  in_progress: "قيد الفحص",
  pending_review: "بانتظار المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
  cancelled: "ملغى",
};

export type ListInspectionRequestsQueryOptions = {
  status?: InspectionRequestStatus;
  sort?: "updated_desc" | "created_desc";
  /** فلترة اختيارية بالورشة (معرف UUID). */
  workshopId?: string;
};

const WORKSHOP_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function singleParam(
  sp: Record<string, string | string[] | undefined> | undefined,
  key: string
): string | undefined {
  const v = sp?.[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

/** يقرأ `sort` و`status` من query (لصفحات `/requests` و`/my-inspections`). */
export function parseInspectionRequestListQuery(
  sp: Record<string, string | string[] | undefined> | undefined
): ListInspectionRequestsQueryOptions {
  const sortRaw = singleParam(sp, "sort");
  const sort: "updated_desc" | "created_desc" =
    sortRaw === "created" ? "created_desc" : "updated_desc";

  const statusRaw = singleParam(sp, "status")?.trim();
  let status: InspectionRequestStatus | undefined;
  if (
    statusRaw &&
    (INSPECTION_REQUEST_STATUS_VALUES as readonly string[]).includes(statusRaw)
  ) {
    status = statusRaw as InspectionRequestStatus;
  }

  const workshopRaw = singleParam(sp, "workshop")?.trim();
  const workshopId =
    workshopRaw && WORKSHOP_UUID_RE.test(workshopRaw) ? workshopRaw : undefined;

  return {
    sort,
    ...(status ? { status } : {}),
    ...(workshopId ? { workshopId } : {}),
  };
}
