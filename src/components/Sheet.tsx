import { IconX } from '@tabler/icons-react'
import type { ReactNode } from 'react'

export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div role="dialog" aria-label={title} className="anim-rise max-h-[85vh] w-full max-w-[520px] overflow-y-auto rounded-t-3xl border-t border-rl-line bg-rl-card p-5 pb-[calc(20px+env(safe-area-inset-bottom))]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold uppercase italic">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Sluiten" className="rounded-full p-2 text-muted"><IconX size={22} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
