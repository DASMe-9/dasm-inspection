import "server-only";

import { getAdminClient, getFreshAdminClient } from "@/lib/supabase/admin";
import { inspectionOpsLog } from "@/lib/inspection-ops-log";
import {
  mapAttachment,
  mapHistory,
  mapInspector,
  mapReport,
  mapReportItem,
  mapRequest,
  mapWorkshop,
} from "@/lib/data/mappers";
import { attachPricingToWorkshopIds } from "@/lib/data/inspection-pricing-data";
import { getWorkshopRatingAveragesMap } from "@/lib/data/workshop-reviews-data";
import type {
  InspectionAttachment,
  InspectionReport,
  InspectionRequest,
  InspectionStatusHistory,
  Inspector,
  ReportItemStatus,
  Workshop,
} from "@/types";
import type { ListInspectionRequestsQueryOptions } from "@/lib/inspection-request-list-options";

export async function isSupabaseConfigured(): Promise<boolean> {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function listWorkshops(): Promise<Workshop[]> {
  const sb = getAdminClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("inspection_workshops")
    .select("*")
    .order("name");
  if (error || !data) return [];
  const workshops = data.map((r) =>
    mapWorkshop(r as Parameters<typeof mapWorkshop>[0])
  );
  const pricingMap = await attachPricingToWorkshopIds(
    workshops.map((w) => w.id)
  );
  return workshops.map((w) => ({
    ...w,
    pricing: pricingMap.get(w.id),
  }));
}

/** خطوة 30: معتمد أولاً، ثم متوسط التقييم، ثم الاسم (المسافة لاحقاً عند إحداثيات الورش). */
export async function listWorkshopsForDirectory(): Promise<Workshop[]> {
  const [workshops, ratingMap] = await Promise.all([
    listWorkshops(),
    getWorkshopRatingAveragesMap(),
  ]);

  return workshops.filter((w) => !w.isSuspended).sort((a, b) => {
    if (a.isVerified !== b.isVerified) {
      return a.isVerified ? -1 : 1;
    }
    const ra = ratingMap.get(a.id)?.average ?? 0;
    const rb = ratingMap.get(b.id)?.average ?? 0;
    if (rb !== ra) return rb - ra;
    return a.name.localeCompare(b.name, "ar");
  });
}

async function attachWorkshopPricing(w: Workshop): Promise<Workshop> {
  const pricingMap = await attachPricingToWorkshopIds([w.id]);
  return { ...w, pricing: pricingMap.get(w.id) };
}

export async function getWorkshop(id: string): Promise<Workshop | null> {
  const sb = getAdminClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("inspection_workshops")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return attachWorkshopPricing(
    mapWorkshop(data as Parameters<typeof mapWorkshop>[0])
  );
}

/** ملف ورشة عام بالـ slug (خطوة 26 — بدون تسجيل دخول). */
export async function getWorkshopBySlug(slug: string): Promise<Workshop | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  const sb = getAdminClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("inspection_workshops")
    .select("*")
    .eq("slug", normalized)
    .eq("is_suspended", false)
    .maybeSingle();
  if (error || !data) return null;
  return attachWorkshopPricing(
    mapWorkshop(data as Parameters<typeof mapWorkshop>[0])
  );
}

export async function resolveWorkshopRouteParam(
  slugOrId: string
): Promise<{ workshop: Workshop; canonicalSlug: string } | null> {
  const key = slugOrId.trim();
  if (!key) return null;
  const bySlug = await getWorkshopBySlug(key);
  if (bySlug) {
    return { workshop: bySlug, canonicalSlug: bySlug.slug };
  }
  const byId = await getWorkshop(key);
  if (!byId) return null;
  return { workshop: byId, canonicalSlug: byId.slug };
}

export async function listInspectors(): Promise<Inspector[]> {
  const sb = getAdminClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("inspection_inspectors")
    .select("*")
    .eq("active", true)
    .order("full_name");
  if (error || !data) return [];
  return data.map((r) => mapInspector(r as Parameters<typeof mapInspector>[0]));
}

export async function getInspector(id: string): Promise<Inspector | null> {
  const sb = getAdminClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("inspection_inspectors")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapInspector(data as Parameters<typeof mapInspector>[0]);
}

