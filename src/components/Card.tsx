import type { ReactNode } from 'react'

export function Card({ children, className = '', accent = false, onClick }: { children: ReactNode; className?: string; accent?: boolean; onClick?: () => void }) {
  const cls = `anim-rise rounded-[18px] border bg-rl-card p-4 ${accent ? 'border-blue' : 'border-rl-line'} ${onClick ? 'w-full text-left transition active:scale-[0.99]' : ''} ${className}`
  return onClick ? <button type="button" onClick={onClick} className={cls}>{children}</button> : <div className={cls}>{children}</div>
}
