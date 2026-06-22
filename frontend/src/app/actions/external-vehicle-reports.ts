"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { INSPECTION_DASM_USER_COOKIE } from "@/lib/cookies/inspection-gateway";
import { inspectionOpsLog } from "@/lib/inspection-ops-log";
import { requireAdminClient } from "@/lib/supabase/admin";

export type ExternalReportUploadResult =
  | { ok: true }
  | { ok: false; message: string };

const MAX_REPORT_BYTES = 15 * 1024 * 1024;
const ALLOWED_REPORT_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function safeFileSegment(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._\u0600-\u06FF-]/g, "_");
  return (base || "external-report").slice(0, 160);
}
function normalizeDate(raw: FormDataEntryValue | null): string | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export async function uploadExternalVehicleReportAction(
  formData: FormData
): Promise<ExternalReportUploadResult> {
  const dasmUserId =
    cookies().get(INSPECTION_DASM_USER_COOKIE)?.value?.trim() ?? "";
  if (!dasmUserId) {
    return {
      ok: false,
      message: "افتح الصفحة من بوابة داسم أولاً حتى نربط التقرير بحسابك.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "اختر ملف تقرير فحص صالح." };
  }
  if (file.size > MAX_REPORT_BYTES) {
    return { ok: false, message: "الحد الأقصى لملف التقرير 15 ميغابايت." };
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_REPORT_MIME.has(mime)) {
    return {
      ok: false,
      message: "يُسمح برفع PDF أو صورة JPEG/PNG/WebP فقط.",
    };
  }

  const dasmCarId = String(formData.get("dasm_car_id") ?? "").trim() || null;
  const vehicleLabel =
    String(formData.get("vehicle_label") ?? "").trim() || null;
  const reportSource =
    String(formData.get("report_source") ?? "").trim() || null;
  const reportDate = normalizeDate(formData.get("report_date"));

  try {
    const sb = requireAdminClient();
    const bucket =
      process.env.INSPECTION_ATTACHMENTS_BUCKET?.trim() ||
      "inspection-attachments";
    const storagePath = `external-reports/${dasmUserId}/${Date.now()}-${safeFileSegment(
      file.name
    )}`;

    const buf = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await sb.storage
      .from(bucket)
      .upload(storagePath, buf, {
        contentType: mime,
        upsert: false,
      });

    if (uploadError) {
      inspectionOpsLog("error", "external_report_upload_failed", {
        dasm_user_id: dasmUserId,
        bucket,
        storage_path: storagePath,
        message: uploadError.message,
      });
      return { ok: false, message: uploadError.message };
    }

    const { error: insertError } = await sb
      .from("inspection_external_vehicle_reports")
      .insert({
        dasm_user_id: dasmUserId,
        dasm_car_id: dasmCarId,
        vehicle_label: vehicleLabel,
        report_source: reportSource,
        report_date: reportDate,
        file_name: file.name.slice(0, 255),
        mime_type: mime,
        storage_path: storagePath,
        ocr_status: "pending",
      });

    if (insertError) {
      await sb.storage.from(bucket).remove([storagePath]);
      inspectionOpsLog("error", "external_report_insert_failed", {
        dasm_user_id: dasmUserId,
        storage_path: storagePath,
        message: insertError.message,
      });
      return { ok: false, message: insertError.message };
    }

    revalidatePath("/my-inspections");
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذّر رفع التقرير.";
    inspectionOpsLog("error", "external_report_upload_exception", {
      dasm_user_id: dasmUserId,
      message,
    });
    return { ok: false, message };
  }
}
