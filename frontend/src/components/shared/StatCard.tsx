"use client";

import { useTheme } from "@/hooks";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  value: string | number;
  label: string;
  className?: string;
}

export function StatCard({ value, label, className }: StatCardProps) {
  const { colors } = useTheme({ role: "workshop" });

  return (
    <div
      className={cn(
        "rounded-xl border p-4 md:p-5 bg-white shadow-sm ring-1 ring-black/[0.04]",
        className
      )}
      style={{ borderColor: colors.secondary }}
      dir="rtl"
    >
      <div className="text-2xl md:text-3xl font-bold tabular-nums" style={{ color: colors.primary }}>
        {value}
      </div>
      <div className="text-sm text-gray-600 mt-1.5 leading-snug">{label}</div>
    </div>
  );
}
