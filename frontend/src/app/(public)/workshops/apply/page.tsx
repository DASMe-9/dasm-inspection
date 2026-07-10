import Link from "next/link";
import { WorkshopApplyForm } from "@/components/inspection/WorkshopApplyForm";
import { SectionCard } from "@/components/shared";
import { resolveDasmUserId } from "@/lib/auth/resolve-dasm-user-id.server";
import { getWorkshopInviteByToken } from "@/lib/data/workshop-invites-data";
import { TOKENS } from "@/lib/theme";

type Props = { searchParams: Promise<{ invite?: string }> };

export default async function WorkshopApplyPage({ searchParams }: Props) {
  const { primary } = TOKENS.colors.roles.workshop;
  const sp = await searchParams;
  const dasmUserId = await resolveDasmUserId();
  const inviteToken = sp.invite?.trim() || null;
  const invite = inviteToken ? await getWorkshopInviteByToken(inviteToken) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-6" dir="rtl">
      <div>
        <Link
          href="/workshops"
          className="text-sm text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        >
          ← العودة إلى شبكة الورش
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
          انضم كورشة شريكة
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          قدّم طلب انضمام لشبكة فحص داسم. يُراجع الفريق الطلب ويتواصل معكم — عند
          الاعتماد يُربط حساب داسم نفسه بلوحة الورشة تلقائياً.
        </p>
        {inviteToken && !invite ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            رابط الدعوة غير صالح أو منتهٍ. يمكنك التقديم يدوياً أو طلب رابط جديد
            من الإدارة.
          </p>
        ) : null}
        {!dasmUserId && !invite ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            يُفضّل{" "}
            <Link
              href="/auth/login?returnTo=/workshops/apply"
              className="font-semibold underline"
            >
              تسجيل الدخول بحساب داسم
            </Link>{" "}
            قبل التقديم لربط الورشة بحسابك مباشرة بعد الاعتماد.
          </p>
        ) : null}
        {dasmUserId ? (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            أنت مسجّل بحساب داسم — سيُربط تلقائياً كمالك للورشة عند الاعتماد.
          </p>
        ) : null}
      </div>

      <SectionCard title="نموذج التقديم">
        <WorkshopApplyForm dasmUserId={dasmUserId} invite={invite} />
      </SectionCard>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        لديك اشتراك فعّال؟{" "}
        <Link href="/subscription" className="font-medium" style={{ color: primary }}>
          إدارة اشتراك الورش
        </Link>
      </p>
    </div>
  );
}
