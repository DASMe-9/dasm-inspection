import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SectionCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, children, className }: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/10",
        className
      )}
      dir="rtl"
    >
      {title && (
        <div className="border-b border-slate-200 bg-gradient-to-l from-slate-50 to-white px-4 py-3 text-sm font-semibold text-slate-900 dark:border-slate-600 dark:from-slate-800 dark:to-slate-900 dark:text-white">
          {title}
        </div>
      )}
      <div className="p-4 md:p-5">{children}</div>
    </div>
  );
}
