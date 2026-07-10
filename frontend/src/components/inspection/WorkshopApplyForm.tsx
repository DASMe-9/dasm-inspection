"use client";

import { useState, useTransition } from "react";
import { submitWorkshopApplicationAction } from "@/app/actions/workshop-application";
import { useTheme } from "@/hooks";
import type { WorkshopInvitePrefill } from "@/lib/data/workshop-invites-data";

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1E74E8] focus:outline-none focus:ring-2 focus:ring-[#1E74E8]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500";

export function WorkshopApplyForm({
  dasmUserId,
  invite,
}: {
  dasmUserId?: string | null;
  invite?: WorkshopInvitePrefill | null;
}) {
  const { colors } = useTheme({ role: "workshop" });
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const r = await submitWorkshopApplicationAction(fd);
      if (!r.ok) {
        setMsg(r.message);
        return;
      }
      setDoneId(r.applicationId);
      form.reset();
      setMsg("تم استلام طلبكم. سنتواصل بعد المراجعة.");
    });
  }

  if (doneId) {
    return (
      <div className="space-y-3 text-sm">
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          {msg}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">رقم الطلب: {doneId}</p>
        <button
          type="button"
          className="text-sm text-[#1E74E8] underline hover:no-underline"
          onClick={() => {
            setDoneId(null);
            setMsg(null);
          }}
        >
          تقديم طلب آخر
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-sm">
      {invite ? <input type="hidden" name="invite_token" value={invite.token} /> : null}
      {dasmUserId ? (
        <input type="hidden" name="dasm_user_id" value={dasmUserId} />
      ) : null}
      {invite ? (
        <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200">
          دعوة انضمام مفعّلة — بيانات الورشة مُعبّأة مسبقاً.{" "}
          {!dasmUserId ? (
            <span className="font-semibold">
              سجّل الدخول بحساب داسم لربط الورشة تلقائياً بعد الاعتماد.
            </span>
          ) : null}
        </p>
      ) : null}
      <label className="block">
        <span className="text-slate-600 dark:text-slate-400">اسم الورشة *</span>
        <input
          name="workshop_name"
          required
          defaultValue={invite?.workshopName}
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className="text-slate-600 dark:text-slate-400">المدينة *</span>
        <input name="city" required defaultValue={invite?.city} className={fieldClass} />
      </label>
      <label className="block">
        <span className="text-slate-600 dark:text-slate-400">اسم المسؤول *</span>
        <input
          name="contact_name"
          required
          defaultValue={invite?.contactName ?? undefined}
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className="text-slate-600 dark:text-slate-400">الجوال *</span>
        <input
          name="phone"
          type="tel"
          required
          dir="ltr"
          defaultValue={invite?.phone ?? undefined}
          className={`${fieldClass} text-left`}
          placeholder="05xxxxxxxx"
        />
      </label>
      <label className="block">
        <span className="text-slate-600 dark:text-slate-400">البريد الإلكتروني</span>
        <input
          name="email"
          type="email"
          dir="ltr"
          defaultValue={invite?.email ?? undefined}
          className={`${fieldClass} text-left`}
        />
      </label>
      <label className="block">
        <span className="text-slate-600 dark:text-slate-400">السجل التجاري (اختياري)</span>
        <input name="commercial_registration" className={fieldClass} />
      </label>
      <label className="block">
        <span className="text-slate-600 dark:text-slate-400">ملاحظات</span>
        <textarea
          name="notes"
          className={`${fieldClass} min-h-[88px]`}
          placeholder="معدات، عدد المفتشين، مناطق الخدمة…"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg py-2.5 font-medium text-white shadow-sm transition disabled:opacity-50"
        style={{ backgroundColor: colors.primary }}
      >
        {pending ? "جاري الإرسال…" : "إرسال طلب الانضمام"}
      </button>
      {msg && !doneId ? (
        <p className="text-xs text-red-700 dark:text-red-400" role="alert">
          {msg}
        </p>
      ) : null}
    </form>
  );
}
