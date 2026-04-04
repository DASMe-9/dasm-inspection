import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applyInspectionHeaders } from "@/lib/auth/apply-inspection-headers";
import { extractDasmBearerToken } from "@/lib/auth/extract-token";
import { verifyDasmJwt } from "@/lib/auth/verify-dasm-jwt";
import { updateSession } from "@/utils/supabase/middleware";

/**
 * 1) تحديث جلسة Supabase (كوكيز).
 * 2) عند DASM_JWT_ENFORCE=true: التحقق من JWT DASM وحقن رؤوس الطلب الداخلية.
 */
export async function middleware(request: NextRequest) {
  const sessionResponse = await updateSession(request);

  if (process.env.DASM_JWT_ENFORCE !== "true") {
    return sessionResponse;
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

  const merged = NextResponse.next({
    request: { headers: requestHeaders },
  });

  sessionResponse.cookies.getAll().forEach(({ name, value }) => {
    merged.cookies.set(name, value);
  });

  return merged;
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
