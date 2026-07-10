"use client";

import { useState, useTransition } from "react";
import { createWorkshopInviteAction } from "@/app/actions/workshop-invites";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1E74E8] focus:outline-none focus:ring-2 focus:ring-[#1E74E8]/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";

export function WorkshopInviteCreateForm() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [applyUrl, setApplyUrl] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setApplyUrl(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const r = await createWorkshopInviteAction(fd);
      if (!r.ok) {
        setMsg(r.message);
        return;
      }
      setApplyUrl(r.applyUrl);
      setMsg("تم إنشاء رابط الدعوة — انسخه وأرسله للورشة.");
      form.reset();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-sm">
      <label className="block">
        <span className="text-slate-600 dark:text-slate-400">اسم الورشة *</span>
        <input name="workshop_name" required className={inputClass} />
      </label>
      <label className="block">
        <span className="text-slate-600 dark:text-slate-400">المدينة *</span>
        <input name="city" required className={inputClass} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-slate-600 dark:text-slate-400">المسؤول</span>
          <input name="contact_name" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-slate-600 dark:text-slate-400">الجوال</span>
          <input name="phone" type="tel" dir="ltr" className={inputClass} />
        </label>
      </div>
      <label className="block">
        <span className="text-slate-600 dark:text-slate-400">البريد</span>
        <input name="email" type="email" dir="ltr" className={inputClass} />
      </label>
      <label className="block">
        <span className="text-slate-600 dark:text-slate-400">
          معرّف مالك داسم (اختياري — يُربط تلقائياً عند التقديم)
        </span>
        <input name="dasm_user_id" dir="ltr" className={inputClass} placeholder="322" />
      </label>
      <label className="block">
        <span className="text-slate-600 dark:text-slate-400">صلاحية الرابط (أيام)</span>
        <input
          name="expires_days"
          type="number"
          min={1}
          max={90}
          defaultValue={14}
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#1E74E8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1862c4] disabled:opacity-50"
      >
        {pending ? "جاري الإنشاء…" : "إنشاء رابط دعوة"}
      </button>
      {applyUrl ? (
        <p className="break-all rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          <span className="font-semibold">الرابط:</span>{" "}
          <code dir="ltr">{applyUrl}</code>
        </p>
      ) : null}
      {msg ? (
        <p className="text-xs text-slate-600 dark:text-slate-400" role="status">
          {msg}
        </p>
      ) : null}
    </form>
  );
}
