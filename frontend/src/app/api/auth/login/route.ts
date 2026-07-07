import { NextRequest } from "next/server";
import { proxyAuthToCore } from "@/lib/api/auth-proxy";

export async function POST(request: NextRequest) {
  return proxyAuthToCore(request, "/api/login", "بيانات تسجيل الدخول غير صالحة");
}
