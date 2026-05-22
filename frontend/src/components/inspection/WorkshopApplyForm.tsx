"use client";

import { useState, useTransition } from "react";
import { submitWorkshopApplicationAction } from "@/app/actions/workshop-application";
import { useTheme } from "@/hooks";

export function WorkshopApplyForm() {
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
        <p className="text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {msg}
        </p>
        <p className="text-gray-500 text-xs">رقم الطلب: {doneId}</p>
        <button
          type="button"
          className="text-sm underline text-gray-600"
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
      <label className="block">
        <span className="text-gray-600">اسم الورشة *</span>
        <input
          name="workshop_name"
          required
          className="mt-1 w-full border rounded-lg px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-gray-600">المدينة *</span>
        <input
          name="city"
          required
          className="mt-1 w-full border rounded-lg px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-gray-600">اسم المسؤول *</span>
        <input
          name="contact_name"
          required
          className="mt-1 w-full border rounded-lg px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-gray-600">الجوال *</span>
        <input
          name="phone"
          type="tel"
          required
          dir="ltr"
          className="mt-1 w-full border rounded-lg px-3 py-2 text-left"
          placeholder="05xxxxxxxx"
        />
      </label>
      <label className="block">
        <span className="text-gray-600">البريد الإلكتروني</span>
        <input
          name="email"
          type="email"
          dir="ltr"
          className="mt-1 w-full border rounded-lg px-3 py-2 text-left"
        />
      </label>
      <label className="block">
        <span className="text-gray-600">السجل التجاري (اختياري)</span>
        <input
          name="commercial_registration"
          className="mt-1 w-full border rounded-lg px-3 py-2"
        />
      </label>
      <label className="block">
        <span className="text-gray-600">ملاحظات</span>
        <textarea
          name="notes"
          className="mt-1 w-full border rounded-lg px-3 py-2 min-h-[88px]"
          placeholder="معدات، عدد المفتشين، مناطق الخدمة…"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 rounded-lg text-white font-medium disabled:opacity-50"
        style={{ backgroundColor: colors.primary }}
      >
        {pending ? "جاري الإرسال…" : "إرسال طلب الانضمام"}
      </button>
      {msg && !doneId && (
        <p className="text-xs text-red-700" role="alert">
          {msg}
        </p>
      )}
    </form>
  );
}
