/**
 * ربط هوية منصّة DASM (Sanctum + /api/user/profile) بأدوار واجهة الفحص.
 * يُستخدم عندما DASM_JWT_ENFORCE=true لكن التوكن ليس JWT موقّعاً (تسجيل دخول /api/login).
 */

const KNOWN_INSPECTION_ROLES = new Set([
  "super_admin",
  "inspection_admin",
  "workshop_manager",
  "workshop_owner",
  "mechanic",
  "inspector",
  "viewer",
  "dasm_user",
]);

export type PlatformProfileForInspection = {
  type?: string | null;
  inspectionRole?: string | null;
};

/** أنواع حسابات المنصّة المسموح لها دخول inspect.dasm.com.sa عبر /auth/login */
export const INSPECTION_LOGIN_PLATFORM_TYPES = [
  "super_admin",
  "admin",
  "moderator",
  "programmer",
  "venue_owner",
  "dealer",
  "user",
] as const;

export function resolveInspectionRoleFromPlatformUser(
  profile: PlatformProfileForInspection
): string | null {
  const explicit = profile.inspectionRole?.trim();
  if (explicit && KNOWN_INSPECTION_ROLES.has(explicit)) {
    return explicit;
  }

  const platformType = profile.type?.trim();
  if (!platformType) return null;

  switch (platformType) {
    case "super_admin":
    case "admin":
    case "moderator":
    case "programmer":
      return "inspection_admin";
    case "venue_owner":
    case "dealer":
      return "workshop_owner";
    case "user":
      return "dasm_user";
    default:
      return null;
  }
}

export function platformTypeAllowedForInspectionLogin(type: string): boolean {
  return resolveInspectionRoleFromPlatformUser({ type }) !== null;
}
