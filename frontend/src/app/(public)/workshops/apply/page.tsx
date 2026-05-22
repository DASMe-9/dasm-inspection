import Link from "next/link";
import { WorkshopApplyForm } from "@/components/inspection/WorkshopApplyForm";
import { SectionCard } from "@/components/shared";
import { TOKENS } from "@/lib/theme";

export default function WorkshopApplyPage() {
  const { primary } = TOKENS.colors.roles.workshop;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-6" dir="rtl">
      <div>
        <Link
          href="/workshops"
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          ← العودة إلى شبكة الورش
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          انضم كورشة شريكة
        </h1>
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
          قدّم طلب انضمام لشبكة فحص داسم. يُراجع الفريق الطلب ويتواصل معكم — لا
          يُنشئ هذا النموذج حساباً تلقائياً.
        </p>
      </div>

      <SectionCard title="نموذج التقديم">
        <WorkshopApplyForm />
      </SectionCard>

      <p className="text-xs text-gray-500 text-center">
        لديك اشتراك فعّال؟{" "}
        <Link href="/subscription" className="font-medium" style={{ color: primary }}>
          إدارة اشتراك الورش
        </Link>
      </p>
    </div>
  );
}
