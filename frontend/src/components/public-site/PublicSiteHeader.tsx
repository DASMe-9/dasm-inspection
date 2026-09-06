"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogIn, Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { InspectionLogo } from "./InspectionLogo";
import { PUBLIC_BRAND, PUBLIC_NAV_LINKS } from "./brand-tokens";

function isNavActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  if (href.startsWith("/#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicSiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl"
      style={{ background: PUBLIC_BRAND.navyGlass }}
    >
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:gap-3 md:min-h-20 md:px-6">
        <Link
          href="/"
          className="inline-flex min-h-11 min-w-0 shrink items-center"
          aria-label="فحص داسم — الصفحة الرئيسية"
          onClick={() => setOpen(false)}
        >
          <InspectionLogo compact />
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="التنقّل الرئيسي"
        >
          {PUBLIC_NAV_LINKS.map((item) => {
            const active = isNavActive(pathname, item.href, item.exact);
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "text-[var(--inspection-accent)] underline decoration-2 underline-offset-8"
                    : "text-white/90 hover:text-white"
                }`}
                style={
                  active
                    ? ({
                        color: PUBLIC_BRAND.green,
                        textDecorationColor: PUBLIC_BRAND.green,
                      } as React.CSSProperties)
                    : undefined
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <span className="hidden sm:inline-flex">
            <ThemeToggle compact />
          </span>
          <Link
            href="/auth/login"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-white shadow-md transition hover:brightness-105 sm:px-4"
            style={{ background: PUBLIC_BRAND.green }}
          >
            <LogIn className="h-4 w-4" aria-hidden />
            <span className="sm:hidden">دخول</span>
            <span className="hidden sm:inline">تسجيل الدخول</span>
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 text-white transition hover:bg-white/10 lg:hidden"
            aria-expanded={open}
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="border-t border-white/10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 lg:hidden"
          aria-label="قائمة الجوال"
        >
          <ul className="flex flex-col gap-1">
            {PUBLIC_NAV_LINKS.map((item) => (
              <li key={`m-${item.href}-${item.label}`}>
                <Link
                  href={item.href}
                  className="flex min-h-12 items-center rounded-xl px-4 text-sm font-semibold text-white/90 hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/auth/login"
                className="mt-2 flex min-h-12 items-center justify-center rounded-xl px-4 text-center text-sm font-bold text-white"
                style={{ background: PUBLIC_BRAND.green }}
                onClick={() => setOpen(false)}
              >
                تسجيل الدخول
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
