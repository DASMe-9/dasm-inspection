"use server";

import { revalidatePath } from "next/cache";
import { assertWorkshopManageAccess } from "@/lib/auth/workshop-scope.server";
import { uploadWorkshopImageToCloudinary } from "@/lib/cloudinary/workshop-media";
import type { WorkshopMediaKind } from "@/lib/cloudinary/workshop-media-kinds";
import { requireAdminClient } from "@/lib/supabase/admin";

export type WorkshopMediaUploadResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

export async function uploadWorkshopMediaAction(
  formData: FormData
): Promise<WorkshopMediaUploadResult> {
  try {
    const workshopId = String(formData.get("workshop_id") ?? "").trim();
    const workshopSlug = String(formData.get("workshop_slug") ?? "").trim();
    const kindRaw = String(formData.get("kind") ?? "").trim();
    const file = formData.get("file");

    if (!workshopId || !workshopSlug) {
      return { ok: false, message: "معرّف الورشة مطلوب." };
    }
    if (kindRaw !== "logo" && kindRaw !== "cover") {
      return { ok: false, message: "نوع الصورة غير صالح." };
    }
    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, message: "اختر صورة من جهازك." };
    }

    await assertWorkshopManageAccess(workshopId);

    const uploaded = await uploadWorkshopImageToCloudinary({
      file,
      workshopSlug,
      kind: kindRaw as WorkshopMediaKind,
    });
    if (!uploaded.ok) return uploaded;

    const column = kindRaw === "logo" ? "logo_url" : "cover_url";
    const sb = requireAdminClient();
    const { error } = await sb
      .from("inspection_workshops")
      .update({ [column]: uploaded.url })
      .eq("id", workshopId);
    if (error) return { ok: false, message: error.message };

    revalidatePath("/settings");
    revalidatePath("/workshop");
    revalidatePath("/workshop/profile");
    revalidatePath(`/workshops/${workshopSlug}`);

    return { ok: true, url: uploaded.url };
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === "INSPECTION_AUTH_REQUIRED") {
        return { ok: false, message: "انتهت الجلسة — سجّل الدخول من جديد." };
      }
      if (e.message === "INSPECTION_FORBIDDEN") {
        return { ok: false, message: "ليس لديك صلاحية رفع صور هذه الورشة." };
      }
      return { ok: false, message: e.message };
    }
    return { ok: false, message: "خطأ غير متوقع أثناء الرفع." };
  }
}
