import { useEffect, type ReactNode } from 'react'

interface Props { message: string; actionLabel?: string; onAction?: () => void; children?: ReactNode; onClose: () => void; durationMs?: number }

export function Toast({ message, actionLabel, onAction, children, onClose, durationMs = 5000 }: Props) {
  useEffect(() => { const t = setTimeout(onClose, durationMs); return () => clearTimeout(t) }, [onClose, durationMs])
  return (
    <div role="status" className="anim-rise fixed inset-x-0 bottom-24 z-40 mx-auto w-[calc(100%-32px)] max-w-[488px] rounded-2xl border border-rl-line bg-rl-nav p-3 shadow-2xl">
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-lg font-bold uppercase italic">{message}</span>
        {actionLabel && <button type="button" onClick={onAction} className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-text">{actionLabel}</button>}
      </div>
      {children}
    </div>
  )
}
