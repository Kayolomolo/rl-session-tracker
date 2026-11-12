import { useState } from 'react'
import { BarChart } from '../components/charts/BarChart'
import { LineChart } from '../components/charts/LineChart'
import { RangePicker } from '../components/charts/RangePicker'
import { BoostMeter } from '../components/BoostMeter'
import { Card } from '../components/Card'
import { Heading, Label } from '../components/Label'
import { WinLossBar } from '../components/WinLossBar'
import { useData } from '../db/dataContext'
import { useNow } from '../hooks/useNow'
import { useStoredState } from '../hooks/useStoredState'
import { totals } from '../lib/stats'
import { formatDuration } from '../lib/time'
import { rankHistory, weekStarts, weeklyVolume, weeklyWinRate, type Range } from '../lib/trends'
import { MODES, type Mode } from '../lib/types'
import { isRange, RANGE_OPTIONS, weekLabel } from './stats/ranges'

type ModeFilter = 'all' | Mode
const MODE_OPTIONS: { value: ModeFilter; label: string }[] = [{ value: 'all', label: 'Alle' }, ...MODES.map((m) => ({ value: m as ModeFilter, label: m }))]
const MODE_ONLY = MODES.map((m) => ({ value: m, label: m }))
const Empty = ({ text }: { text: string }) => <p className="py-6 text-center text-sm text-muted">{text}</p>

export function StatsPage() {
  const { sessions, profile } = useData()
  const now = useNow(30_000)
  const [range, setRange] = useStoredState<Range>('stats-range', 12, isRange)
  const [winMode, setWinMode] = useState<ModeFilter>('all')
  const [rankMode, setRankMode] = useState<Mode>(profile.lastMode)

  const first = sessions.length ? Math.min(...sessions.map((s) => s.startedAt)) : undefined
  const weeks = weekStarts(now, range, first)
  const win = weeklyWinRate(sessions, weeks, winMode === 'all' ? undefined : winMode)
  const volume = weeklyVolume(sessions, weeks, now)
  const thisWeek = volume.at(-1)
  const ranks = rankHistory(sessions, rankMode, weeks[0])
  const useMmr = ranks.mmr.length >= 2
  const t = totals(sessions, now)

  const rankMin = Math.min(...ranks.steps.map((p) => p.index)) - 1
  const rankMax = Math.max(...ranks.steps.map((p) => p.index)) + 1
  const mmrMin = Math.min(...ranks.mmr.map((p) => p.mmr)) - 20
  const mmrMax = Math.max(...ranks.mmr.map((p) => p.mmr)) + 20
  const fmtDay = (ts: number) => new Date(ts).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace('.', '')

  return (
    <>
      <Heading className="text-4xl">Stats</Heading>
      <RangePicker value={range} options={RANGE_OPTIONS} onChange={setRange} />

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>Winpercentage per week</Label>
          <RangePicker value={winMode} options={MODE_OPTIONS} onChange={setWinMode} />
        </div>
        {win.some((w) => w.played > 0) ? (
          <LineChart label={`Winpercentage per week, ${winMode === 'all' ? 'alle modi' : winMode}`} min={0} max={100} reference={50}
            points={win.map((w) => ({ x: weekLabel(w.week), y: w.winRate, tip: `week van ${weekLabel(w.week)} · ${w.winRate}% · ${w.played} games` }))} />
        ) : <Empty text="Speel een paar wedstrijden om je winpercentage per week te zien." />}
        <p className="text-xs text-muted">Stippellijn = 50%. Weken zonder games laten een gat.</p>
      </Card>

      <Card className="space-y-3">
        <Label>Games en speeltijd per week</Label>
        {volume.some((v) => v.games > 0 || v.playedMs > 0) ? (
          <BarChart label="Aantal games per week" colors={['blue']} highlightLast
            bars={volume.map((v) => ({ x: weekLabel(v.week), values: [v.games], tip: `week van ${weekLabel(v.week)} · ${v.games} games · ${formatDuration(v.playedMs)}` }))} />
        ) : <Empty text="Speel een sessie om je games per week te zien." />}
        <p className="text-sm text-muted">Deze week: <span className="text-ink">{thisWeek?.games ?? 0} games · {formatDuration(thisWeek?.playedMs ?? 0)}</span></p>
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>Rank-verloop</Label>
          <RangePicker value={rankMode} options={MODE_ONLY} onChange={setRankMode} />
        </div>
        {useMmr ? (
          <LineChart label={`MMR-verloop ${rankMode}`} color="orange" min={mmrMin} max={mmrMax}
            points={ranks.mmr.map((p) => ({ x: fmtDay(p.at), y: p.mmr, tip: `${fmtDay(p.at)} · ${p.mmr} MMR` }))} />
        ) : ranks.steps.length ? (
          <LineChart label={`Rank-verloop ${rankMode}`} color="orange" step min={rankMin} max={rankMax}
            points={ranks.steps.map((p) => ({ x: fmtDay(p.at), y: p.index, tip: `${fmtDay(p.at)} · ${p.label}` }))} />
        ) : <Empty text="Stel je rank in bij Profile, dan zie je hier je verloop." />}
        {ranks.steps.length > 0 && (
          <p className="text-sm text-muted">{ranks.steps[0].label} → <span className="text-ink">{ranks.steps.at(-1)!.label}</span></p>
        )}
      </Card>

      <Card className="flex items-center gap-5">
        <BoostMeter value={t.winRate} size={104} label="win%" />
        <div className="grid flex-1 grid-cols-2 gap-3">
          <div><Label>Games</Label><Heading className="mt-1 text-3xl">{t.played}</Heading></div>
          <div><Label>Sessies</Label><Heading className="mt-1 text-3xl">{t.sessions}</Heading></div>
          <div className="col-span-2"><Label>Totale speeltijd</Label><Heading className="mt-1 text-2xl">{formatDuration(t.playedMs)}</Heading></div>
        </div>
      </Card>
      <Card className="space-y-3">
        <Label>Per gamemode (altijd)</Label>
        {MODES.map((m) => {
          const c = t.perMode[m]
          return (
            <div key={m} className="flex items-center gap-3">
              <span className="w-9 font-display text-lg font-bold italic">{m}</span>
              <WinLossBar wins={c.wins} losses={c.losses} className="flex-1" />
              <span className="w-24 text-right text-sm"><span className="text-blue-text">{c.wins}</span>–<span className="text-orange-text">{c.losses}</span> · {c.winRate === null ? '–' : `${c.winRate}%`}</span>
            </div>
          )
        })}
      </Card>
    </>
  )
}
