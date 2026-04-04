/**
 * Design System Tokens - Dasm Inspection
 * Unified theme for Customer, Workshop, and Admin roles
 */

export type AppRole = "customer" | "workshop" | "admin";

export const TOKENS = {
  colors: {
    semantic: {
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
      info: "#3B82F6",
    },
    roles: {
      customer: {
        primary: "#2563EB",
        secondary: "#64748B",
        accent: "#60A5FA",
      },
      workshop: {
        primary: "#7C3AED",
        secondary: "#64748B",
        accent: "#A78BFA",
      },
      admin: {
        primary: "#DC2626",
        secondary: "#64748B",
        accent: "#F87171",
      },
    },
    neutral: {
      50: "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E7EB",
      300: "#D1D5DB",
      400: "#9CA3AF",
      500: "#6B7280",
      600: "#4B5563",
      700: "#374151",
      800: "#1F2937",
      900: "#111827",
    },
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
    "3xl": "4rem",
  },
  borderRadius: {
    sm: "0.25rem",
    md: "0.5rem",
    lg: "1rem",
    full: "9999px",
  },
  typography: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "2rem",
  },
} as const;

export function getRoleColors(role: AppRole) {
  return TOKENS.colors.roles[role];
}
