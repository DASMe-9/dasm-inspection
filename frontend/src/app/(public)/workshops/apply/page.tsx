import Link from "next/link";
import { WorkshopApplyForm } from "@/components/inspection/WorkshopApplyForm";
import { SectionCard } from "@/components/shared";
import { PUBLIC_BRAND } from "@/components/public-site/brand-tokens";
import { resolveDasmUserId } from "@/lib/auth/resolve-dasm-user-id.server";
import { getWorkshopInviteByToken } from "@/lib/data/workshop-invites-data";

type Props = { searchParams: Promise<{ invite?: string }> };

export default async function WorkshopApplyPage({ searchParams }: Props) {
  const sp = await searchParams;
  const dasmUserId = await resolveDasmUserId();
  const inviteToken = sp.invite?.trim() || null;
  const invite = inviteToken ? await getWorkshopInviteByToken(inviteToken) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-6" dir="rtl">
      <div className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-700/80 dark:bg-slate-900/70 dark:ring-white/5 md:p-6">
        <Link
          href="/workshops"
          className="text-sm font-medium text-slate-600 transition hover:text-[var(--inspection-navy)] dark:text-slate-300 dark:hover:text-white"
        >
          ← العودة إلى شبكة الورش
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--inspection-navy)] dark:text-white md:text-[1.7rem]">
          انضم كورشة شريكة
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
          قدّم طلب انضمام لشبكة فحص داسم. يُراجع الفريق الطلب ويتواصل معكم — عند
          الاعتماد يُربط حساب داسم نفسه بلوحة الورشة تلقائياً.
        </p>
        {inviteToken && !invite ? (
          <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-red-900 dark:border-red-500/40 dark:bg-red-950/70 dark:text-red-100">
            رابط الدعوة غير صالح أو منتهٍ. يمكنك التقديم يدوياً أو طلب رابط جديد
            من الإدارة.
          </p>
        ) : null}
        {!dasmUserId && !invite ? (
          <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-amber-950 dark:border-amber-400/35 dark:bg-amber-950/55 dark:text-amber-50">
            يُفضّل{" "}
            <Link
              href="/auth/login?returnTo=/workshops/apply"
              className="font-bold text-emerald-800 underline decoration-2 underline-offset-2 dark:text-emerald-300"
            >
              تسجيل الدخول بحساب داسم
            </Link>{" "}
            قبل التقديم لربط الورشة بحسابك مباشرة بعد الاعتماد.
          </p>
        ) : null}
        {dasmUserId ? (
          <p className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-emerald-950 dark:border-emerald-400/35 dark:bg-emerald-950/55 dark:text-emerald-50">
            أنت مسجّل بحساب داسم — سيُربط تلقائياً كمالك للورشة عند الاعتماد.
          </p>
        ) : null}
      </div>

      <SectionCard
        title="نموذج التقديم"
        className="border-slate-200/90 shadow-md ring-slate-900/[0.04] dark:border-slate-600 dark:bg-slate-900 dark:shadow-black/30 dark:ring-white/10"
      >
        <WorkshopApplyForm dasmUserId={dasmUserId} invite={invite} />
      </SectionCard>

      <p className="text-center text-xs text-slate-600 dark:text-slate-300">
        لديك اشتراك فعّال؟{" "}
        <Link
          href="/subscription"
          className="font-semibold transition hover:underline"
          style={{ color: PUBLIC_BRAND.green }}
        >
          إدارة اشتراك الورش
        </Link>
      </p>
    </div>
  );
}
