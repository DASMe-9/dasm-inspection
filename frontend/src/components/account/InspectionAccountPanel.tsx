import {
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { InspectionShellContext } from "@/lib/auth/inspection-shell-context";

type Props = { profile: InspectionShellContext | null };

function Status({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> موثّق
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
      <XCircle className="h-3.5 w-3.5" aria-hidden /> غير مكتمل
    </span>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  status,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  status?: boolean;
}) {
  return (
    <div className="grid gap-2 border-t border-slate-100 py-3 first:border-t-0 sm:grid-cols-[1fr_auto] sm:items-center dark:border-slate-700">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        <div className="min-w-0">
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
        </div>
      </div>
      {status === undefined ? null : <Status ok={status} />}
    </div>
  );
}

export function InspectionAccountPanel({ profile }: Props) {
  const location = [profile?.district, profile?.city ?? profile?.areaLabel]
    .filter(Boolean)
    .join("، ");
  const nationalAddressReady =
    profile?.nationalAddressStatus === "verified" ||
    Boolean(profile?.nationalAddressShort);

  return (
    <section
      id="account"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
      aria-labelledby="inspection-account-title"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div>
          <h2 id="inspection-account-title" className="text-sm font-bold text-slate-900 dark:text-white">
            حسابي في فحص DASM
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            بيانات الهوية المركزية اللازمة لخدمة الفحص فقط
          </p>
        </div>
        <ShieldCheck className="h-5 w-5 text-emerald-500" aria-hidden />
      </div>
      <div className="px-4">
        <Row icon={UserRound} label="الاسم" value={profile?.personDisplayName ?? "غير متاح"} />
        <Row icon={Mail} label="البريد الإلكتروني" value={profile?.email ?? "غير مضاف"} status={profile?.emailVerified ?? false} />
        <Row icon={Phone} label="رقم الجوال" value={profile?.phone ?? "غير مضاف"} status={profile?.phoneVerified ?? false} />
        <Row icon={MapPin} label="موقع خدمات الفحص الميداني" value={location || "لم يُحدّد بعد"} status={profile?.primaryLocationConfirmed ?? false} />
        {profile?.nationalAddressShort || profile?.nationalAddressStatus ? (
          <Row icon={MapPin} label="العنوان الوطني" value={profile.nationalAddressShort ?? "محفوظ في حساب DASM"} status={nationalAddressReady} />
        ) : null}
      </div>
    </section>
  );
}
