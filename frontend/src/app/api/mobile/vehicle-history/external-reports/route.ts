import { NextRequest, NextResponse } from "next/server";
import { authenticateMobileRequest } from "@/lib/api/mobile-inspection-http";
import { uploadMobileExternalReport } from "@/lib/api/mobile-vehicle-history";

/** POST /api/mobile/vehicle-history/external-reports */
export async function POST(request: NextRequest) {
  const auth = await authenticateMobileRequest(request);
  if (!auth.ok) {
    return NextResponse.json(
      { error: "unauthorized", message: auth.message },
      { status: auth.status }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "بيانات الرفع غير صالحة" },
      { status: 400 }
    );
  }

  const result = await uploadMobileExternalReport(
    auth.normalized.userId,
    formData
  );
  if (!result.ok) {
    return NextResponse.json(
      { error: "bad_request", message: result.message },
      { status: result.status }
    );
  }

  return NextResponse.json({ ok: true });
}
