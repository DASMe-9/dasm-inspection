import "server-only";

import {
  findInspectorByDasmUserId,
  listInspectionRequests,
  listInspectionRequestsForDasmUser,
  listWorkshopsForDirectory,
} from "@/lib/data/inspection";
import { authenticateDasmToken } from "@/lib/auth/authenticate-dasm-token";
import { isWorkshopOperatorRole } from "@/lib/auth/workshop-dashboard";
import type { AppRole } from "@/types";
import type { InspectionRequest, Workshop } from "@/types";
import { getBearerToken } from "@/lib/api/inspection-http-auth";
import type { NextRequest } from "next/server";

export function mobileBearerFromRequest(request: NextRequest): string | null {
  return getBearerToken(request);
}

export async function authenticateMobileRequest(request: NextRequest) {
  const token = mobileBearerFromRequest(request);
  if (!token) {
    return { ok: false as const, status: 401, message: "Authorization Bearer مطلوب" };
  }

  const auth = await authenticateDasmToken(token);
  if (!auth.ok) {
    return { ok: false as const, status: 401, message: auth.message };
  }

  let { normalized } = auth;
  if (!normalized.inspectorRecordId) {
    const inspector = await findInspectorByDasmUserId(normalized.userId);
    if (inspector) {
      normalized = {
        ...normalized,
        inspectorRecordId: inspector.id,
        workshopId: normalized.workshopId ?? inspector.workshopId ?? null,
      };
    }
  }

  return { ok: true as const, normalized, source: auth.source };
}

export function toMobileWorkshopRow(workshop: Workshop) {
  return {
    id: workshop.id,
    slug: workshop.slug,
    name: workshop.name,
    city: workshop.city,
    is_verified: workshop.isVerified,
    pricing: workshop.pricing ?? null,
  };
}

export function toMobileRequestRow(request: InspectionRequest) {
  return {
    id: request.id,
    title: request.title,
    vehicle_label: request.vehicleLabel,
    status: request.status,
    service_mode: request.serviceMode,
    workshop_id: request.workshopId ?? null,
    inspector_id: request.inspectorId ?? null,
    report_id: request.reportId ?? null,
    created_at: request.createdAt,
    updated_at: request.updatedAt,
  };
}

export async function listMobileWorkshops() {
  const workshops = await listWorkshopsForDirectory();
  return workshops.map(toMobileWorkshopRow);
}

export async function listMobileRequestsForAuth(normalized: {
  userId: string;
  inspectionRole: string | null;
  workshopId: string | null;
  inspectorRecordId: string | null;
}) {
  const role = normalized.inspectionRole;
  const persona = (role ?? "unknown") as AppRole | "unknown";

  if (persona === "dasm_user") {
    const rows = await listInspectionRequestsForDasmUser(normalized.userId, {
      sort: "updated_desc",
    });
    return { requests: rows.map(toMobileRequestRow), scope: "dasm_user" as const };
  }

  if (isWorkshopOperatorRole(persona) && normalized.workshopId) {
    const rows = await listInspectionRequests({
      workshopId: normalized.workshopId,
      sort: "updated_desc",
    });
    return { requests: rows.map(toMobileRequestRow), scope: "workshop" as const };
  }

  if (
    (persona === "inspector" || persona === "mechanic") &&
    normalized.inspectorRecordId
  ) {
    const rows = await listInspectionRequests({
      workshopId: normalized.workshopId ?? undefined,
      inspectorId: normalized.inspectorRecordId,
      sort: "updated_desc",
    });
    return { requests: rows.map(toMobileRequestRow), scope: "inspector" as const };
  }

  if (persona === "inspection_admin" || persona === "super_admin") {
    const rows = await listInspectionRequests({ sort: "updated_desc" });
    return { requests: rows.map(toMobileRequestRow), scope: "admin" as const };
  }

  return { requests: [], scope: "none" as const };
}
