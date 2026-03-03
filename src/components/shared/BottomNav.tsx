import { NavLink } from 'react-router-dom'
import { useTheme } from '@/hooks'
import { cn } from '@/lib/utils'
import type { AppRole } from '@/lib/theme'

export interface NavItem {
  to: string
  label: string
  icon?: React.ReactNode
}

export interface BottomNavProps {
  role?: AppRole
  items: NavItem[]
  className?: string
}

/**
 * Unified bottom navigation bar.
 * Adapts accent color based on app role.
 */
export function BottomNav({ role = 'customer', items, className }: BottomNavProps) {
  const { colors } = useTheme({ role })

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 max-w-md mx-auto flex items-center justify-around py-2 px-4 border-t',
        className
      )}
      style={{
        backgroundColor: '#fff',
        borderTopColor: colors.secondary,
      }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-100'
            )
          }
          style={({ isActive }) =>
            isActive ? { backgroundColor: colors.primary } : undefined
          }
        >
          {item.icon}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
