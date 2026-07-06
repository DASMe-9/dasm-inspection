"use server";

import { revalidatePath } from "next/cache";
import { getInspectionAuthContext } from "@/lib/auth/inspection-context.server";
import { getInspectionRequest } from "@/lib/data/inspection";
import { requireAdminClient } from "@/lib/supabase/admin";

export type SendMessageResult = { ok: true } | { ok: false; message: string };

const STAFF_ROLES = new Set([
  "super_admin",
  "inspection_admin",
  "workshop_owner",
  "workshop_manager",
  "inspector",
  "mechanic",
]);

export async function sendRequestMessageFormAction(
  formData: FormData
): Promise<void> {
  await sendRequestMessageAction(formData);
}

/** إرسال رسالة على خيط طلب — لصاحب الطلب أو للورشة/الفاحص/الإدارة فقط. */
export async function sendRequestMessageAction(
  formData: FormData
): Promise<SendMessageResult> {
  const ctx = await getInspectionAuthContext();
  if (!ctx?.userId) {
    return { ok: false, message: "الدخول مطلوب لإرسال رسالة." };
  }

  const requestId = String(formData.get("request_id") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!requestId) return { ok: false, message: "معرّف الطلب مطلوب." };
  if (!body) return { ok: false, message: "الرسالة فارغة." };

  const req = await getInspectionRequest(requestId);
  if (!req) return { ok: false, message: "الطلب غير موجود." };

  const role = ctx.inspectionRole ?? null;
  const isStaff = !!role && STAFF_ROLES.has(role);
  const isOwner = !!req.dasm_user_id && req.dasm_user_id === ctx.userId;
  if (!isStaff && !isOwner) {
    return { ok: false, message: "غير مصرّح بالمراسلة على هذا الطلب." };
  }

  const sb = requireAdminClient();
  const { error } = await sb.from("inspection_request_messages").insert({
    request_id: requestId,
    sender_dasm_user_id: ctx.userId,
    sender_role: role,
    body: body.slice(0, 4000),
  });

  if (error) {
    return { ok: false, message: error.message ?? "تعذّر إرسال الرسالة." };
  }

  revalidatePath(`/requests/${requestId}`);
  return { ok: true };
}
