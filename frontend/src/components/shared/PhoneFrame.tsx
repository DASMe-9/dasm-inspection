"use client";

import type { ReactNode } from "react";
import { useTheme } from "@/hooks";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/theme";

export interface PhoneFrameProps {
  children: ReactNode;
  role?: AppRole;
  className?: string;
  /** Optional top bar content (logo, title) */
  topBar?: ReactNode;
}

/**
 * Placeholder: Phone/mobile frame wrapper.
 * Adapts border accent based on app role.
 */
export function PhoneFrame({
  children,
  role = "workshop",
  className,
  topBar,
}: PhoneFrameProps) {
  const { colors } = useTheme({ role });

  return (
    <div
      className={cn(
        "mx-auto max-w-md min-h-screen rounded-lg overflow-hidden border-4 shadow-xl bg-gray-50",
        className
      )}
      style={{ borderColor: colors.primary }}
    >
      {topBar}
      <main className="p-4">{children}</main>
    </div>
  );
}
