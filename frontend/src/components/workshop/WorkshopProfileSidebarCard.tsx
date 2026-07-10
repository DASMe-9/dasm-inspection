"use client";

import Link from "next/link";
import { Building2, UserRound } from "lucide-react";
import type { WorkshopSidebarProfileLink } from "@/lib/auth/workshop-sidebar-link";

/**
 * بطاقة «ملف الورشة» في الشريط الجانبي — الوصول إلى إعدادات الورشة فقط (لا علاقة بلوحة المعرض).
 */
export function WorkshopProfileSidebarCard({
  link,
}: {
  link: WorkshopSidebarProfileLink;
}) {
  return (
    <div className="space-y-2">
      <Link
        href={link.profileHref}
        className="group flex items-center gap-2 rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2.5 transition hover:border-violet-400/40 hover:bg-violet-500/15"
      >
        <Building2 className="h-4 w-4 shrink-0 text-violet-300" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-violet-100">ملف الورشة</p>
          <p className="truncate text-xs text-white/50">{link.name}</p>
        </div>
        <UserRound
          className="h-3.5 w-3.5 shrink-0 text-white/40 group-hover:text-white/70"
          aria-hidden
        />
      </Link>
      <Link
        href={link.publicHref}
        className="block rounded-lg px-3 py-1.5 text-center text-[11px] font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
      >
        عرض البروفايل العام للورشة
      </Link>
    </div>
  );
}
