import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";

export type WorkshopInviteRow = {
  id: string;
  token: string;
  workshopName: string;
  city: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  dasmUserId: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
};

export type WorkshopInvitePrefill = {
  token: string;
  workshopName: string;
  city: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
};

export async function listPendingWorkshopInvites(): Promise<WorkshopInviteRow[]> {
  const sb = getAdminClient();
  if (!sb) return [];

  const { data, error } = await sb
    .from("inspection_workshop_invites")
    .select(
      "id, token, workshop_name, city, contact_name, phone, email, dasm_user_id, status, expires_at, created_at"
    )
    .eq("status", "pending")
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id as string,
    token: r.token as string,
    workshopName: r.workshop_name as string,
    city: r.city as string,
    contactName: (r.contact_name as string | null) ?? null,
    phone: (r.phone as string | null) ?? null,
    email: (r.email as string | null) ?? null,
    dasmUserId: (r.dasm_user_id as string | null) ?? null,
    status: r.status as string,
    expiresAt: r.expires_at as string,
    createdAt: r.created_at as string,
  }));
}

export async function getWorkshopInviteByToken(
  token: string
): Promise<WorkshopInvitePrefill | null> {
  const key = token?.trim();
  if (!key) return null;

  const sb = getAdminClient();
  if (!sb) return null;

  const { data, error } = await sb
    .from("inspection_workshop_invites")
    .select(
      "token, workshop_name, city, contact_name, phone, email, status, expires_at"
    )
    .eq("token", key)
    .maybeSingle();

  if (error || !data) return null;
  if (data.status !== "pending") return null;
  if (new Date(String(data.expires_at)) < new Date()) return null;

  return {
    token: data.token as string,
    workshopName: data.workshop_name as string,
    city: data.city as string,
    contactName: (data.contact_name as string | null) ?? null,
    phone: (data.phone as string | null) ?? null,
    email: (data.email as string | null) ?? null,
  };
}
