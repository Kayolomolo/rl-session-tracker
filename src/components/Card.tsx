import type { ReactNode } from 'react'

export type Glow = 'blue' | 'orange' | 'purple'

export function Card({ children, className = '', accent = false, glow = 'blue', onClick }: { children: ReactNode; className?: string; accent?: boolean; glow?: Glow; onClick?: () => void }) {
  const cls = `anim-rise glass glow-${glow} rounded-[18px] p-4 ${accent ? 'glow-strong' : ''} ${onClick ? 'w-full text-left transition active:scale-[0.99]' : ''} ${className}`
  return onClick ? <button type="button" onClick={onClick} className={cls}>{children}</button> : <div className={cls}>{children}</div>
}
