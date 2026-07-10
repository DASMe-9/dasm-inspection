import {
  resolveInspectionRoleFromPlatformUser,
  type PlatformProfileForInspection,
} from "@/lib/auth/platform-inspection-role";

export function sanitizeInspectionRedirect(raw: string | null): string | null {
  if (!raw?.trim()) return null;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
    return null;
  }
  return path;
}

/** Maps paths emitted by DASM dashboard SSO buttons to inspection routes. */
export function mapPlatformSsoRedirectPath(raw: string | null): string | null {
  const path = sanitizeInspectionRedirect(raw);
  if (!path) return null;

  const url = new URL(path, "http://local");
  const search = url.search; // includes leading "?" or ""

  if (url.pathname === "/request") {
    return `/requests${search}`;
  }

  if (url.pathname === "/tracking" && !url.searchParams.has("id")) {
    return `/my-inspections${search}`;
  }

  const trackingId = url.pathname === "/tracking" ? url.searchParams.get("id")?.trim() : null;
  if (url.pathname === "/tracking" && trackingId) {
    return `/track/${encodeURIComponent(trackingId)}`;
  }

  // Legacy: "/tracking?id=…" when pathname parsing already handled above;
  // keep exact string match for callers that pass query-only style.
  const trackingMatch = path.match(/^\/tracking\?(.+)$/);
  if (trackingMatch) {
    const params = new URLSearchParams(trackingMatch[1]);
    const id = params.get("id")?.trim();
    if (id) return `/track/${encodeURIComponent(id)}`;
    return "/my-inspections";
  }

  return path;
}

export function defaultInspectionLandingPath(
  profile: PlatformProfileForInspection
): string {
  const role = resolveInspectionRoleFromPlatformUser(profile);
  if (role === "dasm_user") return "/my-inspections";
  return "/requests";
}

export function buildPostSsoDestination(
  redirectParam: string | null,
  profile: PlatformProfileForInspection,
  userId: string,
  userName: string
): string {
  const mapped =
    mapPlatformSsoRedirectPath(redirectParam) ??
    defaultInspectionLandingPath(profile);

  const role = resolveInspectionRoleFromPlatformUser(profile);
  if (role !== "dasm_user") return mapped;

  const needsGateway =
    mapped === "/requests" ||
    mapped.startsWith("/requests?") ||
    mapped === "/my-inspections" ||
    mapped.startsWith("/my-inspections?");

  if (!needsGateway) return mapped;

  const url = new URL(mapped, "http://local");
  url.searchParams.set("gateway", "dasm");
  url.searchParams.set("dasm_user_id", userId);
  if (userName.trim()) url.searchParams.set("user_name", userName.trim());
  return `${url.pathname}${url.search}`;
}
