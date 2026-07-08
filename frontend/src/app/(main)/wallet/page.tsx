import Link from "next/link";
import { EmptyState, SectionCard, StatCard } from "@/components/shared";
import { resolveDasmUserId } from "@/lib/auth/resolve-dasm-user-id.server";
import { resolveIsWorkshopFinancialViewer } from "@/lib/auth/require-workshop-persona.server";
import {
  getInspectionLedgerSummary,
  getInspectionWalletBalance,
} from "@/lib/core/fetch-inspection-wallet";

export const dynamic = "force-dynamic";

const ENTRY_TYPE_LABELS: Record<string, string> = {
  admin_fee_collected: "رسوم فحص محصّلة",
  wallet_topup: "شحن رصيد",
  wallet_withdrawal: "سحب",
  payout: "صرف",
};

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function WalletPage() {
  // المحفظة = أرباح/صرف الورشة لمالك/مدير الورشة والأدمن فقط. العميل يدفع رسوم
  // الفحص مباشرةً عبر PayMob ولا يملك رصيد محفظة.
  const allowed = await resolveIsWorkshopFinancialViewer();
  if (!allowed) {
    return (
      <div className="space-y-5" dir="rtl">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-slate-100">
          المحفظة
        </h2>
        <SectionCard>
          <EmptyState
            title="صفحة مخصّصة للورش"
            description="المحفظة والأرباح والصرف متاحة لأصحاب ومديري الورش المعتمدة فقط."
          />
        </SectionCard>
      </div>
    );
  }

  const uid = (await resolveDasmUserId()) ?? "";

  if (!uid) {
    return (
      <div className="space-y-5" dir="rtl">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">المحفظة</h2>
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

  const entries = ledger
    ? Object.entries(ledger.byEntryType).filter(([, v]) => v !== 0)
    : [];

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">المحفظة</h2>
        <p className="text-sm text-gray-500 mt-1">
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
        {balance === null && ledger === null ? (
          <EmptyState
            title="تعذّر جلب بيانات المحفظة"
            description="قد لا يكون جسر المحفظة الداخلي مُهيّأً بعد. حاول لاحقاً."
          />
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-500">لا حركات مالية بعد.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
            {entries.map(([type, total]) => (
              <li
                key={type}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="text-gray-800">
                  {ENTRY_TYPE_LABELS[type] ?? type}
                </span>
                <span
                  className={`font-semibold ${
                    total >= 0 ? "text-emerald-700" : "text-red-700"
                  }`}
                >
                  {fmt(total)} ر.س
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <p className="text-xs text-gray-400">
        الصرف والسحب يتمّان عبر منصّة داسم.{" "}
        <Link href="/dashboard" className="text-[#1E74E8] hover:underline">
          العودة للوحة
        </Link>
      </p>
    </div>
  );
}
