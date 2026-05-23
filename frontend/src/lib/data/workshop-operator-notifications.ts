import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";

export async function notifyInspectionUserInApp(input: {
  dasmUserId: string;
  workshopId?: string | null;
  kind: string;
  title: string;
  body: string;
}): Promise<void> {
  const uid = input.dasmUserId.trim();
  if (!uid) return;

  const sb = getAdminClient();
  if (!sb) return;

  await sb.from("inspection_notifications").insert({
    dasm_user_id: uid,
    workshop_id: input.workshopId ?? null,
    kind: input.kind,
    title: input.title,
    body: input.body,
  });
}

/** يُستدعى بعد إرسال تقرير للمراجعة — إشعار داخلي لمالك/مدير الورشة إن وُجد user id في JWT لاحقاً عبر polling. */
export async function notifyWorkshopPendingReview(input: {
  workshopId: string;
  requestId: string;
  requestTitle: string;
  operatorUserId?: string | null;
}): Promise<void> {
  if (!input.operatorUserId?.trim()) return;

  await notifyInspectionUserInApp({
    dasmUserId: input.operatorUserId,
    workshopId: input.workshopId,
    kind: "report_pending_review",
    title: "تقرير بانتظار الاعتماد",
    body: `طلب «${input.requestTitle}» جاهز للمراجعة والاعتماد.`,
  });
}
