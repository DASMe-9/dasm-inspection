import { NextRequest, NextResponse } from "next/server";
import {
  getInspectorsForWorkshop,
  resolveWorkshopRouteParam,
} from "@/lib/data/inspection";
import { getWorkshopPublicStats } from "@/lib/data/workshop-public-stats";
import { listApprovedWorkshopReviews } from "@/lib/data/workshop-reviews-data";
import { toWorkshopPublicProfile } from "@/lib/workshop-public-profile";
import { averageWorkshopRating } from "@/lib/workshop-reviews";

/**
 * GET /api/v1/workshops/:slug
 *
 * ملف ورشة عام (بدون JWT). يقبل slug أو uuid (legacy) — يُفضّل slug في الروابط.
 *
 * @see docs/api-contract.md §3.4
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const key = params.slug?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "invalid_slug", message: "معرّف الورشة مطلوب" },
      { status: 400 }
    );
  }

  const resolved = await resolveWorkshopRouteParam(key);
  if (!resolved) {
    return NextResponse.json(
      { error: "not_found", message: "الورشة غير موجودة" },
      { status: 404 }
    );
  }

  const [inspectors, reviews, stats] = await Promise.all([
    getInspectorsForWorkshop(resolved.workshop.id),
    listApprovedWorkshopReviews(resolved.workshop.id),
    getWorkshopPublicStats(resolved.workshop.id),
  ]);
  const ratingSummary = averageWorkshopRating(reviews.map((r) => r.rating));
  const profile = toWorkshopPublicProfile(resolved.workshop, inspectors, {
    ratingSummary,
    stats,
  });

  return NextResponse.json(
    {
      workshop: profile,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment ?? null,
        created_at: r.createdAt,
      })),
      rating_summary: ratingSummary,
      inspection_stats: stats,
      canonical_slug: resolved.canonicalSlug,
      profile_url: `/workshops/${resolved.canonicalSlug}`,
    },
    {
      status: 200,
      headers: { "Cache-Control": "public, max-age=120" },
    }
  );
}
