"use server";

import { revalidatePath } from "next/cache";
import { assertWorkshopManageAccess } from "@/lib/auth/workshop-scope.server";
import { requireAdminClient } from "@/lib/supabase/admin";
import type { InspectionServiceMode } from "@/types";

export type WorkshopManageResult =
  | { ok: true }
  | { ok: false; message: string };

function mapError(e: unknown): string {
  if (e instanceof Error) {
    if (e.message === "INSPECTION_AUTH_REQUIRED") {
      return "انتهت الجلسة — سجّل الدخول من جديد.";
    }
    if (e.message === "INSPECTION_FORBIDDEN") {
      return "ليس لديك صلاحية إدارة هذه الورشة.";
    }
    return e.message;
  }
  return "خطأ غير متوقع";
}

function revalidateWorkshopPaths(workshopId: string, slug?: string) {
  revalidatePath("/workshop");
  revalidatePath("/workshop/team");
  revalidatePath("/workshop/pricing");
  revalidatePath("/workshop/areas");
  revalidatePath(`/requests?workshop=${workshopId}`);
  if (slug) revalidatePath(`/workshops/${slug}`);
}

function parsePrice(raw: string): number | null {
  const v = raw.trim();
  if (!v) return null;
  const n = Number.parseFloat(v.replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

async function deactivateWorkshopPricing(
  workshopId: string,
  mode: InspectionServiceMode
) {
  const sb = requireAdminClient();
  await sb
    .from("inspection_service_pricing")
    .update({ is_active: false })
    .eq("workshop_id", workshopId)
    .eq("service_mode", mode)
    .eq("is_active", true);
}

async function upsertWorkshopPricing(
  workshopId: string,
  mode: InspectionServiceMode,
  priceSar: number | null,
  currency: string
) {
  const sb = requireAdminClient();
  await deactivateWorkshopPricing(workshopId, mode);
  if (priceSar == null) return;
  const { error } = await sb.from("inspection_service_pricing").insert({
    workshop_id: workshopId,
    service_mode: mode,
    price_sar: priceSar,
    currency: currency || "SAR",
    is_active: true,
  });
  if (error) throw new Error(error.message);
}

export async function addWorkshopInspectorAction(
  formData: FormData
): Promise<WorkshopManageResult> {
  try {
    const workshopId = String(formData.get("workshop_id") ?? "").trim();
    const fullName = String(formData.get("full_name") ?? "").trim();
    const dasmUserId = String(formData.get("dasm_user_id") ?? "").trim();
    const workshopSlug = String(formData.get("workshop_slug") ?? "").trim();

    if (!workshopId || !fullName) {
      return { ok: false, message: "اسم المفتش مطلوب." };
    }

    await assertWorkshopManageAccess(workshopId);

    const sb = requireAdminClient();
    const { error } = await sb.from("inspection_inspectors").insert({
      workshop_id: workshopId,
      full_name: fullName,
      dasm_user_id: dasmUserId || null,
      active: true,
    });
    if (error) return { ok: false, message: error.message };

    revalidateWorkshopPaths(workshopId, workshopSlug || undefined);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapError(e) };
  }
}

export async function setWorkshopInspectorActiveAction(
  formData: FormData
): Promise<WorkshopManageResult> {
  try {
    const workshopId = String(formData.get("workshop_id") ?? "").trim();
    const inspectorId = String(formData.get("inspector_id") ?? "").trim();
    const active = String(formData.get("active") ?? "") === "1";
    const workshopSlug = String(formData.get("workshop_slug") ?? "").trim();

    if (!workshopId || !inspectorId) {
      return { ok: false, message: "بيانات غير مكتملة." };
    }

    await assertWorkshopManageAccess(workshopId);

    const sb = requireAdminClient();
    const { error } = await sb
      .from("inspection_inspectors")
      .update({ active })
      .eq("id", inspectorId)
      .eq("workshop_id", workshopId);
    if (error) return { ok: false, message: error.message };

    revalidateWorkshopPaths(workshopId, workshopSlug || undefined);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapError(e) };
  }
}

