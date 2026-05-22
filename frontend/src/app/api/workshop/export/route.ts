import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveWorkshopPage } from "@/lib/auth/resolve-workshop-page.server";
import { listInspectionRequests } from "@/lib/data/inspection";
import {
  listWorkshopFollowers,
  listWorkshopReviewsForOwner,
} from "@/lib/data/workshop-insights-data";
import {
  buildFollowersCsv,
  buildRequestsCsv,
  buildReviewsCsv,
  csvResponseBody,
} from "@/lib/workshop-export-builders";
import type { WorkshopExportDataset } from "@/types/workshop-insights";

const VALID_DATASETS: WorkshopExportDataset[] = [
  "requests",
  "reviews",
  "followers",
];

function isDataset(value: string | null): value is WorkshopExportDataset {
  return (
    value !== null &&
    (VALID_DATASETS as string[]).includes(value)
  );
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const workshopIdParam = sp.get("workshop_id") ?? undefined;
  const datasetRaw = sp.get("dataset");
  const dataset: WorkshopExportDataset = isDataset(datasetRaw)
    ? datasetRaw
    : "requests";

  const resolved = await resolveWorkshopPage(workshopIdParam);
  if (!resolved) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { workshopId, workshop } = resolved;
  const stamp = new Date().toISOString().slice(0, 10);
  const slug = workshop.slug || workshopId.slice(0, 8);

  let csv: string;
  let filename: string;

  if (dataset === "reviews") {
    const reviews = await listWorkshopReviewsForOwner(workshopId, 1000);
    csv = buildReviewsCsv(reviews);
    filename = `workshop-${slug}-reviews-${stamp}.csv`;
  } else if (dataset === "followers") {
    const followers = await listWorkshopFollowers(workshopId, 5000);
    csv = buildFollowersCsv(followers);
    filename = `workshop-${slug}-followers-${stamp}.csv`;
  } else {
    const requests = await listInspectionRequests({
      workshopId,
      sort: "updated_desc",
    });
    csv = buildRequestsCsv(requests);
    filename = `workshop-${slug}-requests-${stamp}.csv`;
  }

  return new NextResponse(csvResponseBody(csv), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
