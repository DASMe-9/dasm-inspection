import { NextResponse } from "next/server";
import { listMobileWorkshops } from "@/lib/api/mobile-inspection-http";

/**
 * GET /api/mobile/workshops
 *
 * دليل الورش المعتمدة للتطبيق (Bearer اختياري — القائمة عامة).
 */
export async function GET() {
  const workshops = await listMobileWorkshops();
  return NextResponse.json(
    { workshops },
    { headers: { "Cache-Control": "public, max-age=120" } }
  );
}
