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
      className={cn("rounded-lg border p-4 bg-white", className)}
      style={{ borderColor: colors.secondary }}
      dir="rtl"
    >
      <div className="text-2xl font-bold" style={{ color: colors.primary }}>
        {value}
      </div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </div>
  );
}
