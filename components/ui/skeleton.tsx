import type React from 'react'

import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn('skeleton-shimmer rounded-lg bg-muted', className)}
      {...props}
    />
  )
}
