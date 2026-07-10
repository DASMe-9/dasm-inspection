"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { WorkshopProfileSidebarCard } from "@/components/workshop/WorkshopProfileSidebarCard";
import type { WorkshopSidebarProfileLink } from "@/lib/auth/workshop-sidebar-link";
import type { InspectionNavKey } from "@/lib/auth/resolve-inspection-persona";
import {
  filterSidebarNavGroups,
  type SidebarNavGroup,
} from "@/components/shared/nav-config";

export function Sidebar({
  allowedNavKeys,
  workshopProfileLink = null,
}: {
  allowedNavKeys: InspectionNavKey[];
  workshopProfileLink?: WorkshopSidebarProfileLink | null;
}) {
  const pathname = usePathname();
  const allowed = new Set(allowedNavKeys);
  const groups: SidebarNavGroup[] = filterSidebarNavGroups(allowed);

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:right-0 bg-[#0B1E3A] border-l border-white/10 shadow-[4px_0_32px_-16px_rgba(2,8,20,0.6)] z-40">
      {/* Logo — هوية داسم */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-[linear-gradient(135deg,#1E74E8_0%,#2FBF4E_100%)] flex items-center justify-center shadow-md">
          <span className="text-white font-extrabold text-sm">DE</span>
        </div>
        <div>
          <h1 className="font-bold text-white text-sm">فحص داسم</h1>
          <p className="text-[10px] text-slate-400">الفحص الفني للمركبات</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/10 text-white ring-1 ring-inset ring-[#2FBF4E]/40"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {workshopProfileLink ? (
        <div className="px-3 pb-2">
          <WorkshopProfileSidebarCard link={workshopProfileLink} />
        </div>
      ) : null}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10 space-y-2">
        <ThemeToggle />
        <a
          href="/api/auth/logout"
          className="flex items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
        >
          <span aria-hidden>↩</span>
          تسجيل الخروج
        </a>
        <p className="text-[10px] text-slate-500 text-center">
          فحص داسم — منصة الفحص الفني
        </p>
      </div>
    </aside>
  );
}
