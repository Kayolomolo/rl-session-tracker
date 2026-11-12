import { IconHexagon } from '@tabler/icons-react'
import { rankIcon } from '../lib/ranks'

/** Rank-icoon voor een tier of label ("Champion II Div 3"). Decoratief: de rank staat er altijd als tekst naast. */
export function RankIcon({ label, size = 24, className = '' }: { label: string; size?: number; className?: string }) {
  const src = rankIcon(label)
  if (!src) return <IconHexagon size={size} stroke={1.5} className={`shrink-0 text-muted ${className}`} aria-hidden="true" />
  return <img src={src} alt="" aria-hidden="true" width={size} height={size} loading="lazy" draggable={false} className={`shrink-0 object-contain ${className}`} />
}
