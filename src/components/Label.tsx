import type { ReactNode } from 'react'

export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`font-display text-[13px] font-bold uppercase italic tracking-[0.12em] text-[#9db8e6] ${className}`}>{children}</p>
}

export function Heading({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={`font-display font-bold uppercase italic leading-none ${className}`}>{children}</h2>
}
