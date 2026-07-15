"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const TABS = [
  { href: "/workshop", label: "نظرة عامة", exact: true },
  { href: "/workshop/field", label: "ميداني" },
  { href: "/workshop/reputation", label: "التقييمات والمتابعون" },
  { href: "/workshop/export", label: "تصدير CSV" },
] as const;

function NavInner() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const workshopId = sp.get("workshop_id");
  const q = workshopId ? `?workshop_id=${workshopId}` : "";

  if (
    pathname.startsWith("/workshop/profile") ||
    pathname.startsWith("/workshop/settings") ||
    pathname.startsWith("/settings")
  ) {
    return null;
  }

  return (
    <nav
      className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      aria-label="إدارة الورشة"
    >
      <div className="flex min-w-max gap-1">
        {TABS.map((tab) => {
          const href = `${tab.href}${q}`;
          const active =
            "exact" in tab && tab.exact
              ? pathname === "/workshop"
              : tab.href === "/workshop/reputation"
                ? pathname.startsWith("/workshop/reputation") ||
                  pathname.startsWith("/workshop/reviews") ||
                  pathname.startsWith("/workshop/followers")
                : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={href}
              className={`rounded-xl px-3 py-2 text-sm font-semibold whitespace-nowrap transition ${
                active
                  ? "bg-[#1E74E8] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function WorkshopManageNav() {
  return (
    <Suspense
      fallback={
        <div className="h-12 rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900" />
      }
    >
      <NavInner />
    </Suspense>
  );
}
