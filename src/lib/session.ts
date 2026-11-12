import { rankLabel } from './ranks'
import type { Op } from './store'
import type { Activity, Match, Mode, Profile, Result, Session } from './types'

export function activeSession(sessions: Session[]): Session | undefined {
  return sessions.filter((s) => s.endedAt === undefined).sort((a, b) => b.startedAt - a.startedAt)[0]
}

export function runningActivity(s: Session): Activity | undefined {
  return s.activities.find((a) => a.endedAt === undefined)
}

export function lastActivityAt(s: Session): number {
  return Math.max(
    s.startedAt,
    s.lastActivityAt,
    ...s.matches.map((x) => x.playedAt),
    ...s.activities.flatMap((a) => (a.endedAt === undefined ? [a.startedAt] : [a.startedAt, a.endedAt])),
  )
}

export function isIdle(s: Session, now: number, idleMinutes: number): boolean {
  return now - lastActivityAt(s) >= idleMinutes * 60_000
}

export function suggestActivityMinutes(a: Activity, now: number, idleMinutes: number): number {
  const elapsed = Math.round((now - a.startedAt) / 60_000)
  return Math.max(1, Math.min(elapsed, idleMinutes))
}

export function resolveIdleEnd(s: Session, activityMinutes?: number): { sessionEndedAt: number; activityEndedAt?: number } {
  const last = lastActivityAt(s)
  const running = runningActivity(s)
  if (!running) return { sessionEndedAt: last }
  const activityEndedAt = activityMinutes === undefined ? running.startedAt : running.startedAt + activityMinutes * 60_000
  return { sessionEndedAt: Math.max(last, activityEndedAt), activityEndedAt }
}

export function matchFields(profile: Profile, mode: Mode, result: Result, now: number): Omit<Match, 'id'> {
  const entry = profile.ranks[mode]
  const fields: Omit<Match, 'id'> = { mode, result, playedAt: now }
  if (entry && entry.tier !== 'Unranked') fields.rank = rankLabel(entry)
  return fields
}

/** Twee apparaten die tegelijk een sessie starten laten een oudere open sessie achter: sluit die op zijn laatste activiteit. */
export function closeStaleSessions(sessions: Session[]): Op[] {
  const open = sessions.filter((s) => s.endedAt === undefined).sort((a, b) => b.startedAt - a.startedAt)
  return open.slice(1).flatMap((s): Op[] => {
    const end = lastActivityAt(s)
    const running = runningActivity(s)
    return [
      ...(running ? [{ t: 'activity' as const, sessionId: s.id, row: { ...running, endedAt: Math.max(running.startedAt, end) } }] : []),
      { t: 'session', row: { id: s.id, startedAt: s.startedAt, endedAt: end, lastActivityAt: s.lastActivityAt } },
    ]
  })
}
