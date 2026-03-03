import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

/**
 * Display when a list or section has no data
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <h3 className="text-lg font-medium text-gray-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 mb-4 max-w-xs">{description}</p>
      )}
      {action}
    </div>
  )
}
