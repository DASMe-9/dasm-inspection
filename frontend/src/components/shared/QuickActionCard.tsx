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
      className="group rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm ring-1 ring-black/[0.04] transition-all hover:border-[#1E74E8]/40 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:ring-white/5 dark:hover:border-blue-500/40"
    >
      <span
        className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${ACCENT_STYLES[accent]}`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <p className="font-semibold text-gray-900 dark:text-slate-100">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-slate-400">
        {description}
      </p>
    </Link>
  );
}