/** ربط حساب منصّة داسم بسجل مفتش (تطبيق الجوال — خطوة 39). */
export async function findInspectorByDasmUserId(
  dasmUserId: string
): Promise<Inspector | null> {
  const key = dasmUserId?.trim();
  if (!key) return null;
  const sb = getAdminClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("inspection_inspectors")
    .select("*")
    .eq("dasm_user_id", key)
    .eq("active", true)
    .maybeSingle();
  if (error || !data) return null;
  return mapInspector(data as Parameters<typeof mapInspector>[0]);
}

export async function getInspectorsForWorkshop(
  workshopId: string
): Promise<Inspector[]> {
  const all = await listInspectors();
  return all.filter((i) => i.workshopId === workshopId);
}

export async function listInspectionRequests(
  options?: ListInspectionRequestsQueryOptions
): Promise<InspectionRequest[]> {
  const sb = getAdminClient();
  if (!sb) return [];
  let q = sb.from("inspection_requests").select("*");
  if (options?.status) {
    q = q.eq("status", options.status);
  }
  const orderCol =
    options?.sort === "created_desc" ? "created_at" : "updated_at";
  if (options?.workshopId) {
    q = q.eq("workshop_id", options.workshopId);
  }
  if (options?.serviceMode) {
    q = q.eq("service_mode", options.serviceMode);
  }
  if (options?.inspectorId) {
    q = q.eq("inspector_id", options.inspectorId);
  }
  const { data, error } = await q.order(orderCol, { ascending: false });
  if (error || !data) return [];
  return data.map((r) => mapRequest(r as Parameters<typeof mapRequest>[0]));
}

export async function listInspectionRequestsForDasmUser(
  dasmUserId: string,
  options?: ListInspectionRequestsQueryOptions
): Promise<InspectionRequest[]> {
  if (!dasmUserId?.trim()) return [];
  const sb = getAdminClient();
  if (!sb) return [];
  let q = sb
    .from("inspection_requests")
    .select("*")
    .eq("dasm_user_id", dasmUserId.trim());
  if (options?.status) {
    q = q.eq("status", options.status);
  }
  const orderCol =
    options?.sort === "created_desc" ? "created_at" : "updated_at";
  if (options?.workshopId) {
    q = q.eq("workshop_id", options.workshopId);
  }
  if (options?.serviceMode) {
    q = q.eq("service_mode", options.serviceMode);
  }
  if (options?.inspectorId) {
    q = q.eq("inspector_id", options.inspectorId);
  }
  const { data, error } = await q.order(orderCol, { ascending: false });
  if (error || !data) return [];
  return data.map((r) => mapRequest(r as Parameters<typeof mapRequest>[0]));
}

export type AttachmentWithUrl = InspectionAttachment & {
  signedUrl: string | null;
};

export async function getAttachmentsWithSignedUrls(
  requestId: string
): Promise<AttachmentWithUrl[]> {
  const list = await getAttachmentsForRequest(requestId);
  const sb = getAdminClient();
  if (!sb) {
    if (list.length > 0) {
      inspectionOpsLog("warn", "attachment_signed_url_skip_no_client", {
        request_id: requestId,
        attachment_count: list.length,
      });
    }
    return list.map((a) => ({ ...a, signedUrl: null }));
  }
  const bucket =
    process.env.INSPECTION_ATTACHMENTS_BUCKET?.trim() ||
    "inspection-attachments";
  const ttl = Number(process.env.INSPECTION_ATTACHMENT_SIGNED_URL_TTL_SEC ?? 3600);
  const duration = Number.isFinite(ttl) && ttl > 60 ? ttl : 3600;

  const out: AttachmentWithUrl[] = [];
  for (const a of list) {
    const path = a.urlPlaceholder?.trim();
    if (!path) {
      out.push({ ...a, signedUrl: null });
      continue;
    }
    const { data, error } = await sb.storage
      .from(bucket)
      .createSignedUrl(path, duration);
    if (error || !data?.signedUrl) {
      inspectionOpsLog("warn", "attachment_signed_url_failed", {
        request_id: requestId,
        attachment_id: a.id,
        storage_path: path,
        message: error?.message ?? "no_signed_url",
      });
      out.push({ ...a, signedUrl: null });
    } else {
      out.push({ ...a, signedUrl: data.signedUrl });
    }
  }
  return out;
}

