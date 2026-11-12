import { dayKey, durationMs } from './time'
import { MODES, type Activity, type ActivityKind, type Match, type Mode, type Session } from './types'

export interface Counts { played: number; wins: number; losses: number; winRate: number | null }
export interface SessionSummary extends Counts {
  durationMs: number
  perMode: Record<Mode, Counts>
  warmupMs: number
  trainingMs: number
  totalTrainingMs: number
  otherMs: number
}

export function counts(matches: Match[]): Counts {
  const wins = matches.filter((x) => x.result === 'win').length
  const played = matches.length
  return { played, wins, losses: played - wins, winRate: played ? Math.round((wins / played) * 100) : null }
}

export function perMode(matches: Match[]): Record<Mode, Counts> {
  return Object.fromEntries(MODES.map((mode) => [mode, counts(matches.filter((x) => x.mode === mode))])) as Record<Mode, Counts>
}

export function activityMs(a: Activity, now: number): number {
  return durationMs(a.startedAt, a.endedAt ?? now)
}

const kindMs = (s: Session, kind: ActivityKind, now: number) =>
  s.activities.filter((a) => a.kind === kind).reduce((sum, a) => sum + activityMs(a, now), 0)

export function sessionMs(s: Session, now: number): number {
  return durationMs(s.startedAt, s.endedAt ?? now)
}

export function summarizeSession(s: Session, now: number): SessionSummary {
  const total = sessionMs(s, now)
  const warmupMs = kindMs(s, 'warmup', now)
  const trainingMs = kindMs(s, 'training', now)
  const totalTrainingMs = warmupMs + trainingMs
  return {
    ...counts(s.matches),
    durationMs: total,
    perMode: perMode(s.matches),
    warmupMs,
    trainingMs,
    totalTrainingMs,
    otherMs: Math.max(0, total - totalTrainingMs),
  }
}

const allMatches = (sessions: Session[]) => sessions.flatMap((s) => s.matches)

export function todayCounts(sessions: Session[], now: number): Counts {
  const today = dayKey(now)
  return counts(allMatches(sessions).filter((x) => dayKey(x.playedAt) === today))
}

export function totals(sessions: Session[], now: number): Counts & { sessions: number; playedMs: number; perMode: Record<Mode, Counts> } {
  const matches = allMatches(sessions)
  return {
    ...counts(matches),
    sessions: sessions.length,
    playedMs: sessions.reduce((sum, s) => sum + sessionMs(s, now), 0),
    perMode: perMode(matches),
  }
}

export function activityTotals(sessions: Session[], kind: ActivityKind, now: number, since?: number): { type: string; ms: number }[] {
  const byType = new Map<string, number>()
  for (const a of sessions.flatMap((s) => s.activities)) {
    if (a.kind !== kind || (since !== undefined && a.startedAt < since)) continue
    byType.set(a.type, (byType.get(a.type) ?? 0) + activityMs(a, now))
  }
  return [...byType].map(([type, ms]) => ({ type, ms })).sort((x, y) => y.ms - x.ms)
}
