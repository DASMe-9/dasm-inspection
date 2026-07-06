"use client";

import { useEffect, useState } from "react";

/** مبدّل الوضع الداكن/الفاتح — يحفظ التفضيل في localStorage('dasm-theme'). */
export function ThemeToggle({ className }: { className?: string }) {
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

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="تبديل الوضع الداكن"
      className={
        className ??
        "flex items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
      }
    >
      <span aria-hidden>{ready && dark ? "☀️" : "🌙"}</span>
      {ready && dark ? "الوضع الفاتح" : "الوضع الداكن"}
    </button>
  );
}
