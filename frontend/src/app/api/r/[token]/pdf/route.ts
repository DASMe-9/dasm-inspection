import { NextResponse } from "next/server";
import { getPublicReportByToken } from "@/lib/data/inspection";
import { renderPublicReportPdf } from "@/lib/pdf/public-report-pdf";

/**
 * GET /api/r/[token]/pdf
 *
 * PDF export of the public, PII-free, approval-gated report already served
 * at /r/[token] — same lookup, same "notFound for anything not approved or
 * not found" behavior, so a revoked/unapproved token leaks nothing new.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const report = await getPublicReportByToken(token);
  if (!report) {
    return NextResponse.json({ error: "التقرير غير موجود" }, { status: 404 });
  }

  const pdf = await renderPublicReportPdf(report);
  const filename = `dasm-inspection-report-${token.slice(0, 8)}.pdf`;

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
