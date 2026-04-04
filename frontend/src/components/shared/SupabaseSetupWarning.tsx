import { SectionCard } from "@/components/shared/SectionCard";

export function SupabaseSetupWarning() {
  return (
    <SectionCard title="إعداد Supabase">
      <p className="text-sm text-gray-700" dir="rtl">
        أضف في <code className="text-xs">frontend/.env.local</code> القيم التالية
        ثم أعد تشغيل الخادم:
      </p>
      <ul className="text-xs font-mono mt-2 space-y-1 text-gray-600" dir="ltr">
        <li>NEXT_PUBLIC_SUPABASE_URL=...</li>
        <li>SUPABASE_SERVICE_ROLE_KEY=...</li>
      </ul>
      <p className="text-xs text-gray-500 mt-2" dir="rtl">
        المفتاح السري يُستخدم فقط في Server Actions / RSC ولا يُعرَض للمتصفح.
        طبّق الهجرة من <code className="text-xs">supabase/migrations</code> على
        مشروعك.
      </p>
    </SectionCard>
  );
}
