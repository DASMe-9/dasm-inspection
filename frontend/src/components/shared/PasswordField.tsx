"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

/**
 * حقل كلمة مرور مع العين الكاشفة — عادة واجهة داسم في كل حقول الباسوورد.
 */
export function PasswordField({
  label,
  className,
  id,
  name,
  ...rest
}: Props) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? name ?? undefined;

  return (
    <label className="block">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <div className="relative mt-1">
        <input
          {...rest}
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          dir="ltr"
          className={[
            "w-full rounded-xl border border-slate-200 py-2 pe-11 ps-3 text-left dark:border-slate-600 dark:bg-slate-800",
            className ?? "",
          ]
            .join(" ")
            .trim()}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 end-0 flex items-center px-3 text-slate-500 transition hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
          aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
          aria-pressed={visible}
          tabIndex={0}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden />
          ) : (
            <Eye className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    </label>
  );
}
