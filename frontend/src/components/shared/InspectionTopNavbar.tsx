"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Building2,
  ChevronDown,
  LogOut,
  UserRound,
} from "lucide-react";
import type { InspectionShellContext } from "@/lib/auth/inspection-shell-context";

type Props = Pick<
  InspectionShellContext,
  | "personDisplayName"
  | "coreProfileUrl"
  | "workshopProfileHref"
>;

function initials(name: string): string {
  const t = name.trim();
  if (!t) return "م";
  return t.charAt(0).toUpperCase();
}

export function InspectionTopNavbar({
  personDisplayName,
  coreProfileUrl,
  workshopProfileHref,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className="sticky top-0 z-30 -mx-4 mb-5 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md dark:border-slate-700/80 dark:bg-[#0a1626]/90 md:-mx-6 md:px-6 lg:rounded-2xl lg:border lg:shadow-sm"
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 lg:hidden">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
            فحص داسم
          </p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            لوحة الفحص الفني
          </p>
        </div>

        <div className="relative ms-auto" ref={rootRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex max-w-[min(100vw-2rem,20rem)] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1E74E8_0%,#2FBF4E_100%)] text-xs font-bold text-white">
              {initials(personDisplayName)}
            </span>
            <span className="truncate">{personDisplayName}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          {open ? (
            <div
              role="menu"
              className="absolute left-0 top-[calc(100%+0.35rem)] z-50 min-w-[14rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-900"
            >
              <p className="border-b border-slate-100 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {personDisplayName}
              </p>
              {workshopProfileHref ? (
                <Link
                  href={workshopProfileHref}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Building2 className="h-4 w-4 text-[#1E74E8]" aria-hidden />
                  ملف الورشة
                </Link>
              ) : null}
              <a
                href={coreProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <UserRound className="h-4 w-4 text-slate-500" aria-hidden />
                ملفي على داسم
              </a>
              <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
              <a
                href="/api/auth/logout"
                role="menuitem"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                تسجيل الخروج
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
