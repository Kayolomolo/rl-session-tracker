import { DEFAULT_ACTIVITIES } from './activities'
import { rankIndex, rankLabel } from './ranks'
import { activityMs, counts } from './stats'
import { startOfMonth, startOfWeek } from './time'
import type { Activity, Mode, Profile, Session } from './types'

export type GoalTarget = { kind: 'activity'; type: string } | { kind: 'warmup' } | { kind: 'training' }
export type GoalConfig =
  | { kind: 'training'; target: GoalTarget; count: 'minutes' | 'times'; minutes: number; times?: number }
  | { kind: 'winrate'; mode: Mode; percent: number; period: 'week' | 'month'; minGames: number }
  | { kind: 'rank'; mode: Mode; tier: string; division?: number }
  | { kind: 'mmr'; mode: Mode; mmr: number }
export interface Goal { id: string; config: GoalConfig; createdAt: number; achievedAt?: number; archivedAt?: number }
export interface GoalProgress { current: number; target: number; ratio: number; label: string; done: boolean; needMore?: number }

export const MAX_ACTIVE_GOALS = 8
const MIN = 60_000

const nextWeek = (week: number) => { const d = new Date(week); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7).getTime() }
const prevWeek = (week: number) => { const d = new Date(week); return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7).getTime() }
const ratio = (cur: number, target: number) => (target > 0 ? Math.max(0, Math.min(1, cur / target)) : 0)

export function targetName(t: GoalTarget): string {
  return t.kind === 'activity' ? t.type : t.kind === 'warmup' ? 'Warm-up' : 'Training'
}

const matchesTarget = (a: Activity, t: GoalTarget) => (t.kind === 'activity' ? a.type === t.type : a.kind === t.kind)

function trainingCount(c: Extract<GoalConfig, { kind: 'training' }>, sessions: Session[], from: number, to: number, now: number): number {
  const acts = sessions.flatMap((s) => s.activities).filter((a) => a.startedAt >= from && a.startedAt < to && matchesTarget(a, c.target))
  if (c.count === 'minutes') return Math.floor(acts.reduce((sum, a) => sum + activityMs(a, now), 0) / MIN)
  return acts.filter((a) => activityMs(a, now) >= c.minutes * MIN).length
}

function winrateIn(c: Extract<GoalConfig, { kind: 'winrate' }>, sessions: Session[], from: number, to: number) {
  return counts(sessions.flatMap((s) => s.matches).filter((x) => x.mode === c.mode && x.playedAt >= from && x.playedAt < to))
}

export function currentMmr(sessions: Session[], profile: Profile, mode: Mode): number | undefined {
  const withMmr = sessions.flatMap((s) => s.matches).filter((x) => x.mode === mode && x.mmr !== undefined).sort((a, b) => b.playedAt - a.playedAt)
  return withMmr[0]?.mmr ?? profile.ranks[mode]?.mmr
}