export async function saveWorkshopPricingAction(
  formData: FormData
): Promise<WorkshopManageResult> {
  try {
    const workshopId = String(formData.get("workshop_id") ?? "").trim();
    const workshopSlug = String(formData.get("workshop_slug") ?? "").trim();
    const currency = String(formData.get("currency") ?? "SAR").trim() || "SAR";
    const workshopPrice = parsePrice(String(formData.get("workshop_sar") ?? ""));
    const fieldPrice = parsePrice(String(formData.get("field_sar") ?? ""));

    if (!workshopId) return { ok: false, message: "معرف الورشة مطلوب." };

    await assertWorkshopManageAccess(workshopId);

    await upsertWorkshopPricing(workshopId, "workshop", workshopPrice, currency);
    await upsertWorkshopPricing(workshopId, "field", fieldPrice, currency);

    revalidateWorkshopPaths(workshopId, workshopSlug || undefined);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapError(e) };
  }
}

export async function addWorkshopServiceAreaAction(
  formData: FormData
): Promise<WorkshopManageResult> {
  try {
    const workshopId = String(formData.get("workshop_id") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const district = String(formData.get("district") ?? "").trim();
    const supportsWorkshop = formData.get("supports_workshop") === "on";
    const supportsField = formData.get("supports_field") === "on";
    const isPrimary = formData.get("is_primary") === "on";
    const workshopSlug = String(formData.get("workshop_slug") ?? "").trim();

    if (!workshopId || !city) {
      return { ok: false, message: "اسم المدينة مطلوب." };
    }
    if (!supportsWorkshop && !supportsField) {
      return { ok: false, message: "اختر نوع خدمة واحدًا على الأقل." };
    }

    await assertWorkshopManageAccess(workshopId);

    const sb = requireAdminClient();

    if (isPrimary) {
      await sb
        .from("inspection_workshop_service_areas")
        .update({ is_primary: false })
        .eq("workshop_id", workshopId);
    }

    const { error } = await sb.from("inspection_workshop_service_areas").insert({
      workshop_id: workshopId,
      city,
      district: district || null,
      supports_workshop: supportsWorkshop,
      supports_field: supportsField,
      is_primary: isPrimary,
    });
    if (error) return { ok: false, message: error.message };

    revalidateWorkshopPaths(workshopId, workshopSlug || undefined);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapError(e) };
  }
}

export async function removeWorkshopServiceAreaAction(
  formData: FormData
): Promise<WorkshopManageResult> {
  try {
    const workshopId = String(formData.get("workshop_id") ?? "").trim();
    const areaId = String(formData.get("area_id") ?? "").trim();
    const workshopSlug = String(formData.get("workshop_slug") ?? "").trim();

    if (!workshopId || !areaId) {
      return { ok: false, message: "بيانات غير مكتملة." };
    }

    await assertWorkshopManageAccess(workshopId);

    const sb = requireAdminClient();
    const { error } = await sb
      .from("inspection_workshop_service_areas")
      .delete()
      .eq("id", areaId)
      .eq("workshop_id", workshopId);
    if (error) return { ok: false, message: error.message };

    revalidateWorkshopPaths(workshopId, workshopSlug || undefined);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: mapError(e) };
  }
}

export async function addInspectorFormAction(formData: FormData): Promise<void> {
  await addWorkshopInspectorAction(formData);
}

export async function savePricingFormAction(formData: FormData): Promise<void> {
  await saveWorkshopPricingAction(formData);
}

export async function addAreaFormAction(formData: FormData): Promise<void> {
  await addWorkshopServiceAreaAction(formData);
}

export async function removeAreaFormAction(formData: FormData): Promise<void> {
  await removeWorkshopServiceAreaAction(formData);
}

export async function setInspectorActiveFormAction(
  formData: FormData
): Promise<void> {
  await setWorkshopInspectorActiveAction(formData);
}
