import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Props = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent?: "blue" | "violet" | "emerald" | "slate";
};

const ACCENT_STYLES = {
  blue: "text-[#1E74E8] bg-blue-50 dark:bg-blue-950/40",
  violet: "text-violet-600 bg-violet-50 dark:bg-violet-950/40",
  emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
  slate: "text-slate-600 bg-slate-100 dark:bg-slate-800",
} as const;

export function QuickActionCard({
  href,
  title,
  description,
  icon: Icon,
  accent = "blue",
}: Props) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-gray-200/90 bg-white p-3.5 shadow-sm transition hover:border-[#1E74E8]/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500/40"
    >
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ACCENT_STYLES[accent]}`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-900 dark:text-slate-100">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-slate-400">{description}</span>
      </span>
    </Link>
  );
}
