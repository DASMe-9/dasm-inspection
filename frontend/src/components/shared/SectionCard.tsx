"use client";

import type { ReactNode } from "react";
import { useTheme } from "@/hooks";
import { cn } from "@/lib/utils";

export interface SectionCardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, children, className }: SectionCardProps) {
  const { colors } = useTheme({ role: "workshop" });

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden bg-white shadow-sm ring-1 ring-black/[0.04]",
        className
      )}
      style={{ borderColor: colors.secondary }}
      dir="rtl"
    >
      {title && (
        <div
          className="border-b px-4 py-3 text-sm font-semibold text-gray-900 bg-gradient-to-l from-gray-50/90 to-white"
          style={{ borderColor: `${colors.secondary}33` }}
        >
          {title}
        </div>
      )}
      <div className="p-4 md:p-5">{children}</div>
    </div>
  );
}
