import { NextRequest, NextResponse } from "next/server";

import { authenticateMobileRequest } from "@/lib/api/mobile-inspection-http";
import {
  templateForTier,
  type ChecklistTier,
} from "@/lib/checklist/checklist-template";

/**
 * GET /api/mobile/checklist-template?tier=comprehensive|essential
 *
 * Serves the signed-off checklist template (items + per-item metadata) so the
 * app renders/groups/tier-filters from a single source of truth. Read-only.
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateMobileRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: "unauthorized", message: auth.message },
      { status: auth.status }
    );
  }

  const tierParam = request.nextUrl.searchParams.get("tier");
  const tier: ChecklistTier =
    tierParam === "essential" ? "essential" : "comprehensive";

  const items = templateForTier(tier);
  return NextResponse.json({ tier, count: items.length, items });
}
