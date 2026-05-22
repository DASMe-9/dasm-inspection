import "server-only";

import { cookies, headers } from "next/headers";
import { getInspectionAuthContext } from "@/lib/auth/inspection-context.server";
import { parseInspectionRequestListQuery } from "@/lib/inspection-request-list-options";
import { resolveInspectionPersona } from "@/lib/auth/resolve-inspection-persona";
import { resolveWorkshopIdFromAuth } from "@/lib/auth/workshop-dashboard.server";
import {
  resolveRequestListScope,
  type RequestListScope,
  type WorkshopFilterOption,
} from "@/lib/request-list-scope";

export type { RequestListScope, WorkshopFilterOption };

export async function buildRequestListScope(
  searchParams?: Record<string, string | string[] | undefined>,
  workshops: WorkshopFilterOption[] = []
): Promise<RequestListScope> {
  const headersList = headers();
  const cookieStore = cookies();
  const personaCtx = resolveInspectionPersona(headersList, cookieStore);
  const parsedQuery = parseInspectionRequestListQuery(searchParams);

  const authCtx = await getInspectionAuthContext();
  const authWorkshopId =
    authCtx?.workshopId?.trim() ?? (await resolveWorkshopIdFromAuth());
  const authInspectorRecordId = authCtx?.inspectorRecordId?.trim() ?? null;

  return resolveRequestListScope({
    persona: personaCtx,
    parsedQuery,
    authWorkshopId,
    authInspectorRecordId,
    workshops,
  });
}
