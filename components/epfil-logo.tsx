import { cn } from '@/lib/utils'

type Props = {
  className?: string
  variant?: 'default' | 'light'
  showSub?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { mark: 'size-8', title: 'text-lg', sub: 'text-[10px]' },
  md: { mark: 'size-11', title: 'text-2xl', sub: 'text-[11px]' },
  lg: { mark: 'size-16', title: 'text-4xl', sub: 'text-xs' },
}

export function EpfilLogo({
  className,
  variant = 'default',
  showSub = true,
  size = 'md',
}: Props) {
  const s = sizes[size]
  const light = variant === 'light'

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'relative grid shrink-0 place-items-center rounded-2xl',
          s.mark,
          light ? 'bg-primary-foreground/15' : 'bg-primary',
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            'absolute size-1/3 rounded-full',
            light ? 'bg-primary-foreground' : 'bg-primary-foreground',
          )}
          style={{ transform: 'translate(-28%, -22%)' }}
        />
        <span
          className={cn(
            'absolute rounded-full border-2',
            light ? 'border-accent' : 'border-accent',
          )}
          style={{ width: '48%', height: '48%', transform: 'translate(24%, 24%)' }}
        />
      </div>
      <div className="leading-none">
        <p
          className={cn(
            'font-extrabold tracking-tight',
            s.title,
            light ? 'text-primary-foreground' : 'text-primary',
          )}
        >
          e-PPGFIL
        </p>
        {showSub && (
          <p
            className={cn(
              'mt-1 font-semibold uppercase tracking-[0.16em]',
              s.sub,
              light ? 'text-primary-foreground/70' : 'text-muted-foreground',
            )}
          >
            PPGFIL · UERJ
          </p>
        )}
      </div>
    </div>
  )
}
