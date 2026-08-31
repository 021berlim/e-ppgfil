import Image from 'next/image'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  variant?: 'default' | 'light'
  showSub?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { width: 112, height: 47 },
  md: { width: 156, height: 65 },
  lg: { width: 220, height: 92 },
}

export function EpfilLogo({
  className,
  variant = 'default',
  showSub = true,
  size = 'md',
}: Props) {
  const dimensions = sizes[size]
  const light = variant === 'light'

  return (
    <div className={cn('flex items-center', className)}>
      <Image
        src="/logo-ppgfil.svg"
        alt="PPGFIL · UERJ"
        width={dimensions.width}
        height={dimensions.height}
        priority
        className={cn('h-auto w-auto max-w-full', light && 'brightness-0 invert')}
      />
      {!showSub && <span className="sr-only">PPGFIL · UERJ</span>}
    </div>
  )
}