export function goalProgress(goal: Goal, sessions: Session[], profile: Profile, now: number): GoalProgress {
  const c = goal.config
  switch (c.kind) {
    case 'training': {
      const week = startOfWeek(now)
      const current = trainingCount(c, sessions, week, nextWeek(week), now)
      const target = c.count === 'minutes' ? c.minutes : c.times ?? 1
      const unit = c.count === 'minutes' ? 'min' : 'keer'
      return { current, target, ratio: ratio(current, target), done: current >= target, label: `${targetName(c.target)} · ${current} van ${target} ${unit}` }
    }
    case 'winrate': {
      const from = c.period === 'week' ? startOfWeek(now) : startOfMonth(now)
      const r = winrateIn(c, sessions, from, Infinity)
      if (r.played < c.minGames) {
        const needMore = c.minGames - r.played
        return { current: r.winRate ?? 0, target: c.percent, ratio: ratio(r.played, c.minGames), done: false, needMore, label: `${c.mode} · nog ${needMore} ${needMore === 1 ? 'game' : 'games'} nodig` }
      }
      const current = r.winRate ?? 0
      return { current, target: c.percent, ratio: ratio(current, c.percent), done: current >= c.percent, label: `${c.mode} · ${current}% van ${c.percent}% · ${r.played} games` }
    }
    case 'rank': {
      const target = rankIndex(rankLabel({ tier: c.tier, division: c.division ?? 1 })) ?? 0
      const entry = profile.ranks[c.mode]
      const current = entry ? rankIndex(rankLabel(entry)) : null
      if (current === null) return { current: 0, target, ratio: 0, done: false, label: `${c.mode} · Stel je rank in bij Profile` }
      const left = target - current
      const done = left <= 0
      return { current, target, ratio: ratio(current + 1, target + 1), done, label: done ? `${c.mode} · Gehaald` : `${c.mode} · nog ${left} ${left === 1 ? 'divisie' : 'divisies'}` }
    }
    case 'mmr': {
      const current = currentMmr(sessions, profile, c.mode)
      if (current === undefined) return { current: 0, target: c.mmr, ratio: 0, done: false, label: `${c.mode} · Vul je MMR in` }
      const done = current >= c.mmr
      return { current, target: c.mmr, ratio: ratio(current, c.mmr), done, label: done ? `${c.mode} · Gehaald` : `${c.mode} · ${current} van ${c.mmr} MMR` }
    }
  }
}

/** Gehaald ja/nee voor de 4 weken vóór deze week (oud → nieuw); alleen voor weekdoelen. */
export function weekHistory(goal: Goal, sessions: Session[], now: number): boolean[] | null {
  const c = goal.config
  if (c.kind !== 'training' && !(c.kind === 'winrate' && c.period === 'week')) return null
  const weeks: number[] = []
  let w = startOfWeek(now)
  for (let i = 0; i < 4; i++) { w = prevWeek(w); weeks.unshift(w) }
  return weeks.map((week) => {
    const end = nextWeek(week)
    if (c.kind === 'training') return trainingCount(c, sessions, week, end, end) >= (c.count === 'minutes' ? c.minutes : c.times ?? 1)
    const r = winrateIn(c, sessions, week, end)
    return r.played >= c.minGames && (r.winRate ?? 0) >= c.percent
  })
}

const between = (v: number | undefined, lo: number, hi: number) => v !== undefined && Number.isFinite(v) && v >= lo && v <= hi

export function validateGoal(c: GoalConfig): string | null {
  switch (c.kind) {
    case 'training':
      if (c.target.kind === 'activity' && !c.target.type.trim()) return 'Kies een activiteit.'
      if (!between(c.minutes, 5, 600)) return 'Kies tussen 5 en 600 minuten.'
      if (c.count === 'times' && !between(c.times, 1, 14)) return 'Kies 1 tot 14 keer.'
      return null
    case 'winrate':
      if (!between(c.percent, 1, 100)) return 'Kies een percentage van 1 tot 100.'
      if (!between(c.minGames, 1, 100)) return 'Kies 1 tot 100 games.'
      return null
    case 'rank':
      return rankIndex(rankLabel({ tier: c.tier, division: c.division ?? 1 })) === null ? 'Kies een rank.' : null
    case 'mmr':
      return between(c.mmr, 1, 3000) ? null : 'Kies een MMR van 1 tot 3000.'
  }
}

export function goalTitle(c: GoalConfig): string {
  switch (c.kind) {
    case 'training':
      return c.count === 'minutes' ? `${targetName(c.target)} · ${c.minutes} min per week` : `${targetName(c.target)} · ${c.times}× ${c.minutes} min per week`
    case 'winrate':
      return `${c.mode} · ${c.percent}% winst ${c.period === 'week' ? 'deze week' : 'deze maand'}`
    case 'rank':
      return `${c.mode} · ${rankLabel({ tier: c.tier, division: c.division })}`
    case 'mmr':
      return `${c.mode} · ${c.mmr} MMR`
  }
}

export const ALL_ACTIVITY_TYPES = [...DEFAULT_ACTIVITIES.warmup, ...DEFAULT_ACTIVITIES.training]
