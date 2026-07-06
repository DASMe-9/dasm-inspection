"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  canPayInspectionFee,
  createInspectionFeeCheckout,
  openPaymobCheckout,
  type InspectionFeePaymentStatus,
} from "@/lib/inspection-fee-payment";
import { formatInspectionPriceSar } from "@/lib/inspection-pricing";

export function InspectionFeePayPanel({
  requestId,
  quotedFeeSar,
  paymentStatus,
}: {
  requestId: string;
  quotedFeeSar?: number | null;
  paymentStatus?: InspectionFeePaymentStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const status = paymentStatus ?? "unpaid";

  if (!canPayInspectionFee(quotedFeeSar, status)) {
    if (status === "paid") {
      return (
        <p className="text-sm text-green-800 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
          تم دفع رسوم خدمة الفحص.
        </p>
      );
    }
    if (status === "waived") {
      return null;
    }
    return null;
  }

  function pay() {
    setMsg(null);
    const amount = Number(quotedFeeSar);
    startTransition(async () => {
      try {
        const checkout = await createInspectionFeeCheckout(requestId, amount);
        openPaymobCheckout(checkout, {
          onSuccess: () => {
            setMsg("تم الدفع — جاري تحديث الحالة…");
            router.refresh();
          },
          onError: () => setMsg("فشل الدفع أو أُلغي."),
          onPending: () => setMsg("الدفع قيد المعالجة…"),
        });
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "تعذّر بدء الدفع.");
      }
    });
  }

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-4 space-y-3" dir="rtl">
      <p className="text-sm font-medium text-indigo-950">دفع رسوم خدمة الفحص (اختياري)</p>
      <p className="text-xs text-indigo-900/80">
        المبلغ المرجعي عند الإسناد:{" "}
        <span className="font-semibold">
          {formatInspectionPriceSar(Number(quotedFeeSar))}
        </span>
        . عرض الإصلاح (إن وُجد) منفصل ولا يُدفع من هنا.
      </p>
      {status === "pending" && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
          لديك جلسة دفع معلّقة — يمكنك إعادة المحاولة.
        </p>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={pay}
        className="w-full py-2.5 rounded-lg bg-[#1E74E8] text-white text-sm font-medium hover:bg-[#1857b8] disabled:opacity-50"
      >
        {pending ? "جاري التحضير…" : "ادفع عبر Paymob"}
      </button>
      {msg && (
        <p className="text-xs text-gray-600" role="status">
          {msg}
        </p>
      )}
    </div>
  );
}
