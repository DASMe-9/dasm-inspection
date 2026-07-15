import "server-only";

import { DASM_API_URL } from "@/lib/api/inspection-http-auth";
import type { InspectionRequestStatus, InspectionServiceMode } from "@/types";

export type WorkshopOperationsQueueItem = {
  id: string;
  title: string;
  vehicleLabel: string;
  status: InspectionRequestStatus;
  serviceMode: InspectionServiceMode;
  inspectorId: string | null;
  scheduledAt: string | null;
  isOverdue: boolean;
  nextAction: {
    key: string;
    label: string;
    href: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type WorkshopOperationsInspector = {
  id: string;
  name: string;
  active: boolean;
  workload: number;
  availability: "available" | "busy" | "offline";
  currentVehicle: string | null;
};

export type WorkshopOperationsDashboard = {
  workshop: {
    id: string;
    name: string;
    city: string;
    slug: string | null;
    isVerified: boolean;
  };
  summary: {
    activeRequests: number;
    unassignedRequests: number;
    inProgress: number;
    pendingReview: number;
    overdue: number;
    activeInspectors: number;
    availableInspectors: number;
  };
  queue: WorkshopOperationsQueueItem[];
  inspectors: WorkshopOperationsInspector[];
  generatedAt: string;
  source: "core_laravel" | "inspection_fallback";
};

type CoreOperationsResponse = {
  success?: boolean;
  data?: {
    workshop: {
      id: string;
      name: string;
      city: string;
      slug: string | null;
      is_verified: boolean;
    };
    summary: {
      active_requests: number;
      unassigned_requests: number;
      in_progress: number;
      pending_review: number;
      overdue: number;
      active_inspectors: number;
      available_inspectors: number;
    };
    queue: Array<{
      id: string;
      title: string;
      vehicle_label: string;
      status: InspectionRequestStatus;
      service_mode: InspectionServiceMode;
      inspector_id: string | null;
      scheduled_at: string | null;
      is_overdue: boolean;
      next_action: { key: string; label: string; href: string };
      created_at: string;
      updated_at: string;
    }>;
    inspectors: Array<{
      id: string;
      name: string;
      active: boolean;
      workload: number;
      availability: "available" | "busy" | "offline";
      current_vehicle: string | null;
    }>;
    generated_at: string;
  };
};

export async function fetchWorkshopOperationsDashboard(
  token: string
): Promise<WorkshopOperationsDashboard | null> {
  const cleanToken = token.trim();
  if (!cleanToken) return null;

  try {
    const response = await fetch(
      `${DASM_API_URL}/api/me/inspection-workshop/operations`,
      {
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(2_500),
      }
    );

    if (!response.ok) return null;
    const payload = (await response.json()) as CoreOperationsResponse;
    if (!payload.success || !payload.data) return null;

    const { data } = payload;
    return {
      workshop: {
        id: data.workshop.id,
        name: data.workshop.name,
        city: data.workshop.city,
        slug: data.workshop.slug,
        isVerified: data.workshop.is_verified,
      },
      summary: {
        activeRequests: data.summary.active_requests,
        unassignedRequests: data.summary.unassigned_requests,
        inProgress: data.summary.in_progress,
        pendingReview: data.summary.pending_review,
        overdue: data.summary.overdue,
        activeInspectors: data.summary.active_inspectors,
        availableInspectors: data.summary.available_inspectors,
      },
      queue: data.queue.map((item) => ({
        id: item.id,
        title: item.title,
        vehicleLabel: item.vehicle_label,
        status: item.status,
        serviceMode: item.service_mode,
        inspectorId: item.inspector_id,
        scheduledAt: item.scheduled_at,
        isOverdue: item.is_overdue,
        nextAction: item.next_action,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      })),
      inspectors: data.inspectors.map((inspector) => ({
        id: inspector.id,
        name: inspector.name,
        active: inspector.active,
        workload: inspector.workload,
        availability: inspector.availability,
        currentVehicle: inspector.current_vehicle,
      })),
      generatedAt: data.generated_at,
      source: "core_laravel",
    };
  } catch {
    return null;
  }
}
