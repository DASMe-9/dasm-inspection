import type { ListInspectionRequestsQueryOptions } from "@/lib/inspection-request-list-options";
import { isWorkshopOperatorRole } from "@/lib/auth/workshop-dashboard";
import type { ResolvedInspectionPersona } from "@/lib/auth/resolve-inspection-persona";
import type { InspectionServiceMode } from "@/types";

export type WorkshopFilterOption = { id: string; name: string };

export type RequestListScopeInput = {
  persona: ResolvedInspectionPersona;
  parsedQuery: ListInspectionRequestsQueryOptions;
  authWorkshopId: string | null;
  authInspectorRecordId: string | null;
  workshops: WorkshopFilterOption[];
};

export type RequestListScope = {
  listOpts: ListInspectionRequestsQueryOptions;
  workshopOptions: WorkshopFilterOption[];
  lockedWorkshopId: string | null;
  lockedWorkshopName: string | null;
  showWorkshopFilter: boolean;
  showServiceModeFilter: boolean;
  scopedNote?: string;
  usePlatformUserScope: boolean;
  platformUserId: string | null;
};

function workshopName(
  workshops: WorkshopFilterOption[],
  id: string | null
): string | null {
  if (!id) return null;
  return workshops.find((w) => w.id === id)?.name ?? null;
}

/** يطبّق نطاق الدور على خيارات قائمة الطلبات (بدون I/O). */
export function resolveRequestListScope(
  input: RequestListScopeInput
): RequestListScope {
  const { persona, parsedQuery, authWorkshopId, authInspectorRecordId, workshops } =
    input;

  if (persona.persona === "dasm_user" && persona.platformUserId) {
    return {
      listOpts: parsedQuery,
      workshopOptions: workshops,
      lockedWorkshopId: null,
      lockedWorkshopName: null,
      showWorkshopFilter: workshops.length > 0,
      showServiceModeFilter: true,
      scopedNote:
        "تعرض هذه القائمة طلباتك المرتبطة بحساب منصّة داسم فقط.",
      usePlatformUserScope: true,
      platformUserId: persona.platformUserId,
    };
  }

  if (isWorkshopOperatorRole(persona.persona) && authWorkshopId) {
    const name = workshopName(workshops, authWorkshopId);
    return {
      listOpts: {
        ...parsedQuery,
        workshopId: authWorkshopId,
      },
      workshopOptions: name
        ? [{ id: authWorkshopId, name }]
        : [{ id: authWorkshopId, name: "ورشتك" }],
      lockedWorkshopId: authWorkshopId,
      lockedWorkshopName: name,
      showWorkshopFilter: false,
      showServiceModeFilter: true,
      scopedNote: name
        ? `طلبات ورشة «${name}» فقط.`
        : "طلبات ورشتك المرتبطة بحسابك فقط.",
      usePlatformUserScope: false,
      platformUserId: null,
    };
  }

  if (
    (persona.persona === "inspector" || persona.persona === "mechanic") &&
    authInspectorRecordId
  ) {
    const wId = authWorkshopId ?? parsedQuery.workshopId;
    return {
      listOpts: {
        ...parsedQuery,
        workshopId: wId,
        inspectorId: authInspectorRecordId,
      },
      workshopOptions: wId
        ? workshops.filter((w) => w.id === wId)
        : workshops,
      lockedWorkshopId: wId ?? null,
      lockedWorkshopName: workshopName(workshops, wId ?? null),
      showWorkshopFilter: false,
      showServiceModeFilter: true,
      scopedNote: "طلباتك المُسنَدة إليك كمفتش فقط.",
      usePlatformUserScope: false,
      platformUserId: null,
    };
  }

  const isAdmin =
    persona.persona === "inspection_admin" || persona.persona === "super_admin";

  return {
    listOpts: parsedQuery,
    workshopOptions: workshops,
    lockedWorkshopId: null,
    lockedWorkshopName: null,
    showWorkshopFilter: isAdmin && workshops.length > 0,
    showServiceModeFilter: true,
    usePlatformUserScope: false,
    platformUserId: null,
  };
}

export function serviceModeLabelAr(mode: InspectionServiceMode): string {
  return mode === "field" ? "فحص ميداني" : "في الورشة";
}
