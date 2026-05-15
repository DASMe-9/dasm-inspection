import { cookies } from "next/headers";
import { RequestCard, NewInspectionRequestForm } from "@/components/inspection";
import { SectionCard, EmptyState } from "@/components/shared";
import { INSPECTION_DASM_USER_COOKIE } from "@/lib/cookies/inspection-gateway";
import { listInspectionRequests } from "@/lib/data/inspection";

export default async function RequestsListPage({
  searchParams,
}: {
  searchParams?: { gateway?: string; dasm_user_id?: string };
}) {
  const c = cookies();
  const presetDasmUserId =
    searchParams?.dasm_user_id?.trim() ||
    c.get(INSPECTION_DASM_USER_COOKIE)?.value?.trim() ||
    "";

  const list = [...(await listInspectionRequests())].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="space-y-4" dir="rtl">
      <h2 className="text-lg font-bold text-gray-800">طلبات الفحص</h2>

      <SectionCard>
        <NewInspectionRequestForm defaultDasmUserId={presetDasmUserId} />
      </SectionCard>

      <SectionCard>
        {list.length === 0 ? (
          <EmptyState
            title="لا توجد طلبات"
            description="أنشئ طلباً أعلاه لبدء المسار: إسناد ← فحص ← تقرير ← اعتماد أو رفض."
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
