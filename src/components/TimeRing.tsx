import { formatDuration } from '../lib/time'

const COLORS = { blue: 'var(--color-blue)', orange: 'var(--color-orange)', muted: 'var(--color-rl-line)' }
type Part = { label: string; ms: number; color: keyof typeof COLORS }

export function TimeRing({ parts, size = 120 }: { parts: Part[]; size?: number }) {
  const total = parts.reduce((s, p) => s + p.ms, 0)
  const stroke = size * 0.14
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-rl-nav)" strokeWidth={stroke} />
        {total > 0 && parts.map((p) => {
          const len = (p.ms / total) * c
          const el = <circle key={p.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={COLORS[p.color]} strokeWidth={stroke} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />
          offset += len
          return el
        })}
      </svg>
      <ul className="space-y-2 text-sm">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 -skew-x-12" style={{ background: COLORS[p.color] }} />
            <span className="text-muted">{p.label}</span>
            <span className="font-display font-bold italic">{formatDuration(p.ms)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
