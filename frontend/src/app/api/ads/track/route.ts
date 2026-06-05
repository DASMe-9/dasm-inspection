import { NextRequest, NextResponse } from "next/server";

const DEFAULT_ADS_API_URL = "https://ads.dasm.com.sa/api/ads";

function adsApiUrl(): string {
  return (
    process.env.DASM_ADS_API_URL ||
    process.env.NEXT_PUBLIC_DASM_ADS_API_URL ||
    DEFAULT_ADS_API_URL
  ).replace(/\/+$/, "");
}

// W-007 — proxy impression/click tracking to DASM Ads (fire-and-forget).
export async function POST(req: NextRequest) {
  const body = await req.text();

  try {
    const res = await fetch(`${adsApiUrl()}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    const data = await res.json().catch(() => ({ ok: true }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ ok: false, error: "ads_unavailable" }, { status: 200 });
  }
}
