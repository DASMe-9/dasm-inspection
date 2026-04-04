"use client";

import { useMemo } from "react";
import type { AppRole } from "@/lib/theme";
import { getRoleColors, TOKENS } from "@/lib/theme";

export interface UseThemeOptions {
  role?: AppRole;
}

/**
 * Hook to access theme tokens for the current or specified app role
 */
export function useTheme(options: UseThemeOptions = {}) {
  const { role = "workshop" } = options;

  const roleColors = useMemo(() => getRoleColors(role), [role]);

  return {
    role,
    colors: roleColors,
    tokens: TOKENS,
    isCustomer: role === "customer",
    isWorkshop: role === "workshop",
    isAdmin: role === "admin",
  };
}
