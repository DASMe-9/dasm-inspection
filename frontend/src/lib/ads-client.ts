"use client";

// W-007 — DASM Ads client for the inspection surface. Talks to the same-origin
// proxy (/api/ads/*), supports the Package-B video payload, and fails silently.

export type DasmAdRendered = {
  media_type?: string | null;
  headline?: string | null;
  subtitle?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  poster_url?: string | null;
  duration_sec?: number | null;
  format?: string | null;
  source?: string | null;
  price?: number | string | null;
  city?: string | null;
  cta?: string | null;
  target_url?: string | null;
};

export type DasmAd = {
  creative_id: number;
  campaign_id: number;
  car_id?: number | string | null;
  slot?: string | null;
  placement?: string | null;
  position?: string | null;
  tracking_token: string;
  target_url?: string | null;
  rendered?: DasmAdRendered | null;
};

export type AdSlotContext = Record<string, string | number | boolean | null | undefined>;

const VIDEO_MEDIA_TYPES = ["video", "ai_video", "clip"];
const SESSION_KEY = "dasm_ads_session_id";

export function isVideoAd(r?: DasmAdRendered | null): boolean {
  return Boolean(r?.video_url && VIDEO_MEDIA_TYPES.includes(r?.media_type ?? ""));
}

export function getAdsSessionId(): string {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(SESSION_KEY, generated);
  return generated;
}

export async function serveAds(
  slot: string,
  sessionId: string,
  context: AdSlotContext = {},
): Promise<DasmAd[]> {
  const params = new URLSearchParams({ slot, session_id: sessionId });
  Object.entries(context).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  try {
    const res = await fetch(`/api/ads/serve?${params.toString()}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const payload = await res.json();
    return Array.isArray(payload?.data) ? payload.data : [];
  } catch {
    return [];
  }
}

export function trackAdEvent(
  ad: DasmAd,
  eventType: "impression" | "click" | "lead",
  sessionId: string,
  context: AdSlotContext = {},
): void {
  if (!ad.tracking_token) return;
  const body = JSON.stringify({
    tracking_token: ad.tracking_token,
    event_type: eventType,
    session_id: sessionId,
    context: {
      ...context,
      slot: ad.slot ?? context.slot,
      placement: ad.placement ?? context.placement,
      position: ad.position ?? context.position,
    },
  });
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    navigator.sendBeacon("/api/ads/track", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/ads/track", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
