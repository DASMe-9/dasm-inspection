import type { NextResponse } from "next/server";
import {
  INSPECTION_DASM_USER_COOKIE,
  INSPECTION_UI_ROLE_COOKIE,
} from "@/lib/cookies/inspection-gateway";

const GATEWAY_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

/** Session-token cookies read by the protected (main) layout gate. */
const SESSION_COOKIE_NAMES = ["dasm_access_token", "inspection_token"] as const;
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days — matches the SSO session token TTL.

/**
 * Sets the session-token cookies the protected `(main)` layout gate reads
 * (`dasm_access_token` / `inspection_token`). Mirrors the client-side
 * manual-login session (`setInspectionBrowserSession`) — non-httpOnly, so the
 * SPA can read the token client-side for API calls — so a GET /api/gateway
 * handoff actually authenticates the SPA instead of bouncing to the login page.
 */
export function setInspectionSessionCookies(
  response: NextResponse,
  token: string
): void {
  const isProd = process.env.NODE_ENV === "production";
  const base = {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  };
  for (const name of SESSION_COOKIE_NAMES) {
    response.cookies.set({ name, value: token, ...base });
  }
}

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
