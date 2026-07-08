import Link from "next/link";
import { EmptyState, SectionCard, StatCard } from "@/components/shared";
import { resolveDasmUserId } from "@/lib/auth/resolve-dasm-user-id.server";
import { resolveWalletAudience } from "@/lib/auth/require-workshop-persona.server";
import {
  getInspectionLedgerSummary,
  getInspectionWalletBalance,
  type InspectionLedgerSummary,
  type InspectionWalletBalance,
} from "@/lib/core/fetch-inspection-wallet";

export const dynamic = "force-dynamic";

// دلالة الورشة: أرباح/صرف. دلالة العميل: شحن/خصم فحص فقط (لا لغة أرباح/صرف).
const WORKSHOP_ENTRY_LABELS: Record<string, string> = {
  admin_fee_collected: "رسوم فحص محصّلة",
  wallet_topup: "شحن رصيد",
  wallet_withdrawal: "سحب",
  payout: "صرف",
};
const CUSTOMER_ENTRY_LABELS: Record<string, string> = {
  wallet_topup: "شحن رصيد",
  inspection_fee_paid: "دفع فحص",
  admin_fee_collected: "رسوم فحص",
  wallet_withdrawal: "سحب",
  payout: "استرداد للمحفظة",
};

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function WalletPage() {
  const audience = await resolveWalletAudience();

  // طاقم الميدان (فاحص/فنّي/عارض) والمجهول: لا محفظة.
  if (audience === "none") {
    return (
      <div className="space-y-5" dir="rtl">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-slate-100">
          المحفظة
        </h2>
        <SectionCard>
          <EmptyState
            title="لا محفظة لهذا الحساب"
            description="المحفظة متاحة للعملاء (رصيد فحص) ولأصحاب/مديري الورش (أرباح وصرف)."
          />
        </SectionCard>
      </div>
    );
  }

  const uid = (await resolveDasmUserId()) ?? "";
  if (!uid) {
    return (
      <div className="space-y-5" dir="rtl">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-slate-100">
          المحفظة
        </h2>
        <SectionCard>
          <EmptyState
            title="لم نعثر على حسابك"
            description="افتح رابط الدخول من منصّة داسم لعرض رصيد محفظتك وحركاتها."
          />
        </SectionCard>
      </div>
    );
  }

  const [balance, ledger] = await Promise.all([
    getInspectionWalletBalance(uid),
    getInspectionLedgerSummary(uid),
  ]);

  return audience === "customer" ? (
    <CustomerWalletView balance={balance} ledger={ledger} />
  ) : (
    <WorkshopWalletView balance={balance} ledger={ledger} />
  );
}

function LedgerList({
  ledger,
  balance,
  labels,
}: {
  ledger: InspectionLedgerSummary | null;
  balance: InspectionWalletBalance | null;
  labels: Record<string, string>;
}) {
  const entries = ledger
    ? Object.entries(ledger.byEntryType).filter(([, v]) => v !== 0)
    : [];

  if (balance === null && ledger === null) {
    return (
      <EmptyState
        title="تعذّر جلب بيانات المحفظة"
        description="قد لا يكون جسر المحفظة الداخلي مُهيّأً بعد. حاول لاحقاً."
      />
    );
  }
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-slate-400">لا حركات بعد.</p>;
  }
  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-slate-800 dark:border-slate-700">
      {entries.map(([type, total]) => (
        <li key={type} className="flex items-center justify-between px-4 py-3 text-sm">
          <span className="text-gray-800 dark:text-slate-200">{labels[type] ?? type}</span>
          <span className={`font-semibold ${total >= 0 ? "text-emerald-700" : "text-red-700"}`}>
            {fmt(total)} ر.س
          </span>
        </li>
      ))}
    </ul>
  );
}

/** عرض العميل: رصيد مسبق الدفع قابل للصرف على الفحوصات + شحن + سجلّ حركات (خصم/شحن). */
function CustomerWalletView({
  balance,
  ledger,
}: {
  balance: InspectionWalletBalance | null;
  ledger: InspectionLedgerSummary | null;
}) {
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-slate-100">
          محفظتي
        </h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          رصيدك المسبق لدفع رسوم الفحص — اشحن مرّة واستخدمه عبر فحوصاتك المتعدّدة.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <StatCard
          value={balance ? `${fmt(balance.balanceSar)} ر.س` : "—"}
          label="الرصيد القابل للصرف"
        />
        <StatCard value={ledger ? ledger.entryCount : "—"} label="عدد الحركات" />
      </section>

      <SectionCard title="شحن الرصيد">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600 dark:text-slate-400">
            اشحن رصيدك لدفع رسوم الفحص بسرعة عند كل طلب.
          </p>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-500 dark:bg-slate-800 dark:text-slate-500"
            title="سيُفعّل شحن الرصيد قريباً"
          >
            شحن الرصيد — قريباً
          </button>
        </div>
      </SectionCard>

      <SectionCard title="حركات المحفظة">
        <LedgerList ledger={ledger} balance={balance} labels={CUSTOMER_ENTRY_LABELS} />
      </SectionCard>

      <p className="text-xs text-gray-400 dark:text-slate-500">
        الرصيد يُخصم عند دفع رسوم الفحص.{" "}
        <Link href="/requests" className="text-[#1E74E8] hover:underline">
          طلبات الفحص
        </Link>
      </p>
    </div>
  );
}

/** عرض الورشة: أرباح الفحص المحصّلة والصرف. */
function WorkshopWalletView({
  balance,
  ledger,
}: {
  balance: InspectionWalletBalance | null;
  ledger: InspectionLedgerSummary | null;
}) {
  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-slate-100">
          المحفظة
        </h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          رصيد محفظة الفحص وحركاتها المالية — من ليدجر داسم.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <StatCard
          value={balance ? `${fmt(balance.balanceSar)} ر.س` : "—"}
          label="الرصيد الحالي"
        />
        <StatCard
          value={ledger ? `${fmt(ledger.inspectionRevenueSar)} ر.س` : "—"}
          label="إيرادات الفحص"
        />
        <StatCard value={ledger ? ledger.entryCount : "—"} label="عدد الحركات" />
      </section>

      <SectionCard title="حركات الليدجر">
        <LedgerList ledger={ledger} balance={balance} labels={WORKSHOP_ENTRY_LABELS} />
      </SectionCard>

      <p className="text-xs text-gray-400 dark:text-slate-500">
        الصرف والسحب يتمّان عبر منصّة داسم.{" "}
        <Link href="/dashboard" className="text-[#1E74E8] hover:underline">
          العودة للوحة
        </Link>
      </p>
    </div>
  );
}
