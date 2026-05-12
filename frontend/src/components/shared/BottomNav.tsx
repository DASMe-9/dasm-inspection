"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "الرئيسية", icon: "🏠" },
  { href: "/requests", label: "الطلبات", icon: "📋" },
  { href: "/workshops", label: "الورش", icon: "🔧" },
  { href: "/subscription", label: "الاشتراك", icon: "💳" },
  { href: "/settings", label: "الإعدادات", icon: "⚙️" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { colors } = useTheme({ role: "workshop" });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto flex items-center justify-around py-2 px-1 border-t bg-white z-10 text-[11px]"
      style={{ borderTopColor: colors.secondary }}
      dir="rtl"
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href)) ||
          (item.href === "/requests" && pathname.startsWith("/reports"));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-1.5 px-1.5 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              isActive ? "text-white" : "text-gray-600 hover:bg-gray-100"
            )}
            style={isActive ? { backgroundColor: colors.primary } : undefined}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="text-base" aria-hidden>
              {item.icon}
            </span>
            <span className="leading-tight text-center">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
