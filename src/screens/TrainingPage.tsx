import { useState } from 'react'
import { BarChart } from '../components/charts/BarChart'
import { RangePicker } from '../components/charts/RangePicker'
import { Card } from '../components/Card'
import { Heading, Label } from '../components/Label'
import { useData } from '../db/dataContext'
import { useNow } from '../hooks/useNow'
import { useStoredState } from '../hooks/useStoredState'
import { KIND_LABEL } from '../lib/activities'
import { activityTotals } from '../lib/stats'
import { formatDate, formatDuration, startOfMonth, startOfWeek } from '../lib/time'
import { notesList, weekStarts, weeklyTraining, type Range } from '../lib/trends'
import type { ActivityKind } from '../lib/types'
import { isRange, RANGE_OPTIONS, weekLabel } from './stats/ranges'

type Period = 'week' | 'month' | 'all'
const PERIODS: { value: Period; label: string }[] = [{ value: 'week', label: 'Week' }, { value: 'month', label: 'Maand' }, { value: 'all', label: 'Altijd' }]

function KindBlock({ kind, now }: { kind: ActivityKind; now: number }) {
  const { sessions } = useData()
  const [period, setPeriod] = useState<Period>('week')
  const since = period === 'week' ? startOfWeek(now) : period === 'month' ? startOfMonth(now) : undefined
  const list = activityTotals(sessions, kind, now, since)
  const max = list[0]?.ms ?? 0
  const total = list.reduce((s, a) => s + a.ms, 0)
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><Label>{KIND_LABEL[kind]}</Label><Heading className="mt-1 text-2xl">{formatDuration(total)}</Heading></div>
        <RangePicker value={period} options={PERIODS} onChange={setPeriod} />
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
      ) : <p className="text-sm text-muted">Nog niets in deze periode. Start {KIND_LABEL[kind].toLowerCase()} tijdens een sessie.</p>}
    </Card>
  )
}

function Notes() {
  const { sessions } = useData()
  const [filter, setFilter] = useState<string | null>(null)
  const all = notesList(sessions)
  const types = [...new Set(all.map((n) => n.type))]
  const shown = filter ? all.filter((n) => n.type === filter) : all
  return (
    <Card className="space-y-3">
      <Label>Notities</Label>
      {all.length === 0 ? <p className="text-sm text-muted">Voeg een notitie toe als je een timer stopt.</p> : (
        <>
          {types.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              <RangePicker value={filter ?? ''} options={[{ value: '', label: 'Alle' }, ...types.map((t) => ({ value: t, label: t }))]} onChange={(v) => setFilter(v || null)} />
            </div>
          )}
          <ul className="divide-y divide-rl-line">
            {shown.map((n) => (
              <li key={n.id} className="py-2.5">
                <p className="text-sm"><span className="font-display font-bold uppercase italic">{n.type}</span> <span className="text-muted">· {KIND_LABEL[n.kind]} · {formatDate(n.at)}</span></p>
                <p className="mt-0.5 text-sm">{n.note}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}

export function TrainingPage() {
  const { sessions } = useData()
  const now = useNow(30_000)
  const [range, setRange] = useStoredState<Range>('training-range', 12, isRange)
  const first = sessions.length ? Math.min(...sessions.map((s) => s.startedAt)) : undefined
  const weeks = weeklyTraining(sessions, weekStarts(now, range, first), now)
  const hasData = weeks.some((w) => w.warmupMs + w.trainingMs > 0)
  const min = (ms: number) => formatDuration(ms)
  return (
    <>
      <Heading className="text-4xl">Training</Heading>
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>Trainingstijd per week</Label>
          <RangePicker value={range} options={RANGE_OPTIONS} onChange={setRange} />
        </div>
        {hasData ? (
          <BarChart label="Warm-up en training per week" colors={['blue', 'orange']} highlightLast
            bars={weeks.map((w) => ({ x: weekLabel(w.week), values: [w.warmupMs, w.trainingMs], tip: `week van ${weekLabel(w.week)} · warm-up ${min(w.warmupMs)} · training ${min(w.trainingMs)}` }))} />
        ) : <p className="py-6 text-center text-sm text-muted">Start een warm-up of training tijdens een sessie om je weken te zien.</p>}
        <p className="flex gap-4 text-xs text-muted"><span><span className="text-blue-text">■</span> warm-up</span><span><span className="text-orange-text">■</span> training</span></p>
      </Card>
      <KindBlock kind="warmup" now={now} />
      <KindBlock kind="training" now={now} />
      <Notes />
    </>
  )
}
