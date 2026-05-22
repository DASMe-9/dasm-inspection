import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authenticateDasmToken } from "@/lib/auth/authenticate-dasm-token";
import { applyInspectionHeaders } from "@/lib/auth/apply-inspection-headers";
import { extractDasmBearerToken } from "@/lib/auth/extract-token";
import { INSPECTION_INTERNAL_HEADERS } from "@/lib/auth/inspection-headers";
import { updateSession } from "@/utils/supabase/middleware";

function forwardSupabaseCookies(from: NextResponse, to: NextResponse): void {
  from.cookies.getAll().forEach(({ name, value }) => {
    to.cookies.set(name, value);
  });
}

/**
 * مسارات تبقى قابلة للوصول بدون JWT حتى مع DASM_JWT_ENFORCE (تجربة عميل تتبع، إلخ).
 * لا تُضف هنا سوى ما هو موثَّق منتجياً كعام أو شبه عام.
 */
function pathSkipsJwtEnforcement(pathname: string): boolean {
  if (pathname === "/track" || pathname.startsWith("/track/")) return true;
  if (pathname.startsWith("/auth/")) return true;
  /** خطوة 26: دليل الورش وملفاتها العامة بدون JWT */
  if (pathname === "/workshops" || pathname.startsWith("/workshops/")) {
    return true;
  }
  return false;
}

function isBrowserDocumentNavigation(request: NextRequest): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const dest = request.headers.get("sec-fetch-dest");
  if (dest === "document" || dest === "iframe") return true;
  const mode = request.headers.get("sec-fetch-mode");
  if (mode === "navigate") return true;
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html");
}

function replyWithoutJwt(
  request: NextRequest,
  sanitizedHeaders: Headers,
  sessionResponse: NextResponse
): NextResponse {
  const res = NextResponse.next({
    request: { headers: sanitizedHeaders },
  });
  forwardSupabaseCookies(sessionResponse, res);
  return res;
}

function redirectToLogin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/auth/login";
  url.searchParams.set(
    "returnTo",
    `${request.nextUrl.pathname}${request.nextUrl.search}`
  );
  return NextResponse.redirect(url);
}

/**
 * 1) إزالة أي رؤوس inspection داخلية واردة من العميل (منع الانتحال).
 * 2) تحديث جلسة Supabase (كوكيز).
 * 3) عند DASM_JWT_ENFORCE=true: JWT DASM أو توكن Sanctum (/api/login) عبر Core profile.
 */
export async function middleware(request: NextRequest) {
  const sessionResponse = await updateSession(request);

  const sanitizedHeaders = new Headers(request.headers);
  for (const name of INSPECTION_INTERNAL_HEADERS) {
    sanitizedHeaders.delete(name);
  }

  const pathname = request.nextUrl.pathname;

  if (process.env.DASM_JWT_ENFORCE !== "true") {
    return replyWithoutJwt(request, sanitizedHeaders, sessionResponse);
  }

  if (pathSkipsJwtEnforcement(pathname)) {
    return replyWithoutJwt(request, sanitizedHeaders, sessionResponse);
  }

  const token = extractDasmBearerToken(request);
  if (!token) {
    if (isBrowserDocumentNavigation(request)) {
      return redirectToLogin(request);
    }
    return new NextResponse("Unauthorized: missing DASM JWT (Bearer or cookie)", {
      status: 401,
    });
  }

  const result = await authenticateDasmToken(token);
  if (!result.ok) {
    if (isBrowserDocumentNavigation(request)) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set(
        "returnTo",
        `${request.nextUrl.pathname}${request.nextUrl.search}`
      );
      url.searchParams.set("authError", "1");
      return NextResponse.redirect(url);
    }
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
    "/workshop",
    "/workshop/:path*",
  ],
};
