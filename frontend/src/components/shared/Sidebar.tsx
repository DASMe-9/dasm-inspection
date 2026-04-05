"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_GROUPS = [
  {
    label: "الرئيسية",
    items: [
      { href: "/", label: "لوحة التحكم", icon: "📊" },
    ],
  },
  {
    label: "إدارة الفحص",
    items: [
      { href: "/requests", label: "طلبات الفحص", icon: "📋" },
      { href: "/workshops", label: "الورش المعتمدة", icon: "🔧" },
    ],
  },
  {
    label: "النظام",
    items: [
      { href: "/settings", label: "الإعدادات", icon: "⚙️" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:right-0 bg-white border-l border-gray-200 z-40">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center">
          <span className="text-white font-bold text-sm">فحص</span>
        </div>
        <div>
          <h1 className="font-bold text-gray-900 text-sm">داسم فحص</h1>
          <p className="text-[10px] text-gray-500">الفحص الفني للمركبات</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-100"
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

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200">
        <p className="text-[10px] text-gray-400 text-center">
          داسم فحص — منصة الفحص الفني
        </p>
      </div>
    </aside>
  );
}
