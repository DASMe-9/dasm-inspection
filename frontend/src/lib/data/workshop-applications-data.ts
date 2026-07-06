import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";
import type { InspectionWorkshopApplicationStatus } from "@/types";

export interface WorkshopApplicationRow {
  id: string;
  workshopName: string;
  city: string;
  contactName: string;
  phone: string;
  email: string | null;
  dasmUserId: string | null;
  commercialRegistration: string | null;
  notes: string | null;
  status: InspectionWorkshopApplicationStatus;
  createdAt: string;
}

/** طلبات انضمام الورش التي تنتظر قرار الإدارة (اعتماد/رفض). */
export async function listPendingWorkshopApplications(): Promise<
  WorkshopApplicationRow[]
> {
  const sb = getAdminClient();
  if (!sb) return [];

  const { data, error } = await sb
    .from("inspection_workshop_applications")
    .select(
      "id, workshop_name, city, contact_name, phone, email, dasm_user_id, commercial_registration, notes, status, created_at"
    )
    .in("status", ["submitted", "under_review"])
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id as string,
    workshopName: r.workshop_name as string,
    city: r.city as string,
    contactName: r.contact_name as string,
    phone: r.phone as string,
    email: (r.email as string | null) ?? null,
    dasmUserId: (r.dasm_user_id as string | null) ?? null,
    commercialRegistration: (r.commercial_registration as string | null) ?? null,
    notes: (r.notes as string | null) ?? null,
    status: r.status as InspectionWorkshopApplicationStatus,
    createdAt: r.created_at as string,
  }));
}
