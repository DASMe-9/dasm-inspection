import { cn } from '@/lib/utils'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-6 h-6 border-2',
  md: 'w-10 h-10 border-2',
  lg: 'w-16 h-16 border-4',
}

/**
 * Unified loading spinner
 */
export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-t-transparent border-primary',
        sizeClasses[size],
        className
      )}
      style={{ borderColor: 'currentColor' }}
      role="status"
      aria-label="جاري التحميل"
    >
      <span className="sr-only">جاري التحميل</span>
    </div>
  )
}
