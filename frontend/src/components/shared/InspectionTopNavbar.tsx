"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Building2,
  ChevronDown,
  ExternalLink,
  Hash,
  LogOut,
  Mail,
  MapPin,
  Settings,
  UserRound,
} from "lucide-react";
import type { InspectionShellContext } from "@/lib/auth/inspection-shell-context";

type Props = Pick<
  InspectionShellContext,
  | "personDisplayName"
  | "coreProfileUrl"
  | "workshopProfileHref"
  | "workshopPublicHref"
  | "workshopWelcome"
  | "email"
  | "userCode"
  | "areaLabel"
  | "city"
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
  workshopPublicHref,
  workshopWelcome,
  email,
  userCode,
  areaLabel,
  city,
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

  const locationLabel = [areaLabel, city].filter(Boolean).join(" · ");
  const identityTitle = workshopWelcome
    ? workshopWelcome.workshopName
    : personDisplayName;
  const identitySubtitle = workshopWelcome ? personDisplayName : null;

  return (
    <header
      className="sticky top-0 z-30 -mx-4 mb-5 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md dark:border-slate-700/80 dark:bg-[#0a1626]/90 md:-mx-6 md:px-6 lg:rounded-2xl lg:border lg:shadow-sm"
      dir="rtl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        {workshopWelcome ? (
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-sky-600 dark:text-sky-300">
              أهلاً ورشة
            </p>
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white md:text-base">
              {workshopWelcome.workshopName}
            </p>
            <ul className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
              {email ? (
                <li className="inline-flex max-w-full items-center gap-1 truncate">
                  <Mail className="h-3 w-3 shrink-0" aria-hidden />
                  <span dir="ltr" className="truncate">
                    {email}
                  </span>
                </li>
              ) : null}
              {userCode ? (
                <li className="inline-flex items-center gap-1">
                  <Hash className="h-3 w-3 shrink-0" aria-hidden />
                  <span dir="ltr">{userCode}</span>
                </li>
              ) : null}
              {locationLabel ? (
                <li className="inline-flex max-w-full items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                  <span className="truncate">{locationLabel}</span>
                </li>
              ) : null}
            </ul>
          </div>
        ) : (
          <div className="min-w-0 lg:hidden">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
              فحص داسم
            </p>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              لوحة الفحص الفني
            </p>
          </div>
        )}

        <div className="relative ms-auto shrink-0" ref={rootRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex max-w-[min(100vw-2rem,20rem)] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label={identityTitle}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1E74E8_0%,#2FBF4E_100%)] text-xs font-bold text-white">
              {initials(identityTitle)}
            </span>
            <span className="min-w-0 text-start">
              <span className="block truncate">{identityTitle}</span>
              {identitySubtitle ? (
                <span className="block truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {identitySubtitle}
                </span>
              ) : null}
            </span>
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
                {workshopWelcome ? (
                  <>
                    <br />
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {workshopWelcome.workshopName}
                    </span>
                  </>
                ) : null}
              </p>
              {workshopProfileHref ? (
                <Link
                  href={workshopProfileHref}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Settings className="h-4 w-4 text-[#1E74E8]" aria-hidden />
                  إعدادات الورشة
                </Link>
              ) : null}
              {workshopPublicHref ? (
                <Link
                  href={workshopPublicHref}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Building2 className="h-4 w-4 text-slate-500" aria-hidden />
                  الصفحة العامة
                  <ExternalLink className="ms-auto h-3.5 w-3.5 text-slate-400" aria-hidden />
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
