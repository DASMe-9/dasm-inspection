"use client";

import { useState, useTransition } from "react";
import { KeyRound, Mail } from "lucide-react";
import {
  changeWorkshopAccountPasswordAction,
  requestWorkshopPasswordResetAction,
} from "@/app/actions/workshop-password";
import { PasswordField } from "@/components/shared/PasswordField";

export function WorkshopPasswordChangeForm() {
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();
  const [resetPending, startReset] = useTransition();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          الأمان وكلمة المرور
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          غيّر كلمة مرور حسابك من هنا مباشرة. الحساب موحّد مع منظومة داسم، والتحديث
          يمر عبر خدمة الهوية المركزية دون الحاجة لدخول لوحة المسؤول في المنصة الأم.
          استخدم العين بجانب الحقل للتأكد من الكتابة (عربي/إنجليزي).
        </p>
      </div>

      <form
        className="grid max-w-lg gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setMsg(null);
          setOk(false);
          startTransition(async () => {
            const r = await changeWorkshopAccountPasswordAction(fd);
            setOk(r.ok);
            setMsg(r.message);
            if (r.ok) e.currentTarget.reset();
          });
        }}
      >
        <PasswordField
          label="كلمة المرور الحالية"
          name="current_password"
          required
          autoComplete="current-password"
        />
        <PasswordField
          label="كلمة المرور الجديدة"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E74E8] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          <KeyRound className="h-4 w-4" aria-hidden />
          {pending ? "جاري التحديث…" : "تحديث كلمة المرور"}
        </button>
      </form>

      <div className="max-w-lg rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-800/50">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          نسيت كلمة المرور الحالية؟ أرسل رابط الاستعادة إلى بريد حسابك المسجّل.
        </p>
        <button
          type="button"
          disabled={resetPending}
          onClick={() => {
            setMsg(null);
            setOk(false);
            startReset(async () => {
              const r = await requestWorkshopPasswordResetAction();
              setOk(r.ok);
              setMsg(r.message);
            });
          }}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-500 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <Mail className="h-4 w-4" aria-hidden />
          {resetPending ? "جاري الإرسال…" : "إرسال رابط استعادة كلمة المرور"}
        </button>
      </div>

      {msg ? (
        <p
          className={`text-sm ${ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
          role="status"
        >
          {msg}
        </p>
      ) : null}
    </div>
  );
}
