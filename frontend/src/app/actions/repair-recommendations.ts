"use server";

import { revalidatePath } from "next/cache";
import { assertInspectionRoles } from "@/lib/auth/access-layer.server";
import { getInspectionAuthContext } from "@/lib/auth/inspection-context.server";
import { requireAdminClient } from "@/lib/supabase/admin";

export type RepairRecommendationActionResult =
  | { ok: true }
  | { ok: false; message: string };

const SEVERITIES = new Set(["advisory", "minor", "major", "critical"]);

export async function addRepairRecommendationFormAction(
  formData: FormData
): Promise<void> {
  await addRepairRecommendationAction(formData);
}

/** إضافة توصية إصلاح لطلب فحص — للورشة/الفاحص/الإدارة فقط. */
export async function addRepairRecommendationAction(
  formData: FormData
): Promise<RepairRecommendationActionResult> {
  try {
    await assertInspectionRoles([
      "super_admin",
      "inspection_admin",
      "workshop_owner",
      "workshop_manager",
      "inspector",
      "mechanic",
    ]);
  } catch {
    return { ok: false, message: "صلاحية إضافة توصيات الإصلاح غير متوفرة." };
  }
  const role = (await getInspectionAuthContext())?.inspectionRole ?? null;

  const requestId = String(formData.get("request_id") ?? "").trim();
  const reportId = String(formData.get("report_id") ?? "").trim() || null;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const severityRaw = String(formData.get("severity") ?? "advisory").trim();
  const severity = SEVERITIES.has(severityRaw) ? severityRaw : "advisory";
  const costRaw = String(formData.get("estimated_cost_sar") ?? "").trim();

  if (!requestId) return { ok: false, message: "معرّف الطلب مطلوب." };
  if (!title) return { ok: false, message: "عنوان التوصية مطلوب." };

  let estimatedCost: number | null = null;
  if (costRaw) {
    const n = Number(costRaw);
    if (!Number.isFinite(n) || n < 0 || n > 99_999_999.99) {
      return { ok: false, message: "التكلفة التقديرية غير صالحة." };
    }
    estimatedCost = Math.round(n * 100) / 100;
  }

  const sb = requireAdminClient();
  const { error } = await sb.from("inspection_repair_recommendations").insert({
    request_id: requestId,
    report_id: reportId,
    title: title.slice(0, 200),
    description: description ? description.slice(0, 2000) : null,
    severity,
    estimated_cost_sar: estimatedCost,
    created_by_role: role,
  });

  if (error) {
    return { ok: false, message: error.message ?? "تعذّر حفظ التوصية." };
  }

  revalidatePath(`/requests/${requestId}`);
  return { ok: true };
}
