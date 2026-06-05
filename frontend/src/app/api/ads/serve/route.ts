import { NextRequest, NextResponse } from "next/server";

// W-007 — server-side proxy to DASM Ads serve. Keeps the browser same-origin
// (no CORS), exposes no secrets, and never lets an ads outage break the page.
const DEFAULT_ADS_API_URL = "https://ads.dasm.com.sa/api/ads";

function adsApiUrl(): string {
  return (
    process.env.DASM_ADS_API_URL ||
    process.env.NEXT_PUBLIC_DASM_ADS_API_URL ||
    DEFAULT_ADS_API_URL
  ).replace(/\/+$/, "");
}

export async function GET(req: NextRequest) {
  const upstream = `${adsApiUrl()}/serve?${req.nextUrl.searchParams.toString()}`;

  try {
    const res = await fetch(upstream, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    const data = await res.json().catch(() => ({ data: [] }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    // Fail open: empty payload so the surface renders nothing, never errors.
    return NextResponse.json({ data: [], error: "ads_unavailable" }, { status: 200 });
  }
}
