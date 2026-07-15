"use client";

import { useState, useTransition } from "react";
import { submitWorkshopApplicationAction } from "@/app/actions/workshop-application";
import { PUBLIC_BRAND } from "@/components/public-site/brand-tokens";
import type { WorkshopInvitePrefill } from "@/lib/data/workshop-invites-data";

const labelClass =
  "text-sm font-medium text-slate-800 dark:text-slate-100";

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 shadow-sm transition focus:border-[var(--inspection-accent)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--inspection-accent)]/25 dark:border-slate-500 dark:bg-slate-800/90 dark:text-slate-50 dark:placeholder:text-slate-400 dark:focus:border-[var(--inspection-accent)] dark:focus:bg-slate-800 dark:focus:ring-[var(--inspection-accent)]/30";

export function WorkshopApplyForm({
  dasmUserId,
  invite,
}: {
  dasmUserId?: string | null;
  invite?: WorkshopInvitePrefill | null;
}) {
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
        <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 font-medium text-emerald-950 dark:border-emerald-400/35 dark:bg-emerald-950/55 dark:text-emerald-50">
          {msg}
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-300">رقم الطلب: {doneId}</p>
        <button
          type="button"
          className="text-sm font-semibold underline underline-offset-2 hover:no-underline"
          style={{ color: PUBLIC_BRAND.blue }}
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
        <p className="rounded-xl border border-sky-300 bg-sky-50 px-3.5 py-2.5 text-xs font-medium leading-relaxed text-sky-950 dark:border-sky-400/35 dark:bg-sky-950/55 dark:text-sky-50">
          دعوة انضمام مفعّلة — بيانات الورشة مُعبّأة مسبقاً.{" "}
          {!dasmUserId ? (
            <span className="font-bold">
              سجّل الدخول بحساب داسم لربط الورشة تلقائياً بعد الاعتماد.
            </span>
          ) : null}
        </p>
      ) : null}
      <label className="block">
        <span className={labelClass}>اسم الورشة *</span>
        <input
          name="workshop_name"
          required
          defaultValue={invite?.workshopName}
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className={labelClass}>المدينة *</span>
        <input name="city" required defaultValue={invite?.city} className={fieldClass} />
      </label>
      <label className="block">
        <span className={labelClass}>اسم المسؤول *</span>
        <input
          name="contact_name"
          required
          defaultValue={invite?.contactName ?? undefined}
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className={labelClass}>الجوال *</span>
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
        <span className={labelClass}>البريد الإلكتروني</span>
        <input
          name="email"
          type="email"
          dir="ltr"
          defaultValue={invite?.email ?? undefined}
          className={`${fieldClass} text-left`}
        />
      </label>
      <label className="block">
        <span className={labelClass}>السجل التجاري (اختياري)</span>
        <input name="commercial_registration" className={fieldClass} />
      </label>
      <label className="block">
        <span className={labelClass}>ملاحظات</span>
        <textarea
          name="notes"
          className={`${fieldClass} min-h-[96px]`}
          placeholder="معدات، عدد المفتشين، مناطق الخدمة…"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl py-3 text-sm font-bold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: PUBLIC_BRAND.green }}
      >
        {pending ? "جاري الإرسال…" : "إرسال طلب الانضمام"}
      </button>
      {msg && !doneId ? (
        <p className="text-xs font-medium text-red-700 dark:text-red-300" role="alert">
          {msg}
        </p>
      ) : null}
    </form>
  );
}
