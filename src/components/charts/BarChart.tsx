import { useState } from 'react'
import { ChartTip } from './ChartTip'
import { barLayout } from './geometry'

const COLORS = { blue: 'var(--color-blue)', orange: 'var(--color-orange)' }
export interface Bar { x: string; values: number[]; tip: string }

interface Props { bars: Bar[]; colors: (keyof typeof COLORS)[]; highlightLast?: boolean; height?: number; label: string }

const W = 300

export function BarChart({ bars, colors, highlightLast = false, height = 100, label }: Props) {
  const [sel, setSel] = useState<number | null>(null)
  const bottom = height - 16
  const max = Math.max(1, ...bars.map((b) => b.values.reduce((s, v) => s + v, 0)))
  const { slot, bw, tan } = barLayout(bars.length, W, bottom)
  const n = bars.length
  const labelIdx = [...new Set([0, Math.floor((n - 1) / 2), n - 1])].filter((i) => i >= 0)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" role="img" aria-label={label}>
        <line x1={0} x2={W} y1={bottom + 0.5} y2={bottom + 0.5} stroke="var(--color-rl-line)" />
        {bars.map((b, i) => {
          const x = i * slot + (slot - bw) / 2
          let y = bottom
          const dim = highlightLast && i !== n - 1 ? 0.75 : 1
          return (
            <g key={i} onClick={() => setSel(sel === i ? null : i)} className="cursor-pointer" opacity={sel === null || sel === i ? dim : 0.45}>
              <rect x={i * slot} y={0} width={slot} height={bottom} fill="transparent" />
              <g transform={`translate(${bottom * tan},0) skewX(-8)`}>
                {b.values.map((v, k) => {
                  const h = (v / max) * (bottom - 6)
                  y -= h
                  return h > 0 ? <rect key={k} x={x} y={y} width={bw} height={h} fill={COLORS[colors[k] ?? 'blue']} /> : null
                })}
              </g>
            </g>
          )
        })}
        {labelIdx.map((i) => (
          <text key={i} x={i * slot + slot / 2} y={height - 3} fontSize={10} fill="var(--color-muted)" textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}>{bars[i]?.x}</text>
        ))}
      </svg>
      {sel !== null && bars[sel] && <ChartTip text={bars[sel].tip} />}
    </div>
  )
}
