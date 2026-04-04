import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";
import {
  mapAttachment,
  mapHistory,
  mapInspector,
  mapReport,
  mapReportItem,
  mapRequest,
  mapWorkshop,
} from "@/lib/data/mappers";
import type {
  InspectionAttachment,
  InspectionReport,
  InspectionRequest,
  InspectionStatusHistory,
  Inspector,
  Workshop,
} from "@/types";

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
  return data.map((r) => mapWorkshop(r as Parameters<typeof mapWorkshop>[0]));
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
  return mapWorkshop(data as Parameters<typeof mapWorkshop>[0]);
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

export async function getInspectorsForWorkshop(
  workshopId: string
): Promise<Inspector[]> {
  const all = await listInspectors();
  return all.filter((i) => i.workshopId === workshopId);
}

export async function listInspectionRequests(): Promise<InspectionRequest[]> {
  const sb = getAdminClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("inspection_requests")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => mapRequest(r as Parameters<typeof mapRequest>[0]));
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

export async function dashboardCounts() {
  const requests = await listInspectionRequests();
  const workshops = await listWorkshops();
  return {
    openRequests: requests.filter((r) =>
      ["submitted", "assigned", "in_progress", "pending_review"].includes(
        r.status
      )
    ).length,
    pendingReview: requests.filter((r) => r.status === "pending_review").length,
    workshops: workshops.length,
    closedSuccessful: requests.filter((r) => r.status === "approved").length,
  };
}
