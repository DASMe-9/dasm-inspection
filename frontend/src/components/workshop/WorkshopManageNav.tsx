"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const TABS = [
  { href: "/workshop", label: "نظرة عامة", exact: true },
  { href: "/workshop/team", label: "الفريق" },
  { href: "/workshop/pricing", label: "الأسعار" },
  { href: "/workshop/areas", label: "مناطق الخدمة" },
] as const;

function NavInner() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const workshopId = sp.get("workshop_id");
  const q = workshopId ? `?workshop_id=${workshopId}` : "";

  return (
    <nav
      className="flex flex-wrap gap-2 border-b border-gray-200 pb-3"
      aria-label="إدارة الورشة"
    >
      {TABS.map((tab) => {
        const href = `${tab.href}${q}`;
        const active =
          "exact" in tab && tab.exact
            ? pathname === "/workshop"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={href}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
              active
                ? "bg-violet-100 text-violet-800"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function WorkshopManageNav() {
  return (
    <Suspense fallback={<div className="h-10 border-b border-gray-100" />}>
      <NavInner />
    </Suspense>
  );
}
