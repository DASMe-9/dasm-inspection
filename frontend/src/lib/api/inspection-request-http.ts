import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";
import type { DasmProfileUser } from "@/lib/api/inspection-http-auth";

export type CreateInspectionBody = {
  dasm_car_id: string;
  vehicle_label: string;
  title?: string | null;
  auction_reference?: string | null;
};

export type CreatedInspectionRow = {
  id: string;
  title: string;
  status: string;
  vehicle_label: string;
};

/** إنشاء طلب `submitted` + سجل تاريخ — مسار مشترك بين البوابة وـ REST v1. */
export async function insertInspectionRequestSubmitted(
  body: CreateInspectionBody,
  user: DasmProfileUser,
  originForTrackingUrl: string
): Promise<
  | { ok: true; row: CreatedInspectionRow; tracking_url: string }
  | { ok: false; message: string; code: string }
> {
  const dasm_car_id = String(body.dasm_car_id ?? "").trim();
  const vehicle_label = String(body.vehicle_label ?? "").trim();
  const title =
    body.title != null && String(body.title).trim()
      ? String(body.title).trim()
      : null;
  const auction_reference =
    body.auction_reference != null && String(body.auction_reference).trim()
      ? String(body.auction_reference).trim()
      : null;

  if (!dasm_car_id || !vehicle_label) {
    return {
      ok: false,
      message: "dasm_car_id و vehicle_label مطلوبان",
      code: "validation_error",
    };
  }

  const sb = getAdminClient();
  if (!sb) {
    return {
      ok: false,
      message: "خطأ في الاتصال بقاعدة البيانات",
      code: "server_error",
    };
  }

  const insertTitle = title || `فحص ${vehicle_label}`;

  const { data, error } = await sb
    .from("inspection_requests")
    .insert({
      title: insertTitle,
      dasm_car_id,
      vehicle_label,
      dasm_user_id: String(user.id),
      auction_reference,
      status: "submitted",
    })
    .select("id, title, status, vehicle_label")
    .single();

  if (error || !data) {
    return {
      ok: false,
      message: error?.message ?? "فشل الإنشاء",
      code: "database_error",
    };
  }

  const row: CreatedInspectionRow = {
    id: data.id,
    title: data.title,
    status: data.status,
    vehicle_label: data.vehicle_label,
  };

  await sb.from("inspection_status_history").insert({
    request_id: row.id,
    status: "submitted",
    note: `طلب فحص من منصّة داسم — ${user.name ?? user.id}`,
    actor_role: "dasm_user",
  });

  const tracking_url = `${originForTrackingUrl.replace(/\/$/, "")}/requests/${row.id}`;

  return { ok: true, row, tracking_url };
}

/** طلب واحد إن كان مالكه نفس مستخدم المنصّة (لـ GET v1). */
export async function fetchInspectionRequestOwnedByDasmUser(
  requestId: string,
  dasmUserId: string
): Promise<
  | {
      id: string;
      title: string;
      status: string;
      dasm_car_id: string;
      vehicle_label: string;
      dasm_user_id: string | null;
      auction_reference: string | null;
      workshop_id: string | null;
      inspector_id: string | null;
      report_id: string | null;
      created_at: string;
      updated_at: string;
    }
  | null
> {
  const sb = getAdminClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("inspection_requests")
    .select(
      "id, title, status, dasm_car_id, vehicle_label, dasm_user_id, auction_reference, workshop_id, inspector_id, report_id, created_at, updated_at"
    )
    .eq("id", requestId)
    .maybeSingle();

  if (error || !data) return null;
  if (!data.dasm_user_id || String(data.dasm_user_id) !== String(dasmUserId)) {
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    status: data.status,
    dasm_car_id: data.dasm_car_id,
    vehicle_label: data.vehicle_label,
    dasm_user_id: data.dasm_user_id,
    auction_reference: data.auction_reference,
    workshop_id: data.workshop_id,
    inspector_id: data.inspector_id,
    report_id: data.report_id,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}
