import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applyInspectionHeaders } from "@/lib/auth/apply-inspection-headers";
import { extractDasmBearerToken } from "@/lib/auth/extract-token";
import { INSPECTION_INTERNAL_HEADERS } from "@/lib/auth/inspection-headers";
import { verifyDasmJwt } from "@/lib/auth/verify-dasm-jwt";
import { updateSession } from "@/utils/supabase/middleware";

function forwardSupabaseCookies(from: NextResponse, to: NextResponse): void {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
}

/**
 * 1) إزالة أي رؤوس inspection داخلية واردة من العميل (منع الانتحال عندما لا يُفرَض JWT).
 * 2) تحديث جلسة Supabase (كوكيز).
 * 3) عند DASM_JWT_ENFORCE=true: التحقق من JWT DASM وحقن رؤوس الطلب الداخلية.
 */
export async function middleware(request: NextRequest) {
  const sessionResponse = await updateSession(request);

  const sanitizedHeaders = new Headers(request.headers);
  for (const name of INSPECTION_INTERNAL_HEADERS) {
    sanitizedHeaders.delete(name);
  }

  if (process.env.DASM_JWT_ENFORCE !== "true") {
    const res = NextResponse.next({
      request: { headers: sanitizedHeaders },
    });
    forwardSupabaseCookies(sessionResponse, res);
    return res;
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

  const requestHeaders = new Headers(sanitizedHeaders);
  applyInspectionHeaders(requestHeaders, result.normalized);

  const merged = NextResponse.next({
    request: { headers: requestHeaders },
  });

  forwardSupabaseCookies(sessionResponse, merged);

  return merged;
}

export const config = {
  matcher: [
    "/",
    "/requests/:path*",
    "/my-inspections",
    "/track/:path*",
    "/workshops/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/subscription",
    "/subscription/:path*",
  ],
};
