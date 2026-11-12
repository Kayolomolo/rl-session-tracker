import { useRef, type ReactNode } from 'react'

type Variant = 'blue' | 'orange' | 'light' | 'ghost'
const VARIANTS: Record<Variant, string> = {
  blue: 'border border-[#9fd0ff]/70 bg-[linear-gradient(180deg,#3fa0ff_0%,#1e7cf5_45%,#1458d6_100%)] text-white shadow-[0_0_22px_rgb(30_139_255/.55),inset_0_1px_0_rgb(255_255_255/.45)] [text-shadow:0_1px_8px_rgb(150_210_255/.6)]',
  orange: 'border border-[#ffd2a6]/70 bg-[linear-gradient(180deg,#ffa14a_0%,#ff7a1a_50%,#e2600a_100%)] text-[#2a1200] shadow-[0_0_22px_rgb(255_122_26/.5),inset_0_1px_0_rgb(255_255_255/.45)]',
  light: 'border border-white/70 bg-ink text-rl-bg shadow-[0_0_16px_rgb(255_255_255/.25)]',
  ghost: 'border border-[#3d8bff]/40 bg-[#0a1834]/80 text-muted',
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
  const ref = useRef<HTMLButtonElement>(null)
  const pulse = () => {
    const el = ref.current
    if (!el) return
    el.classList.remove('anim-pulse')
    void el.offsetWidth
    el.classList.add('anim-pulse')
  }
  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => { pulse(); onClick?.() }}
      className={`-skew-x-12 rounded-lg font-display font-bold uppercase italic tracking-wide transition active:scale-[0.97] disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      <span className="flex skew-x-12 items-center justify-center gap-2">{children}</span>
    </button>
  )
}
