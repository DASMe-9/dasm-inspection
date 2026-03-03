import { useMemo } from 'react'
import type { AppRole } from '@/lib/theme'
import { getRoleColors, THEME } from '@/lib/theme'

export interface UseThemeOptions {
  role?: AppRole
}

/**
 * Hook to access theme values for the current or specified app role
 */
export function useTheme(options: UseThemeOptions = {}) {
  const { role = 'customer' } = options

  const roleColors = useMemo(() => getRoleColors(role), [role])

  return {
    role,
    colors: roleColors,
    theme: THEME,
    isCustomer: role === 'customer',
    isWorkshop: role === 'workshop',
    isAdmin: role === 'admin',
  }
}
