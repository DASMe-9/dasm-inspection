import { verifyDasmUserToken } from "@/lib/api/inspection-http-auth";
import { enrichWorkshopClaims } from "./enrich-workshop-claims";
import type { NormalizedInspectionClaims } from "./normalize-claims";
import { resolveInspectionRoleFromPlatformUser } from "./platform-inspection-role";
import { verifyDasmJwt } from "./verify-dasm-jwt";

export type AuthenticateDasmTokenFailure = {
  ok: false;
  message: string;
};

export type AuthenticateDasmTokenSuccess = {
  ok: true;
  normalized: NormalizedInspectionClaims;
  /** jwt = مطالبات موقّعة؛ platform = Sanctum عبر /api/user/profile */
  source: "jwt" | "platform";
};

export type AuthenticateDasmTokenResult =
  | AuthenticateDasmTokenSuccess
  | AuthenticateDasmTokenFailure;

/**
 * يتحقق من JWT DASM إن وُجد؛ وإلا يقبل توكن Sanctum من /api/login عبر ملف المستخدم على Core.
 */
export async function authenticateDasmToken(
  token: string
): Promise<AuthenticateDasmTokenResult> {
  const trimmed = token.trim();
  if (!trimmed) {
    return { ok: false, message: "Missing token" };
  }

  const jwt = await verifyDasmJwt(trimmed);
  if (jwt.ok) {
    const normalized = await enrichWorkshopClaims(jwt.normalized);
    return { ok: true, normalized, source: "jwt" };
  }

  const profile = await verifyDasmUserToken(trimmed);
  if (!profile) {
    return {
      ok: false,
      message:
        jwt.code === "config"
          ? "Platform token rejected and JWT verifier is not configured"
          : jwt.message,
    };
  }

  const inspectionRole = resolveInspectionRoleFromPlatformUser({
    type: profile.type,
    inspectionRole: profile.inspectionRole,
  });

  if (!inspectionRole) {
    return {
      ok: false,
      message: `Account type "${profile.type ?? "unknown"}" is not allowed for inspection`,
    };
  }

  const dasmRoles: string[] = [];
  if (profile.type?.trim()) dasmRoles.push(profile.type.trim());

  const normalized = await enrichWorkshopClaims({
    userId: profile.id,
    dasmRoles,
    inspectionRole,
    workshopId: null,
    inspectorRecordId: null,
  });

  return {
    ok: true,
    source: "platform",
    normalized,
  };
}
