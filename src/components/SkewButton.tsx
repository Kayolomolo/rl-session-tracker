import { useState, type ReactNode } from 'react'

type Variant = 'blue' | 'orange' | 'light' | 'ghost'
const VARIANTS: Record<Variant, string> = {
  blue: 'bg-blue text-white',
  orange: 'bg-orange text-[#2a1200]',
  light: 'bg-ink text-rl-bg',
  ghost: 'bg-rl-nav text-muted border border-rl-line',
}
const SIZES = { md: 'px-4 py-2 text-base', lg: 'px-5 py-4 text-xl', xl: 'px-5 py-6 text-3xl' }

interface Props {
  variant: Variant
  size?: keyof typeof SIZES
  onClick?: () => void
  disabled?: boolean
  children: ReactNode
  className?: string
  ariaLabel?: string
}

export function SkewButton({ variant, size = 'md', onClick, disabled, children, className = '', ariaLabel }: Props) {
  const [pulse, setPulse] = useState(0)
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => { setPulse((p) => p + 1); onClick?.() }}
      className={`-skew-x-12 rounded-lg font-display font-bold uppercase italic tracking-wide transition active:scale-[0.97] disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      <span key={pulse} className={`flex skew-x-12 items-center justify-center gap-2 ${pulse ? 'anim-pulse rounded-lg' : ''}`}>{children}</span>
    </button>
  )
}
