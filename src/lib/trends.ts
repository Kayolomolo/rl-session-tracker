import { activityMs, counts, sessionMs } from './stats'
import { rankIndex } from './ranks'
import { startOfWeek } from './time'
import type { ActivityKind, Mode, Session } from './types'

export type Range = 4 | 12 | 'all'

const shift = (week: number, n: number) => { const d = new Date(week); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7 * n).getTime() }

export function weekStarts(now: number, range: Range, firstAt?: number): number[] {
  const current = startOfWeek(now)
  let count: number = range === 'all' ? 4 : range
  if (range === 'all' && firstAt !== undefined) {
    const first = startOfWeek(firstAt)
    let n = 1
    while (shift(first, n) <= current) n++
    count = Math.max(4, n)
  }
  return Array.from({ length: count }, (_, i) => shift(current, i - count + 1))
}

function bucket<T>(weeks: number[], make: (week: number) => T) {
  const map = new Map(weeks.map((w) => [w, make(w)]))
  return { at: (ts: number) => map.get(startOfWeek(ts)), list: () => weeks.map((w) => map.get(w)!) }
}

export interface WeekWin { week: number; played: number; wins: number; winRate: number | null }

export function weeklyWinRate(sessions: Session[], weeks: number[], mode?: Mode): WeekWin[] {
  const b = bucket(weeks, () => [] as Session['matches'])
  for (const x of sessions.flatMap((s) => s.matches)) if (!mode || x.mode === mode) b.at(x.playedAt)?.push(x)
  return weeks.map((week, i) => { const c = counts(b.list()[i]); return { week, played: c.played, wins: c.wins, winRate: c.winRate } })
}

export function weeklyVolume(sessions: Session[], weeks: number[], now: number): { week: number; games: number; playedMs: number }[] {
  const b = bucket(weeks, (week) => ({ week, games: 0, playedMs: 0 }))
  for (const s of sessions) {
    const w = b.at(s.startedAt)
    if (w) w.playedMs += sessionMs(s, now)
    for (const x of s.matches) { const g = b.at(x.playedAt); if (g) g.games++ }
  }
  return b.list()
}

export function weeklyTraining(sessions: Session[], weeks: number[], now: number): { week: number; warmupMs: number; trainingMs: number }[] {
  const b = bucket(weeks, (week) => ({ week, warmupMs: 0, trainingMs: 0 }))
  for (const a of sessions.flatMap((s) => s.activities)) {
    const w = b.at(a.startedAt)
    if (!w) continue
    if (a.kind === 'warmup') w.warmupMs += activityMs(a, now)
    else w.trainingMs += activityMs(a, now)
  }
  return b.list()
}

export interface NoteItem { id: string; kind: ActivityKind; type: string; at: number; note: string }

export function notesList(sessions: Session[], type?: string): NoteItem[] {
  return sessions
    .flatMap((s) => s.activities)
    .filter((a) => a.note && (!type || a.type === type))
    .map((a) => ({ id: a.id, kind: a.kind, type: a.type, at: a.startedAt, note: a.note! }))
    .sort((a, b) => b.at - a.at)
}

export interface RankHistory { steps: { at: number; index: number; label: string }[]; mmr: { at: number; mmr: number }[] }

export function rankHistory(sessions: Session[], mode: Mode, since?: number): RankHistory {
  const matches = sessions
    .flatMap((s) => s.matches)
    .filter((x) => x.mode === mode && (since === undefined || x.playedAt >= since))
    .sort((a, b) => a.playedAt - b.playedAt)
  const steps: RankHistory['steps'] = []
  let last: RankHistory['steps'][number] | undefined
  for (const x of matches) {
    const index = x.rank ? rankIndex(x.rank) : null
    if (index === null || !x.rank) continue
    last = { at: x.playedAt, index, label: x.rank }
    if (steps.at(-1)?.index !== index) steps.push(last)
  }
  if (last && steps.at(-1) !== last) steps.push(last)
  const mmr = matches.filter((x) => x.mmr !== undefined).map((x) => ({ at: x.playedAt, mmr: x.mmr! }))
  return { steps, mmr }
}

/** Een gekozen notitiefilter vervalt zodra die activiteit geen notities meer heeft. */
export function activeNoteFilter(filter: string | null, types: string[]): string | null {
  return filter && types.includes(filter) ? filter : null
}
