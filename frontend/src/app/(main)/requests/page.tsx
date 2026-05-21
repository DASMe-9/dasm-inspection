import { Suspense } from "react";
import { cookies, headers } from "next/headers";
import {
  RequestCard,
  NewInspectionRequestForm,
  RequestListFilters,
} from "@/components/inspection";
import { SectionCard, EmptyState } from "@/components/shared";
import { INSPECTION_DASM_USER_COOKIE } from "@/lib/cookies/inspection-gateway";
import { parseInspectionRequestListQuery } from "@/lib/inspection-request-list-options";
import { getPlatformDefaultPricing } from "@/lib/data/inspection-pricing-data";
import {
  listInspectionRequests,
  listInspectionRequestsForDasmUser,
  listWorkshops,
} from "@/lib/data/inspection";
import {
  resolveInspectionPersona,
  shouldScopeRequestsToPlatformUser,
} from "@/lib/auth/resolve-inspection-persona";

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
  const listOpts = parseInspectionRequestListQuery(searchParams);

  const list =
    shouldScopeRequestsToPlatformUser(personaCtx) && personaCtx.platformUserId
      ? await listInspectionRequestsForDasmUser(
          personaCtx.platformUserId,
          listOpts
        )
      : await listInspectionRequests(listOpts);

  const workshops = await listWorkshops();
  const workshopOptions = workshops.map((w) => ({ id: w.id, name: w.name }));
  const platformPricing = await getPlatformDefaultPricing();

  const scopedNote =
    shouldScopeRequestsToPlatformUser(personaCtx) &&
    "تعرض هذه القائمة طلباتك المرتبطة بحساب منصّة داسم فقط.";

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

      <SectionCard>
        <NewInspectionRequestForm
          defaultDasmUserId={presetDasmUserId}
          platformPricing={platformPricing}
        />
      </SectionCard>

      <Suspense
        fallback={
          <div
            className="h-14 animate-pulse rounded-xl bg-gray-100/80"
            aria-hidden
          />
        }
      >
        <RequestListFilters workshopOptions={workshopOptions} />
      </Suspense>

      <SectionCard>
        {list.length === 0 ? (
          <EmptyState
            title="لا توجد طلبات"
            description="جرّب تغيير فلتر الحالة، أو أنشئ طلباً أعلاه لبدء المسار: إسناد ← فحص ← تقرير ← اعتماد أو رفض."
          />
        ) : (
          <div className="space-y-3">
            {list.map((r) => (
              <RequestCard key={r.id} request={r} />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
