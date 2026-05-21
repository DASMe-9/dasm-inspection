import { NextRequest, NextResponse } from "next/server";
import { buildServicePricingApiPayload } from "@/lib/data/inspection-pricing-data";

/**
 * GET /api/v1/service-pricing
 *
 * Query: workshop_id (optional) — filter to one workshop’s effective prices.
 * Public read; data served via service role on the server.
 *
 * @see docs/api-contract.md §3.2
 */
export async function GET(request: NextRequest) {
  const workshopId = request.nextUrl.searchParams
    .get("workshop_id")
    ?.trim();

  try {
    const payload = await buildServicePricingApiPayload(
      workshopId || undefined
    );
    return NextResponse.json(payload, {
      status: 200,
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    return NextResponse.json(
      { error: "server_error", message: "تعذّر تحميل الأسعار" },
      { status: 500 }
    );
  }
}
