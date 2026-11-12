import type { ReactNode } from 'react'

export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-[11px] font-medium uppercase tracking-[0.12em] text-muted ${className}`}>{children}</p>
}

export function Heading({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={`font-display font-bold uppercase italic leading-none ${className}`}>{children}</h2>
}
