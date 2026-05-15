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
      className={cn("rounded-lg border overflow-hidden bg-white", className)}
      style={{ borderColor: colors.secondary }}
      dir="rtl"
    >
      {title && (
        <div className="border-b border-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-900 bg-gray-50">
          {title}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
