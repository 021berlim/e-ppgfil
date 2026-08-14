import { cn } from '@/lib/utils'
import { STATUS_STYLES, type Status } from '@/lib/types'

export function StatusBadge({
  status,
  className,
}: {
  status: Status
  className?: string
}) {
  const s = STATUS_STYLES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold',
        s.chip,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden="true" />
      {status}
    </span>
  )
}
