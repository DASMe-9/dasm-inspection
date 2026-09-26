import { Suspense } from "react";
import Link from "next/link";
import {
  RequestCard,
  RequestListFilters,
} from "@/components/inspection";
import { EmptyState, SectionCard } from "@/components/shared";
import { resolveDasmUserId } from "@/lib/auth/resolve-dasm-user-id.server";
import { buildRequestListScope } from "@/lib/auth/request-list-scope.server";
import { InspectionNotificationsPanel } from "@/components/inspection/InspectionNotificationsPanel";
import {
  listInspectionRequestsForDasmUser,
  listWorkshops,
} from "@/lib/data/inspection";
import { listNotificationsForUser } from "@/lib/data/workshop-follows-data";

export default async function MyInspectionsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const uid = (await resolveDasmUserId()) ?? "";
  const workshops = await listWorkshops();
  const workshopOptions = workshops.map((w) => ({ id: w.id, name: w.name }));
  const scope = await buildRequestListScope(searchParams, workshopOptions);

  const [list, notifications] = uid
    ? await Promise.all([
        listInspectionRequestsForDasmUser(uid, scope.listOpts),
        listNotificationsForUser(uid),
      ])
    : [[], []];
  return (
    <div className="space-y-5" dir="rtl">
      <header className="border-b border-gray-200 pb-5 dark:border-slate-800">
        <p className="text-sm font-bold text-[#178847]">خدمات الفحص</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">
          طلبات الفحص
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
          فحوص الشراء والبيع والخدمات المرتبطة بحسابك في DASM.
        </p>
      </header>

      {!uid ? (
        <SectionCard>
          <EmptyState
            title="لم نعثر على حسابك"
            description="افتح رابط الدخول من منصّة DASM (GET /api/gateway?token=…) لعرض الطلبات المرتبطة بك."
            action={
              <Link
                href="/requests"
                className="text-sm font-medium text-[#1E74E8] hover:underline min-h-[44px] inline-flex items-center"
              >
                الانتقال إلى طلبات الفحص →
              </Link>
            }
          />
        </SectionCard>
      ) : (
        <>
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

          {list.length === 0 ? (
            <SectionCard>
              <EmptyState
                title="لا طلبات بهذه الحالة"
                description="غيّر الفلتر لعرض طلبات مرتبطة بحالة أخرى."
              />
            </SectionCard>
          ) : (
            <SectionCard title="طلباتي النشطة">
              <div className="space-y-3">
                {list.map((r) => (
                  <RequestCard key={r.id} request={r} />
                ))}
              </div>
            </SectionCard>
          )}

          <InspectionNotificationsPanel notifications={notifications} />

        </>
      )}
    </div>
  );
}
