"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CarFront, ClipboardPlus, Loader2 } from "lucide-react";
import { createWalkInInspectionRequestAction } from "@/app/actions/inspection-workflow";
import { SectionCard } from "@/components/shared";
import type { Inspector } from "@/types";

export function WalkInInspectionCard({
  workshopId,
  inspectors,
}: {
  workshopId: string;
  inspectors: Inspector[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const activeInspectors = useMemo(
    () => inspectors.filter((i) => i.active),
    [inspectors],
  );

  return (
    <SectionCard title="فحص زائر الورشة (Walk-in)">
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-400">
          سجّل عميلاً حضر للورشة دون طلب مسبق — يُنشأ طلب فحص مرتبط
          بالورشة والمفتش مباشرةً، ويمكنك لاحقاً إرسال التقرير PDF للعميل بعد
          الاعتماد.
        </p>

        {!open ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#1E74E8_0%,#2FBF4E_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <ClipboardPlus size={16} aria-hidden />
            فتح بطاقة الزائر
          </button>
        ) : (
          <form
            ref={formRef}
            className="grid gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const form = formRef.current;
              if (!form) return;
              setMessage(null);
              const fd = new FormData(form);
              startTransition(async () => {
                const r = await createWalkInInspectionRequestAction(fd);
                if (r.ok) {
                  form.reset();
                  setOpen(false);
                  if (r.requestId) {
                    router.push(`/requests/${r.requestId}`);
                    return;
                  }
                  router.refresh();
                } else {
                  setMessage(r.message);
                }
              });
            }}
          >
            <input type="hidden" name="workshop_id" value={workshopId} />

            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                وصف المركبة *
              </span>
              <input
                name="vehicle_label"
                required
                placeholder="مثال: تويوتا كامري 2020 — أبيض"
                className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                اسم العميل (اختياري)
              </span>
              <input
                name="customer_name"
                className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                جوال العميل (اختياري)
              </span>
              <input
                name="customer_phone"
                dir="ltr"
                placeholder="05xxxxxxxx"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-left dark:border-slate-600 dark:bg-slate-900"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                معرف مستخدم داسم (اختياري)
              </span>
              <input
                name="dasm_user_id"
                dir="ltr"
                placeholder="users.id"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-left font-mono text-sm dark:border-slate-600 dark:bg-slate-900"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                المفتش *
              </span>
              <select
                name="inspector_id"
                required
                defaultValue=""
                className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
              >
                <option value="" disabled>
                  اختر المفتش
                </option>
                {activeInspectors.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.fullName}
                  </option>
                ))}
              </select>
              {activeInspectors.length === 0 ? (
                <p className="mt-1 text-xs text-amber-700">
                  أضف مفتشاً من «إدارة الفريق» أولاً.
                </p>
              ) : null}
            </label>

            <label className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" name="start_now" className="h-4 w-4" defaultChecked />
              <span className="text-sm text-gray-700 dark:text-slate-300">
                بدء الفحص فوراً (الحالة: قيد التنفيذ)
              </span>
            </label>

            <div className="flex flex-wrap gap-2 md:col-span-2">
              <button
                type="submit"
                disabled={pending || activeInspectors.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <CarFront size={16} aria-hidden />
                )}
                {pending ? "جاري التسجيل…" : "تسجيل فحص الزائر"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setMessage(null);
                }}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:border-slate-600 dark:text-slate-300"
              >
                إلغاء
              </button>
            </div>

            {message ? (
              <p className="text-sm text-red-600 md:col-span-2" role="alert">
                {message}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </SectionCard>
  );
}
