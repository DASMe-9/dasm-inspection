"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type ThemeToggleProps = {
  className?: string;
  /** أيقونة فقط — مناسب لشريط الموقع العام */
  compact?: boolean;
};

/** مبدّل الوضع الداكن/الفاتح — يحفظ التفضيل في localStorage('dasm-theme'). */
export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    setReady(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("dasm-theme", next ? "dark" : "light");
    } catch {
      /* تجاهل تعذّر التخزين */
    }
  }

  const label = ready && dark ? "الوضع الفاتح" : "الوضع الداكن";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="تبديل الوضع الداكن"
      title={label}
      className={
        className ??
        (compact
          ? "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/25 text-white/90 transition hover:bg-white/10"
          : "flex items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10")
      }
    >
      {ready && dark ? (
        <Sun className="h-4 w-4" aria-hidden />
      ) : (
        <Moon className="h-4 w-4" aria-hidden />
      )}
      {!compact ? <span>{label}</span> : null}
    </button>
  );
}
