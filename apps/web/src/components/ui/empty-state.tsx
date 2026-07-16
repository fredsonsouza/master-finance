import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="bg-surface-container mb-4 rounded-full p-4">
        <Icon className="text-on-surface-variant h-8 w-8" />
      </div>
      <h3 className="text-on-surface mb-1 font-semibold">{title}</h3>
      <p className="text-on-surface-variant mb-4 max-w-sm text-sm">
        {description}
      </p>
      {action}
    </div>
  )
}
