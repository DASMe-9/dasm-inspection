import { EmptyState, SectionCard } from "@/components/shared";
import { resolveIsWorkshopFinancialViewer } from "@/lib/auth/require-workshop-persona.server";
import SubscriptionPanel from "./SubscriptionPanel";

// حارس خادمي: «الاشتراك الشهري» = شرائح عمولة الورشة (B2B) لمالك/مدير الورشة والأدمن
// فقط. أي دور آخر (عميل/فاحص/…) يرى رسالة بدل جدول الشرائح — حتى بفتح الرابط مباشرةً.
export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const allowed = await resolveIsWorkshopFinancialViewer();

  if (!allowed) {
    return (
      <div className="space-y-5" dir="rtl">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-slate-100">
          الاشتراك الشهري
        </h2>
        <SectionCard>
          <EmptyState
            title="صفحة مخصّصة للورش"
            description="اشتراك شرائح العمولة الشهرية متاح لأصحاب ومديري الورش المعتمدة فقط. رسوم فحوصاتك تُدفع مباشرةً عند الطلب."
          />
        </SectionCard>
      </div>
    );
  }

  return <SubscriptionPanel />;
}