export async function getInspectionRequest(
  id: string
): Promise<InspectionRequest | null> {
  const sb = getAdminClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("inspection_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapRequest(data as Parameters<typeof mapRequest>[0]);
}

export async function getReport(id: string): Promise<InspectionReport | null> {
  const sb = getAdminClient();
  if (!sb) return null;
  const { data: rep, error } = await sb
    .from("inspection_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !rep) return null;
  const { data: items } = await sb
    .from("inspection_report_items")
    .select("*")
    .eq("report_id", id)
    .order("sort_order", { ascending: true });
  const mappedItems = (items ?? []).map((i) =>
    mapReportItem(i as Parameters<typeof mapReportItem>[0])
  );
  return mapReport(rep as Parameters<typeof mapReport>[0], mappedItems);
}

export async function getReportByRequestId(
  requestId: string
): Promise<InspectionReport | null> {
  const sb = getAdminClient();
  if (!sb) return null;
  const { data: rep, error } = await sb
    .from("inspection_reports")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle();
  if (error || !rep) return null;
  return getReport(rep.id);
}

export type PublicReportItem = {
  id: string;
  section: string;
  label: string;
  status: ReportItemStatus;
  notes: string | null;
};

export type PublicReportView = {
  workshopName: string | null;
  approvedAt: string;
  overallSummary: string;
  finalScore: number | null;
  letterGrade: string | null;
  harajTrack: string | null;
  items: PublicReportItem[];
};

/**
 * Public, PII-free view of an APPROVED report, reachable only via its unguessable
 * token. Returns null for missing/revoked tokens or unapproved reports — the
 * caller renders notFound(), never leaking existence.
 */
export async function getPublicReportByToken(
  token: string
): Promise<PublicReportView | null> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  // no-store client: a revoked/unapproved report must never be served stale.
  const sb = getFreshAdminClient();
  if (!sb) return null;

  const { data: rep, error } = await sb
    .from("inspection_reports")
    .select(
      "id, workshop_id, approved_at, overall_summary, final_score, letter_grade, haraj_track"
    )
    .eq("public_token", token)
    .not("approved_at", "is", null)
    .maybeSingle();
  if (error || !rep) return null;

  const r = rep as {
    id: string;
    workshop_id: string;
    approved_at: string;
    overall_summary: string;
    final_score: number | string | null;
    letter_grade: string | null;
    haraj_track: string | null;
  };

  const { data: itemRows } = await sb
    .from("inspection_report_items")
    .select("id, section, label, status, notes, sort_order")
    .eq("report_id", r.id)
    .order("sort_order", { ascending: true });

  const workshop = await getWorkshop(r.workshop_id);

  const items: PublicReportItem[] = (
    (itemRows ?? []) as Array<{
      id: string;
      section: string;
      label: string;
      status: ReportItemStatus;
      notes: string | null;
    }>
  ).map((i) => ({
    id: i.id,
    section: i.section,
    label: i.label,
    status: i.status,
    notes: i.notes ?? null,
  }));

  return {
    workshopName: workshop?.name ?? null,
    approvedAt: r.approved_at,
    overallSummary: r.overall_summary,
    finalScore: r.final_score != null ? Number(r.final_score) : null,
    letterGrade: r.letter_grade,
    harajTrack: r.haraj_track,
    items,
  };
}

export async function getAttachmentsForRequest(
  requestId: string
): Promise<InspectionAttachment[]> {
  const sb = getAdminClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("inspection_attachments")
    .select("*")
    .eq("request_id", requestId)
    .order("uploaded_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => mapAttachment(r as Parameters<typeof mapAttachment>[0]));
}

export async function getHistoryForRequest(
  requestId: string
): Promise<InspectionStatusHistory[]> {
  const sb = getAdminClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("inspection_status_history")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((r) => mapHistory(r as Parameters<typeof mapHistory>[0]));
}

export function dashboardCountsFromLists(
  requests: InspectionRequest[],
  workshopsCount: number
) {
  return {
    openRequests: requests.filter((r) =>
      [
        "submitted",
        "assigned",
        "dispatched",
        "on_site",
        "in_progress",
        "pending_review",
      ].includes(r.status)
    ).length,
    pendingReview: requests.filter((r) => r.status === "pending_review").length,
    workshops: workshopsCount,
    closedSuccessful: requests.filter((r) => r.status === "approved").length,
  };
}

export async function dashboardCounts() {
  const requests = await listInspectionRequests();
  const workshops = await listWorkshops();
  return dashboardCountsFromLists(requests, workshops.length);
}
