import type { NextResponse } from "next/server";
import {
  INSPECTION_DASM_USER_COOKIE,
  INSPECTION_UI_ROLE_COOKIE,
} from "@/lib/cookies/inspection-gateway";

const GATEWAY_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

/** httpOnly cookies for DASM gateway flows (GET /api/gateway, SSO callback). */
export function setInspectionGatewayCookies(
  response: NextResponse,
  userId: string,
  inspectionRole?: string | null
): void {
  const isProd = process.env.NODE_ENV === "production";
  const cookieBase = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: GATEWAY_COOKIE_MAX_AGE,
  };

  response.cookies.set({
    name: INSPECTION_DASM_USER_COOKIE,
    value: userId,
    ...cookieBase,
  });

  const role = inspectionRole?.trim();
  if (role) {
    response.cookies.set({
      name: INSPECTION_UI_ROLE_COOKIE,
      value: role,
      ...cookieBase,
    });
  } else {
    response.cookies.delete(INSPECTION_UI_ROLE_COOKIE);
  }
}
