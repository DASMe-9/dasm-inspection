import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";
import type { InspectionNotification } from "@/types";

type DbNotification = {
  id: string;
  dasm_user_id: string;
  workshop_id: string | null;
  kind: string;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

function mapNotification(row: DbNotification): InspectionNotification {
  return {
    id: row.id,
    dasmUserId: row.dasm_user_id,
    workshopId: row.workshop_id ?? undefined,
    kind: row.kind,
    title: row.title,
    body: row.body ?? undefined,
    readAt: row.read_at ?? undefined,
    createdAt: row.created_at,
  };
}

export async function getWorkshopFollowerCount(workshopId: string): Promise<number> {
  const sb = getAdminClient();
  if (!sb) return 0;
  const { count, error } = await sb
    .from("inspection_workshop_follows")
    .select("*", { count: "exact", head: true })
    .eq("workshop_id", workshopId);
  if (error) return 0;
  return count ?? 0;
}

export async function isFollowingWorkshop(
  dasmUserId: string,
  workshopId: string
): Promise<boolean> {
  const sb = getAdminClient();
  if (!sb || !dasmUserId.trim()) return false;
  const { data } = await sb
    .from("inspection_workshop_follows")
    .select("id")
    .eq("workshop_id", workshopId)
    .eq("dasm_user_id", dasmUserId.trim())
    .maybeSingle();
  return Boolean(data);
}

export async function listNotificationsForUser(
  dasmUserId: string,
  limit = 20
): Promise<InspectionNotification[]> {
  const sb = getAdminClient();
  if (!sb || !dasmUserId.trim()) return [];
  const { data, error } = await sb
    .from("inspection_notifications")
    .select("*")
    .eq("dasm_user_id", dasmUserId.trim())
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((r) => mapNotification(r as DbNotification));
}

export async function notifyWorkshopFollowers(
  workshopId: string,
  title: string,
  body: string,
  kind = "workshop_update"
): Promise<void> {
  const sb = getAdminClient();
  if (!sb) return;

  const { data: followers } = await sb
    .from("inspection_workshop_follows")
    .select("dasm_user_id")
    .eq("workshop_id", workshopId);

  if (!followers?.length) return;

  const rows = followers.map((f) => ({
    dasm_user_id: f.dasm_user_id as string,
    workshop_id: workshopId,
    kind,
    title,
    body,
  }));

  await sb.from("inspection_notifications").insert(rows);
}
