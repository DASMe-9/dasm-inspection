import { Suspense } from "react";
import { cookies } from "next/headers";
import {
  RequestCard,
  NewInspectionRequestForm,
  RequestListFilters,
} from "@/components/inspection";
import { SectionCard, EmptyState } from "@/components/shared";
import { INSPECTION_DASM_USER_COOKIE } from "@/lib/cookies/inspection-gateway";
import { parseInspectionRequestListQuery } from "@/lib/inspection-request-list-options";
import { listInspectionRequests } from "@/lib/data/inspection";

export default async function RequestsListPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const c = cookies();
  const presetDasmUserId =
    (typeof searchParams?.dasm_user_id === "string"
      ? searchParams.dasm_user_id
      : Array.isArray(searchParams?.dasm_user_id)
        ? searchParams?.dasm_user_id[0]
        : ""
    )?.trim() ||
    c.get(INSPECTION_DASM_USER_COOKIE)?.value?.trim() ||
    "";

  const listOpts = parseInspectionRequestListQuery(searchParams);
  const list = await listInspectionRequests(listOpts);

  return (
    <div className="space-y-5 md:space-y-6" dir="rtl">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
          طلبات الفحص
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          أنشئ طلباً جديداً أو تابع المسار من القائمة أدناه. استخدم الفرز والفلترة
          لتضييق القائمة.
        </p>
      </div>

      <SectionCard>
        <NewInspectionRequestForm defaultDasmUserId={presetDasmUserId} />
      </SectionCard>

      <Suspense
        fallback={
          <div
            className="h-14 animate-pulse rounded-xl bg-gray-100/80"
            aria-hidden
          />
        }
      >
        <RequestListFilters />
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
