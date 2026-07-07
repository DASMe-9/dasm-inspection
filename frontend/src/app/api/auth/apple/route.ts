import { NextRequest } from "next/server";
import { proxyAuthToCore } from "@/lib/api/auth-proxy";

// Proxies Apple id_token sign-in to DASM Core (/api/auth/apple). Apple is not on
// Socialite, so it keeps the id_token flow used across the other DASM apps.
export async function POST(request: NextRequest) {
  return proxyAuthToCore(request, "/api/auth/apple", "طلب غير صالح");
}
