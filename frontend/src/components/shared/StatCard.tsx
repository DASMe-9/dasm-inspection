import { cn } from "@/lib/utils";

export interface StatCardProps {
  value: string | number;
  label: string;
  className?: string;
}

export function StatCard({ value, label, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 md:p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/10",
        className
      )}
      dir="rtl"
    >
      <div className="text-2xl md:text-3xl font-bold tabular-nums text-[#0B1E3A] dark:text-slate-100">
        {value}
      </div>
      <div className="text-sm text-gray-600 dark:text-slate-400 mt-1.5 leading-snug">
        {label}
      </div>
    </div>
  );
}
