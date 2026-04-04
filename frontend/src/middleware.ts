import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applyInspectionHeaders } from "@/lib/auth/apply-inspection-headers";
import { extractDasmBearerToken } from "@/lib/auth/extract-token";
import { verifyDasmJwt } from "@/lib/auth/verify-dasm-jwt";

/**
 * حماية مرحلية لمسارات التطبيق عند تفعيل DASM_JWT_ENFORCE=true.
 * الافتراضي: لا إنفاذ — لا كسر للإنتاج الحالي.
 */
export async function middleware(request: NextRequest) {
  if (process.env.DASM_JWT_ENFORCE !== "true") {
    return NextResponse.next();
  }

  const token = extractDasmBearerToken(request);
  if (!token) {
    return new NextResponse("Unauthorized: missing DASM JWT (Bearer or cookie)", {
      status: 401,
    });
  }

  const result = await verifyDasmJwt(token);
  if (!result.ok) {
    return new NextResponse(`Unauthorized: ${result.message}`, { status: 401 });
  }

  const requestHeaders = new Headers(request.headers);
  applyInspectionHeaders(requestHeaders, result.normalized);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/",
    "/requests/:path*",
    "/workshops/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};
