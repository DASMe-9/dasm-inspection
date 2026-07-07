import { NextRequest } from "next/server";
import { proxyAuthToCore } from "@/lib/api/auth-proxy";

// Proxies the Socialite single-use code exchange to DASM Core. Mirrors the
// /api/auth/login proxy so the browser only ever talks to same-origin.
export async function POST(request: NextRequest) {
  return proxyAuthToCore(request, "/api/auth/social/exchange", "طلب غير صالح");
}
