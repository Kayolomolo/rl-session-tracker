import { useState } from 'react'
import { ChartTip } from './ChartTip'

const COLORS = { blue: 'var(--color-blue)', orange: 'var(--color-orange)' }
export interface LinePoint { x: string; y: number | null; tip: string }

interface Props { points: LinePoint[]; min: number; max: number; color?: keyof typeof COLORS; reference?: number; step?: boolean; height?: number; label: string }

const W = 300
const PAD = { l: 6, r: 6, t: 8, b: 18 }

export function LineChart({ points, min, max, color = 'blue', reference, step = false, height = 110, label }: Props) {
  const [sel, setSel] = useState<number | null>(null)
  const span = max - min || 1
  const n = points.length
  const xAt = (i: number) => PAD.l + (n <= 1 ? (W - PAD.l - PAD.r) / 2 : (i / (n - 1)) * (W - PAD.l - PAD.r))
  const yAt = (v: number) => PAD.t + (1 - (v - min) / span) * (height - PAD.t - PAD.b)

  const segments: string[] = []
  let cur = ''
  points.forEach((p, i) => {
    if (p.y === null) { if (cur) segments.push(cur); cur = ''; return }
    const x = xAt(i), y = yAt(p.y)
    if (!cur) cur = `M${x},${y}`
    else if (step) { const prevY = cur.split(/[ ,]/).at(-1); cur += ` L${x},${prevY} L${x},${y}` }
    else cur += ` L${x},${y}`
  })
  if (cur) segments.push(cur)

  const labelIdx = [...new Set([0, Math.floor((n - 1) / 2), n - 1])].filter((i) => i >= 0)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label={label}>
        {reference !== undefined && <line x1={PAD.l} x2={W - PAD.r} y1={yAt(reference)} y2={yAt(reference)} stroke="var(--color-rl-line)" strokeDasharray="4 4" />}
        {segments.map((d, i) => <path key={i} d={d} fill="none" stroke={COLORS[color]} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" className="anim-rise" />)}
        {points.map((p, i) => p.y === null ? null : (
          <g key={i} onClick={() => setSel(sel === i ? null : i)} className="cursor-pointer">
            <circle cx={xAt(i)} cy={yAt(p.y)} r={12} fill="transparent" />
            <circle cx={xAt(i)} cy={yAt(p.y)} r={sel === i ? 5 : 3} fill={sel === i ? 'var(--color-ink)' : COLORS[color]} />
          </g>
        ))}
        {labelIdx.map((i) => (
          <text key={i} x={xAt(i)} y={height - 4} fontSize={10} fill="var(--color-muted)" textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>{points[i]?.x}</text>
        ))}
      </svg>
      {sel !== null && points[sel] && <ChartTip text={points[sel].tip} />}
    </div>
  )
}
