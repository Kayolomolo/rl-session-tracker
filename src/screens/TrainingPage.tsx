import { useState } from 'react'
import { Card } from '../components/Card'
import { Heading, Label } from '../components/Label'
import { SkewButton } from '../components/SkewButton'
import { useData } from '../db/dataContext'
import { useNow } from '../hooks/useNow'
import { KIND_LABEL } from '../lib/activities'
import { activityTotals } from '../lib/stats'
import { formatDuration, startOfWeek } from '../lib/time'
import type { ActivityKind } from '../lib/types'

function KindBlock({ kind, now }: { kind: ActivityKind; now: number }) {
  const { sessions } = useData()
  const [range, setRange] = useState<'week' | 'all'>('week')
  const list = activityTotals(sessions, kind, now, range === 'week' ? startOfWeek(now) : undefined)
  const max = list[0]?.ms ?? 0
  const total = list.reduce((s, a) => s + a.ms, 0)
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div><Label>{KIND_LABEL[kind]}</Label><Heading className="mt-1 text-2xl">{formatDuration(total)}</Heading></div>
        <div className="flex gap-1.5">
          <SkewButton variant={range === 'week' ? 'light' : 'ghost'} onClick={() => setRange('week')} className="!px-3 !py-1 text-sm">Week</SkewButton>
          <SkewButton variant={range === 'all' ? 'light' : 'ghost'} onClick={() => setRange('all')} className="!px-3 !py-1 text-sm">Altijd</SkewButton>
        </div>
      </div>
      {list.length ? (
        <ul className="space-y-2.5">
          {list.map((a) => (
            <li key={a.type}>
              <div className="mb-1 flex justify-between text-sm"><span>{a.type}</span><span className="text-muted">{formatDuration(a.ms)}</span></div>
              <div className="h-1.5 bg-rl-nav"><div className={`h-full -skew-x-[20deg] ${kind === 'warmup' ? 'bg-blue' : 'bg-orange'}`} style={{ width: `${max ? Math.max(4, (a.ms / max) * 100) : 0}%` }} /></div>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted">{range === 'week' ? 'Deze week nog niets.' : 'Nog niets vastgelegd.'} Start {KIND_LABEL[kind].toLowerCase()} tijdens een sessie.</p>}
    </Card>
  )
}

export function TrainingPage() {
  const now = useNow(30_000)
  return (
    <>
      <Heading className="text-4xl">Training</Heading>
      <KindBlock kind="warmup" now={now} />
      <KindBlock kind="training" now={now} />
    </>
  )
}
