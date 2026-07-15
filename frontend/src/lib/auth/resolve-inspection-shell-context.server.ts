import "server-only";

import { cookies, headers } from "next/headers";
import {
  fetchDasmUserProfile,
  type DasmProfileUser,
} from "@/lib/api/inspection-http-auth";
import type { InspectionShellContext } from "@/lib/auth/inspection-shell-context";
import { getDasmProfileSecurityUrl } from "@/lib/platform-urls";
import { resolveInspectionPersona } from "@/lib/auth/resolve-inspection-persona";
import { isWorkshopDashboardRole } from "@/lib/auth/workshop-dashboard";
import { resolveWorkshopSidebarProfileLink } from "@/lib/auth/resolve-workshop-sidebar-link.server";

function formatPersonName(profile: DasmProfileUser): string {
  const combined = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
  if (combined) return combined;
  if (profile.name?.trim()) return profile.name.trim();
  if (profile.email?.trim()) return profile.email.trim();
  return "مستخدم";
}

function pickAreaLabel(profile: DasmProfileUser): string | null {
  const fromAddress = profile.address?.areaLabel?.trim();
  if (fromAddress) return fromAddress;
  const fromDisplay = profile.displayLocation?.trim();
  return fromDisplay || null;
}

function pickCity(profile: DasmProfileUser, workshopCity?: string | null): string | null {
  const fromAddress = profile.address?.city?.trim();
  if (fromAddress) return fromAddress;
  if (workshopCity?.trim()) return workshopCity.trim();
  return null;
}

export async function resolveInspectionShellContext(): Promise<InspectionShellContext | null> {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("dasm_access_token")?.value?.trim() ??
    cookieStore.get("inspection_token")?.value?.trim();
  if (!token) return null;

  const profile = await fetchDasmUserProfile(token);

  const headersList = await headers();
  const personaCtx = resolveInspectionPersona(headersList, cookieStore);
  const workshopLink = await resolveWorkshopSidebarProfileLink(personaCtx);
  const isWorkshopOp = isWorkshopDashboardRole(personaCtx.persona);

  const baseProfile = profile ?? {
    id: "",
    firstName: null,
    lastName: null,
    name: undefined,
    email: null,
    userCode: null,
    displayLocation: null,
    address: null,
  };

  return {
    personDisplayName: profile ? formatPersonName(profile) : "مستخدم",
    email: baseProfile.email?.trim() || null,
    userCode: baseProfile.userCode?.trim() || null,
    areaLabel: profile ? pickAreaLabel(profile) : null,
    city: profile ? pickCity(profile, workshopLink?.city) : workshopLink?.city ?? null,
    coreProfileUrl: getDasmProfileSecurityUrl(),
    workshopProfileHref: workshopLink?.profileHref ?? null,
    workshopPublicHref: workshopLink?.publicHref ?? null,
    workshopWelcome:
      isWorkshopOp && workshopLink
        ? {
            workshopId: workshopLink.workshopId,
            workshopName: workshopLink.name,
          }
        : null,
  };
}
