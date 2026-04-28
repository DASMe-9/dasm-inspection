"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Receipt,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  enrollSubscription,
  fetchSubscriptionStatus,
  fetchSubscriptionHistory,
  createSubscriptionCheckout,
  type ServiceSubscription,
  type SubPaymentRecord,
} from "@/lib/subscription";

const TIERS = [
  { tier: 1, label: "الشريحة الأولى",  range: "0 – 1,000 ر.س",    fee: 100  },
  { tier: 2, label: "الشريحة الثانية", range: "1,001 – 3,000 ر.س",  fee: 200  },
  { tier: 3, label: "الشريحة الثالثة", range: "3,001 – 6,000 ر.س",  fee: 500  },
  { tier: 4, label: "الشريحة الرابعة", range: "6,001+ ر.س",          fee: 1000 },
];

function statusBadge(status: ServiceSubscription["status"]) {
  const map: Record<string, { text: string; cls: string }> = {
    trial:     { text: "تجربة مجانية",  cls: "bg-blue-100 text-blue-800" },
    active:    { text: "نشط",           cls: "bg-green-100 text-green-800" },
    past_due:  { text: "مستحق الدفع",   cls: "bg-orange-100 text-orange-800" },
    cancelled: { text: "ملغي",          cls: "bg-gray-100 text-gray-600" },
    suspended: { text: "موقوف",         cls: "bg-red-100 text-red-700" },
  };
  const { text, cls } = map[status] ?? { text: status, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {text}
    </span>
  );
}

declare global {
  interface Window {
    Paymob?: (
      publicKey: string,
      options: {
        clientSecret: string;
        onSuccess: (data: unknown) => void;
        onError: (err: unknown) => void;
        onPending: (data: unknown) => void;
      }
    ) => void;
  }
}

export default function SubscriptionPage() {
  const [sub, setSub]         = useState<ServiceSubscription | null>(null);
  const [history, setHistory] = useState<SubPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying]   = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [notEnrolled, setNotEnrolled] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, h] = await Promise.all([
        fetchSubscriptionStatus(),
        fetchSubscriptionHistory(),
      ]);
      setSub(s);
      setHistory(h);
      setNotEnrolled(!s);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const s = await enrollSubscription();
      setSub(s);
      setNotEnrolled(false);
    } catch {
      alert("تعذّر التسجيل، حاول مرة أخرى.");
    } finally {
      setEnrolling(false);
    }
  };

  const handleCheckout = async () => {
    if (!sub || paying) return;
    setPaying(true);
    try {
      const result = await createSubscriptionCheckout();
      if (!result.client_secret) { load(); return; }

      const script = document.createElement("script");
      script.src = "https://ksa.paymob.com/unifiedcheckout/static/js/main.js";
      script.onload = () => {
        window.Paymob?.(result.public_key, {
          clientSecret: result.client_secret!,
          onSuccess: () => { load(); setPaying(false); },
          onError:   () => { alert("فشل الدفع."); setPaying(false); },
          onPending: () => { setPaying(false); },
        });
      };
      document.head.appendChild(script);
    } catch {
      alert("تعذّر إنشاء جلسة الدفع.");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (notEnrolled) {
    return (
      <div className="space-y-6 max-w-2xl" dir="rtl">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          اشتراك داسم فحص
        </h2>

        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-indigo-50 flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">ابدأ تجربتك المجانية</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            شهران مجانيان، ثم رسوم شهرية متدرّجة بناءً على دخلك. لا يُطلب الدفع الآن.
          </p>
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {enrolling
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <CheckCircle2 className="w-4 h-4" />}
            سجّل الآن — شهران مجاناً
          </button>
        </div>

        <TierTable />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          اشتراك داسم فحص
        </h2>
        <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Status card */}
      {sub && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="font-semibold text-gray-800">حالة الاشتراك</span>
            {statusBadge(sub.status)}
          </div>
          <div className="p-5 space-y-4">
            {sub.is_on_trial && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50">
                <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">أنت في فترة التجربة المجانية</p>
                  <p className="text-xs text-blue-600">
                    تنتهي في {sub.trial_ends_at?.slice(0, 10)} — {sub.trial_days_left} يوم متبقٍ
                  </p>
                </div>
              </div>
            )}

            {sub.status === "past_due" && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50">
                <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800">الاشتراك مستحق الدفع</p>
                  <p className="text-xs text-orange-600">
                    المبلغ المستحق: <strong>{sub.effective_fee_sar} ر.س</strong>
                  </p>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={paying}
                  className="px-4 py-1.5 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {paying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  ادفع الآن
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <TrendingUp className="w-5 h-5 mx-auto text-indigo-600 mb-1" />
                <p className="text-lg font-bold text-gray-900">{sub.tier === 0 ? "—" : sub.tier}</p>
                <p className="text-xs text-gray-500">الشريحة</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <CreditCard className="w-5 h-5 mx-auto text-indigo-600 mb-1" />
                <p className="text-lg font-bold text-gray-900">
                  {sub.is_on_trial ? "0" : sub.effective_fee_sar}
                  <span className="text-xs font-normal"> ر.س</span>
                </p>
                <p className="text-xs text-gray-500">رسوم الشهر</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-gray-50">
                <Receipt className="w-5 h-5 mx-auto text-indigo-600 mb-1" />
                <p className="text-lg font-bold text-gray-900">
                  {sub.prev_month_income_sar.toLocaleString()}
                  <span className="text-xs font-normal"> ر.س</span>
                </p>
                <p className="text-xs text-gray-500">دخل الشهر الماضي</p>
              </div>
            </div>

            {sub.period_start && (
              <p className="text-xs text-gray-400 text-center">
                الفترة الحالية: {sub.period_start} ← {sub.period_end}
              </p>
            )}
          </div>
        </div>
      )}

      <TierTable currentTier={sub?.tier} />

      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              سجل الدفعات
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {history.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.payment_ref}</p>
                  <p className="text-xs text-gray-400">
                    {p.paid_at?.slice(0, 10) ?? p.created_at.slice(0, 10)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    p.status === "paid"
                      ? "bg-green-100 text-green-700"
                      : p.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {p.status === "paid" ? "مدفوع" : p.status === "pending" ? "معلّق" : "فشل"}
                  </span>
                  <p className="text-sm font-bold text-gray-900">
                    {parseFloat(p.amount).toLocaleString()} ر.س
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TierTable({ currentTier }: { currentTier?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          جدول الشرائح الشهرية
        </h3>
      </div>
      <div className="divide-y divide-gray-100">
        {TIERS.map((t) => (
          <div
            key={t.tier}
            className={`flex items-center justify-between px-5 py-3 ${
              currentTier === t.tier ? "bg-indigo-50" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              {currentTier === t.tier && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block" />
              )}
              <span className={`text-sm ${currentTier === t.tier ? "font-semibold text-indigo-700" : "text-gray-700"}`}>
                {t.label}
              </span>
              <span className="text-xs text-gray-400 hidden sm:inline">({t.range})</span>
            </div>
            <span className={`text-sm ${currentTier === t.tier ? "font-semibold text-indigo-700" : "text-gray-600"}`}>
              {t.fee} ر.س / شهر
            </span>
          </div>
        ))}
      </div>
      <div className="px-5 py-3 bg-gray-50">
        <p className="text-xs text-gray-400">
          تُحسَب الشريحة في اليوم الأول من كل شهر بناءً على دخل الشهر الماضي.
        </p>
      </div>
    </div>
  );
}
