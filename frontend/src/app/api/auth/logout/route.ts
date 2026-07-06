import { NextRequest, NextResponse } from "next/server";
import {
  INSPECTION_DASM_USER_COOKIE,
  INSPECTION_UI_ROLE_COOKIE,
} from "@/lib/cookies/inspection-gateway";

// كل كوكيز جلسة تطبيق الفحص التي يجب مسحها عند الخروج.
const AUTH_COOKIES = [
  INSPECTION_DASM_USER_COOKIE,
  INSPECTION_UI_ROLE_COOKIE,
  "dasm_access_token",
  "inspection_token",
];

function clearAndRedirect(request: NextRequest): NextResponse {
  const res = NextResponse.redirect(new URL("/", request.url));
  for (const name of AUTH_COOKIES) res.cookies.delete(name);
  return res;
}

/** GET/POST /api/auth/logout — يمسح كوكيز الجلسة ويعيد للصفحة الرئيسية. */
export async function GET(request: NextRequest) {
  return clearAndRedirect(request);
}

export async function POST(request: NextRequest) {
  return clearAndRedirect(request);
}
