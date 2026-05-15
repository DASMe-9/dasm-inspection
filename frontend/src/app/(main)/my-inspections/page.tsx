import Link from "next/link";
import { cookies } from "next/headers";
import { RequestCard } from "@/components/inspection";
import { EmptyState, SectionCard } from "@/components/shared";
import { INSPECTION_DASM_USER_COOKIE } from "@/lib/cookies/inspection-gateway";
import { listInspectionRequestsForDasmUser } from "@/lib/data/inspection";

export default async function MyInspectionsPage() {
  const c = cookies();
  const uid = c.get(INSPECTION_DASM_USER_COOKIE)?.value?.trim() ?? "";
  const list = uid
    ? [...(await listInspectionRequestsForDasmUser(uid))].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    : [];

  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <h2 className="text-xl font-bold text-gray-900">طلباتي</h2>
        <p className="text-sm text-gray-500 mt-1">
          الطلبات المرتبطة بحسابك عند الدخول عبر بوابة منصّة داسم.
        </p>
      </div>

      {!uid ? (
        <SectionCard>
          <EmptyState
            title="لم نعثر على حسابك"
            description="افتح رابط الدخول من منصّة داسم (GET /api/gateway?token=…) لعرض الطلبات المرتبطة بك."
            action={
              <Link
                href="/requests"
                className="text-sm font-medium text-indigo-600 hover:underline min-h-[44px] inline-flex items-center"
              >
                الانتقال إلى طلبات الفحص →
              </Link>
            }
          />
        </SectionCard>
      ) : list.length === 0 ? (
        <SectionCard>
          <EmptyState
            title="لا طلبات بعد"
            description="أنشئ طلب فحص جديد من صفحة الطلبات ليرتبط بحسابك."
            action={
              <Link
                href="/requests"
                className="inline-flex min-h-[44px] items-center rounded-xl bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                إنشاء طلب فحص
              </Link>
            }
          />
        </SectionCard>
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </div>
      )}
    </div>
  );
}
