import { NextRequest, NextResponse } from "next/server";
import { resyncApprovedReportsToCore } from "@/lib/inspection/resync-approved-reports";

export const dynamic = "force-dynamic";

/**
 * POST /api/internal/inspection/resync
 *
 * شبكة أمان: تعيد مزامنة التقارير المعتمدة العالقة (core_sync_status ∈ {pending,
 * failed}) إلى Core، فلا يبقى تقرير على `pending` صامتاً. محروسة بالتوكن الداخلي
 * المشترك (نفس `DASM_INSPECTION_INTERNAL_PULL_TOKEN`)؛ تُستدعى يدويّاً أو عبر كرون.
 */
export async function POST(request: NextRequest) {
  const expected = process.env.DASM_INSPECTION_INTERNAL_PULL_TOKEN?.trim();
  if (!expected) {
    return NextResponse.json(
      { ok: false, message: "internal token not configured on inspection" },
      { status: 503 }
    );
  }

  const provided = request.headers.get("X-DASM-Internal-Token")?.trim();
  if (!provided || provided !== expected) {
    return NextResponse.json({ ok: false, message: "forbidden" }, { status: 403 });
  }

  const summary = await resyncApprovedReportsToCore();
  return NextResponse.json({ ok: true, ...summary });
}
