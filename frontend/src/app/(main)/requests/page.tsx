import { Suspense } from "react";
import { cookies, headers } from "next/headers";
import {
  RequestCard,
  NewInspectionRequestForm,
  RequestListFilters,
} from "@/components/inspection";
import { SectionCard, EmptyState } from "@/components/shared";
import { AdSlot } from "@/components/ads/AdSlot";
import { INSPECTION_DASM_USER_COOKIE } from "@/lib/cookies/inspection-gateway";
import { buildRequestListScope } from "@/lib/auth/request-list-scope.server";
import { getPlatformDefaultPricing } from "@/lib/data/inspection-pricing-data";
import {
  listInspectionRequests,
  listInspectionRequestsForDasmUser,
  listWorkshops,
} from "@/lib/data/inspection";
import { isWorkshopOperatorRole } from "@/lib/auth/workshop-dashboard";
import { resolveInspectionPersona } from "@/lib/auth/resolve-inspection-persona";

export default async function RequestsListPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const cookieStore = cookies();
  const presetDasmUserId =
    (typeof searchParams?.dasm_user_id === "string"
      ? searchParams.dasm_user_id
      : Array.isArray(searchParams?.dasm_user_id)
        ? searchParams?.dasm_user_id[0]
        : ""
    )?.trim() ||
    cookieStore.get(INSPECTION_DASM_USER_COOKIE)?.value?.trim() ||
    "";

  const headersList = headers();
  const personaCtx = resolveInspectionPersona(headersList, cookieStore);
  const workshops = await listWorkshops();
  const workshopOptions = workshops.map((w) => ({ id: w.id, name: w.name }));
  const scope = await buildRequestListScope(searchParams, workshopOptions);

  const list = scope.usePlatformUserScope
    ? await listInspectionRequestsForDasmUser(
        scope.platformUserId!,
        scope.listOpts
      )
    : await listInspectionRequests(scope.listOpts);

  const workshopNameById = new Map(workshopOptions.map((w) => [w.id, w.name]));

  const platformPricing = await getPlatformDefaultPricing();
  const hideNewRequestForm = isWorkshopOperatorRole(personaCtx.persona);

  const scopedNote = scope.scopedNote;

  return (
    <div className="space-y-5 md:space-y-6" dir="rtl">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
          طلبات الفحص
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          أنشئ طلباً جديداً أو تابع المسار من القائمة أدناه. استخدم الفرز والفلترة
          لتضييق القائمة.
          {scopedNote ? ` ${scopedNote}` : ""}
        </p>
      </div>

      {!hideNewRequestForm ? (
        <SectionCard>
          <NewInspectionRequestForm
            defaultDasmUserId={presetDasmUserId}
            platformPricing={platformPricing}
          />
        </SectionCard>
      ) : null}

      <Suspense
        fallback={
          <div
            className="h-14 animate-pulse rounded-xl bg-gray-100/80"
            aria-hidden
          />
        }
      >
        <RequestListFilters
          workshopOptions={scope.workshopOptions}
          lockedWorkshopId={scope.lockedWorkshopId}
          lockedWorkshopName={scope.lockedWorkshopName}
          showWorkshopFilter={scope.showWorkshopFilter}
          showServiceModeFilter={scope.showServiceModeFilter}
          resultCount={list.length}
        />
      </Suspense>

      <SectionCard>
        {list.length === 0 ? (
          <EmptyState
            title="لا توجد طلبات"
            description="جرّب تغيير فلتر الحالة أو نوع الخدمة، أو أنشئ طلباً لبدء المسار: إسناد ← فحص ← تقرير ← اعتماد أو رفض."
          />
        ) : (
          <div className="space-y-3">
            {list.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                showServiceMode
                workshopName={
                  scope.showWorkshopFilter && r.workshopId
                    ? workshopNameById.get(r.workshopId)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* W-007 — DASM Ads inline slot (booking surface) */}
      <AdSlot slotKey="inspection.booking.inline" />
    </div>
  );
}
