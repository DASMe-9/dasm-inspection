"use server";

import { revalidatePath } from "next/cache";
import { assertWorkshopManageAccess } from "@/lib/auth/workshop-scope.server";
import { getAdminClient } from "@/lib/supabase/admin";

export type WorkshopFieldActionResult =
  | { ok: true }
  | { ok: false; message: string };

function mapError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "تعذّر حفظ بيانات الموعد الميداني.";
}

function parseOptionalCoord(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n;
}

function parseScheduledAt(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function saveFieldScheduleAction(
  formData: FormData
): Promise<WorkshopFieldActionResult> {
  try {
    const workshopId = String(formData.get("workshop_id") ?? "").trim();
    const requestId = String(formData.get("request_id") ?? "").trim();
    if (!workshopId || !requestId) {
      return { ok: false, message: "معرّف الورشة أو الطلب ناقص." };
    }

    await assertWorkshopManageAccess(workshopId);

    const scheduledAt = parseScheduledAt(
      String(formData.get("field_scheduled_at") ?? "")
    );
    const lat = parseOptionalCoord(String(formData.get("field_service_lat") ?? ""));
    const lng = parseOptionalCoord(String(formData.get("field_service_lng") ?? ""));

    if (lat != null && (lat < -90 || lat > 90)) {
      return { ok: false, message: "خط العرض غير صالح." };
    }
    if (lng != null && (lng < -180 || lng > 180)) {
      return { ok: false, message: "خط الطول غير صالح." };
    }
    if ((lat == null) !== (lng == null)) {
      return {
        ok: false,
        message: "أدخل خط العرض والطول معاً أو اتركهما فارغين.",
      };
    }

    const sb = getAdminClient();
    if (!sb) return { ok: false, message: "قاعدة البيانات غير متاحة." };

    const { data: existing, error: loadErr } = await sb
      .from("inspection_requests")
      .select("id, workshop_id, service_mode")
      .eq("id", requestId)
      .maybeSingle();

    if (loadErr || !existing) {
      return { ok: false, message: "الطلب غير موجود." };
    }
    if (existing.workshop_id !== workshopId) {
      return { ok: false, message: "هذا الطلب لا يخص هذه الورشة." };
    }
    if (existing.service_mode !== "field") {
      return { ok: false, message: "الطلب ليس فحصاً ميدانياً." };
    }

    const { error } = await sb
      .from("inspection_requests")
      .update({
        field_scheduled_at: scheduledAt,
        field_service_lat: lat,
        field_service_lng: lng,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) return { ok: false, message: error.message };

    revalidatePath("/workshop/field");
    revalidatePath(`/requests/${requestId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapError(e) };
  }
}

export async function saveFieldScheduleFormAction(
  formData: FormData
): Promise<void> {
  await saveFieldScheduleAction(formData);
}
