import "server-only";

import { getAdminClient } from "@/lib/supabase/admin";

export interface RequestMessage {
  id: string;
  requestId: string;
  senderDasmUserId: string | null;
  senderRole: string | null;
  body: string;
  createdAt: string;
}

/** رسائل خيط طلب فحص، مرتّبة زمنياً تصاعدياً. */
export async function listMessagesForRequest(
  requestId: string
): Promise<RequestMessage[]> {
  const key = requestId.trim();
  if (!key) return [];

  const sb = getAdminClient();
  if (!sb) return [];

  const { data, error } = await sb
    .from("inspection_request_messages")
    .select("id, request_id, sender_dasm_user_id, sender_role, body, created_at")
    .eq("request_id", key)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((r) => ({
    id: r.id as string,
    requestId: r.request_id as string,
    senderDasmUserId: (r.sender_dasm_user_id as string | null) ?? null,
    senderRole: (r.sender_role as string | null) ?? null,
    body: r.body as string,
    createdAt: r.created_at as string,
  }));
}
