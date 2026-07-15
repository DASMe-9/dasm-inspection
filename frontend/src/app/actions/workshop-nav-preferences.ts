"use server";

import { revalidatePath } from "next/cache";
import { assertInspectionRoles } from "@/lib/auth/access-layer.server";
import {
  parseHiddenNavKeys,
  WORKSHOP_CUSTOMIZABLE_NAV_KEYS,
  type WorkshopCustomizableNavKey,
} from "@/lib/auth/workshop-nav-preferences";
import { saveWorkshopHiddenNavKeys } from "@/lib/data/workshop-nav-preferences-data";

export type WorkshopNavPrefsResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * تخصيص شريط الورشة — صلاحية إشرافية فقط (إدارة الفحص / مشرف عام).
 * لا يُسمح لمالك الورشة بتعديل هذه التفضيلات.
 */
export async function saveWorkshopNavPreferencesAction(
  formData: FormData
): Promise<WorkshopNavPrefsResult> {
  try {
    await assertInspectionRoles(["super_admin", "inspection_admin"]);
  } catch {
    return {
      ok: false,
      message: "تخصيص الشريط الجانبي متاح لإدارة الفحص فقط.",
    };
  }

  const workshopId = String(formData.get("workshop_id") ?? "").trim();
  if (!workshopId) {
    return { ok: false, message: "معرّف الورشة مطلوب." };
  }

  const raw = formData.getAll("hidden_nav_keys");
  const hidden = parseHiddenNavKeys(raw).filter((k) =>
    (WORKSHOP_CUSTOMIZABLE_NAV_KEYS as readonly string[]).includes(k)
  ) as WorkshopCustomizableNavKey[];

  const result = await saveWorkshopHiddenNavKeys(workshopId, hidden);
  if (!result.ok) return result;

  revalidatePath("/workshop");
  revalidatePath("/settings");
  revalidatePath(`/workshop?workshop_id=${workshopId}`);

  return { ok: true };
}
