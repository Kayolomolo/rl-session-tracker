import { useEffect, useState } from 'react'

export function BoostMeter({ value, size = 84, label }: { value: number | null; size?: number; label?: string }) {
  const [shown, setShown] = useState(0)
  useEffect(() => { const t = requestAnimationFrame(() => setShown(value ?? 0)); return () => cancelAnimationFrame(t) }, [value])
  const stroke = size * 0.11
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={value === null ? 'Nog geen winpercentage' : `Winpercentage ${value}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-rl-line)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-orange)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - shown / 100)} style={{ transition: 'stroke-dashoffset .8s ease-out' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold italic leading-none" style={{ fontSize: size * 0.3 }}>{value === null ? '–' : value}</span>
        {label && <span className="text-[10px] uppercase tracking-widest text-muted">{label}</span>}
      </div>
    </div>
  )
}
