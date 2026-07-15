"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
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
      className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-md"
      style={{ background: PUBLIC_BRAND.navyGlass }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4">
        <Link href="/" className="shrink-0" onClick={() => setOpen(false)}>
          <InspectionLogo />
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

        <div className="flex items-center gap-2 md:gap-3">
          <ThemeToggle compact />
          <Link
            href="/auth/login"
            className="hidden rounded-lg border border-white/25 px-3 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/10 sm:inline-block md:text-sm"
          >
            EN
          </Link>
          <Link
            href="/auth/login"
            className="rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-105"
            style={{ background: PUBLIC_BRAND.green }}
          >
            تسجيل الدخول
          </Link>
          <button
            type="button"
            className="inline-flex rounded-lg border border-white/20 p-2 text-white lg:hidden"
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
          className="border-t border-white/10 px-4 py-3 lg:hidden"
          aria-label="قائمة الجوال"
        >
          <ul className="flex flex-col gap-1">
            {PUBLIC_NAV_LINKS.map((item) => (
              <li key={`m-${item.href}-${item.label}`}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/auth/login"
                className="mt-2 block rounded-lg px-3 py-2.5 text-center text-sm font-bold text-white"
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
