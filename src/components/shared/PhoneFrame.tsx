import type { ReactNode } from 'react'
import { useTheme } from '@/hooks'
import { cn } from '@/lib/utils'
import type { AppRole } from '@/lib/theme'

export interface PhoneFrameProps {
  children: ReactNode
  role?: AppRole
  className?: string
  /** Optional top bar content (logo, title, actions) */
  topBar?: ReactNode
}

/**
 * Unified phone/mobile frame wrapper.
 * Adapts border/accent color based on app role (customer/workshop/admin).
 */
export function PhoneFrame({
  children,
  role = 'customer',
  className,
  topBar,
}: PhoneFrameProps) {
  const { colors } = useTheme({ role })

  return (
    <div
      className={cn(
        'mx-auto max-w-md min-h-screen rounded-lg overflow-hidden border-4 shadow-xl',
        className
      )}
      style={{
        borderColor: colors.primary,
        backgroundColor: '#f9fafb',
      }}
    >
      {topBar && (
        <header
          className="px-4 py-3 flex items-center justify-between"
          style={{ backgroundColor: colors.primary }}
        >
          {topBar}
        </header>
      )}
      <main className="p-4 pb-24">{children}</main>
    </div>
  )
}
