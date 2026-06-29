"use client";

/**
 * Social sign-in helpers for DASM Inspection.
 *
 * Identity source of truth is DASM Core (api.dasm.com.sa) — same as the rest of
 * the platform. Google uses the Core Socialite redirect flow (top-level nav →
 * Core → back to /auth/social/callback with a single-use code). Apple keeps the
 * id_token flow. Both resolve to a Core Sanctum token + user, which we gate by
 * platform type and persist via setInspectionBrowserSession.
 */

import { platformTypeAllowedForInspectionLogin } from "./platform-inspection-role";
import {
  setInspectionBrowserSession,
  type InspectionSessionUser,
} from "./inspection-browser-session";

const CORE_URL = (
  process.env.NEXT_PUBLIC_DASM_CORE_URL || "https://api.dasm.com.sa"
).replace(/\/$/, "");

const RETURN_KEY = "inspection_post_social_return";

type CoreAuthBody = {
  status?: string;
  message?: string;
  access_token?: string;
  user?: ({ type?: string | null } & Record<string, unknown>) | null;
  data?: {
    access_token?: string;
    user?: ({ type?: string | null } & Record<string, unknown>) | null;
  } | null;
};

export type SocialApplyResult =
  | { ok: true }
  | { ok: false; denied?: string; linkRequired?: boolean; error?: string };

/** Google: leave the SPA for Core's consent redirect, stashing the returnTo. */
export function startGoogleRedirectLogin(returnTo?: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(RETURN_KEY, returnTo || "");
  } catch {
    /* sessionStorage may be unavailable */
  }
  const params = new URLSearchParams({ return: window.location.origin });
  window.location.assign(`${CORE_URL}/api/auth/google/redirect?${params.toString()}`);
}

export function readStashedReturn(): string {
  try {
    const v = window.sessionStorage.getItem(RETURN_KEY);
    if (v && v.startsWith("/") && !v.startsWith("//") && !v.includes("://")) {
      return v === "/" ? "/dashboard" : v;
    }
  } catch {
    /* noop */
  }
  return "/dashboard";
}

export function clearStashedReturn(): void {
  try {
    window.sessionStorage.removeItem(RETURN_KEY);
  } catch {
    /* noop */
  }
}

/** Turn a Core auth response into an inspection session (with role gating). */
function applySocialResponse(body: CoreAuthBody): SocialApplyResult {
  if (body?.status === "link_required") {
    return {
      ok: false,
      linkRequired: true,
      error:
        body?.message ||
        "يوجد حساب بهذا البريد. اربطه من منصة داسم الرئيسية ثم عُد.",
    };
  }

  const token = body?.data?.access_token ?? body?.access_token;
  const user = body?.data?.user ?? body?.user;
  if (!token || !user) {
    return { ok: false, error: body?.message || "استجابة غير متوقعة من الخادم." };
  }

  const userType = String(user.type ?? "");
  if (!platformTypeAllowedForInspectionLogin(userType)) {
    return { ok: false, denied: userType || "unknown" };
  }

  setInspectionBrowserSession(token, user as InspectionSessionUser);
  return { ok: true };
}

/** Exchange the one-time code from the Google redirect callback. */
export async function exchangeSocialCode(code: string): Promise<SocialApplyResult> {
  try {
    const res = await fetch("/api/auth/social-exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const body = (await res.json().catch(() => ({}))) as CoreAuthBody;
    if (!res.ok && !body?.status) {
      return { ok: false, error: body?.message || "تعذّر إكمال تسجيل الدخول." };
    }
    return applySocialResponse(body);
  } catch {
    return { ok: false, error: "تعذّر الاتصال بالخادم. حاول خلال لحظات." };
  }
}

/** Apple id_token sign-in (proxied to Core /api/auth/apple). */
export async function loginWithApple(idToken: string): Promise<SocialApplyResult> {
  try {
    const res = await fetch("/api/auth/apple", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: idToken }),
    });
    const body = (await res.json().catch(() => ({}))) as CoreAuthBody;
    if (!res.ok && !body?.status) {
      return { ok: false, error: body?.message || "تعذّر تسجيل الدخول عبر Apple." };
    }
    return applySocialResponse(body);
  } catch {
    return { ok: false, error: "تعذّر الاتصال بالخادم. حاول خلال لحظات." };
  }
}
