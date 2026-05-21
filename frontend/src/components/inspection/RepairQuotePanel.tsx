"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setRepairQuoteAction } from "@/app/actions/inspection-workflow";
import { canEditRepairQuote } from "@/lib/repair-quote";
import { formatInspectionPriceSar } from "@/lib/inspection-pricing";
import type { InspectionRequest } from "@/types";
import { useTheme } from "@/hooks";

export function RepairQuotePanel({ request }: { request: InspectionRequest }) {
  const { colors } = useTheme({ role: "workshop" });
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [amount, setAmount] = useState(
    request.repairQuoteSar != null ? String(request.repairQuoteSar) : ""
  );
  const [notes, setNotes] = useState(request.repairQuoteNotes ?? "");

  if (!canEditRepairQuote(request.status)) {
    return null;
  }

  function run(fn: () => Promise<{ ok: boolean; message?: string }>) {
    setMsg(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok && "message" in r && r.message) setMsg(r.message);
      else if (r.ok) {
        setMsg("تم حفظ عرض الإصلاح.");
        router.refresh();
      }
    });
  }

  return (
    <div
      className="rounded-lg border p-4 space-y-3 bg-amber-50/50 border-amber-200"
      dir="rtl"
    >
      <div>
        <p className="font-medium text-sm text-amber-950">عرض إصلاح (اختياري)</p>
        <p className="text-xs text-amber-900/80 mt-1">
          منفصل عن رسوم خدمة الفحص
          {request.quotedFeeSar != null && (
            <>
              {" "}
              ({formatInspectionPriceSar(request.quotedFeeSar)})
            </>
          )}
          . يُعرض للعميل عند التتبع بعد التسجيل.
        </p>
      </div>

      {request.repairQuoteSar != null && (
        <p className="text-xs text-amber-900 rounded-lg bg-white/80 px-2 py-1.5 border border-amber-100">
          الحالي: {formatInspectionPriceSar(request.repairQuoteSar)}
          {request.repairQuoteNotes && (
            <span className="block mt-1 text-gray-700">
              {request.repairQuoteNotes}
            </span>
          )}
        </p>
      )}

      <label className="block text-sm">
        <span className="text-gray-600">المبلغ (ر.س)</span>
        <input
          type="number"
          min={0}
          step="0.01"
          className="mt-1 w-full border rounded-lg px-3 py-2"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="مثال: 2500"
        />
      </label>

      <label className="block text-sm">
        <span className="text-gray-600">ملاحظات العرض</span>
        <textarea
          className="mt-1 w-full border rounded-lg px-3 py-2 min-h-[72px] text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="وصف مختصر لبنود الإصلاح المقترحة"
        />
      </label>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={pending || !amount.trim()}
          className="flex-1 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: colors.primary }}
          onClick={() =>
            run(() =>
              setRepairQuoteAction(
                request.id,
                Number(amount),
                notes.trim() || null
              )
            )
          }
        >
          حفظ عرض الإصلاح
        </button>
        {request.repairQuoteSar != null && (
          <button
            type="button"
            disabled={pending}
            className="py-2 px-3 rounded-lg text-sm border border-amber-300 text-amber-950 bg-white disabled:opacity-50"
            onClick={() => {
              if (!window.confirm("إزالة عرض الإصلاح من هذا الطلب؟")) return;
              run(() => setRepairQuoteAction(request.id, null, null));
            }}
          >
            إزالة العرض
          </button>
        )}
      </div>

      {msg && (
        <p className="text-xs text-gray-600" role="status">
          {msg}
        </p>
      )}
    </div>
  );
}
