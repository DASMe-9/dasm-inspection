"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks";
import { cn } from "@/lib/utils";
export interface HeaderProps {
  title?: string;
  backHref?: string;
  className?: string;
}

function getBackHrefFromPath(pathname: string): string | null {
  if (pathname.match(/^\/reports\/[^/]+$/)) {
    return "/requests";
  }
  if (pathname.match(/^\/requests\/[^/]+$/)) return "/requests";
  if (pathname.match(/^\/workshops\/[^/]+$/)) return "/workshops";
  return null;
}

export function Header({
  title = "DASM — الفحص الفني",
  backHref,
  className,
}: HeaderProps) {
  const pathname = usePathname();
  const { colors } = useTheme({ role: "workshop" });
  const href = backHref ?? getBackHrefFromPath(pathname);

  return (
    <header
      className={cn("px-4 py-3 flex items-center gap-3", className)}
      style={{ backgroundColor: colors.primary }}
      dir="rtl"
    >
      {href && (
        <Link
          href={href}
          className="text-white hover:opacity-80 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent rounded"
          aria-label="رجوع"
        >
          <span aria-hidden>→</span>
        </Link>
      )}
      <h1 className="text-white font-bold text-lg flex-1">{title}</h1>
    </header>
  );
}
