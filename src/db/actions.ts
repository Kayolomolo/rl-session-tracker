import { activeSession, runningActivity } from '../lib/session'
import type { Op, Store } from '../lib/store'
import type { Goal, GoalConfig } from '../lib/goals'
import type { Activity, ActivityKind, Match, Profile, Session } from '../lib/types'
import { profileWithMmr } from '../lib/mmr'

const uid = () => crypto.randomUUID()
const core = (s: Session) => ({ id: s.id, startedAt: s.startedAt, endedAt: s.endedAt, lastActivityAt: s.lastActivityAt })

export type Actions = ReturnType<typeof makeActions>

export function makeActions(dispatch: (op: Op) => void, getStore: () => Store, userId: string) {
  const stopRunning = (s: Session, at: number) => {
    const running = runningActivity(s)
    if (running) dispatch({ t: 'activity', sessionId: s.id, row: { ...running, endedAt: Math.max(running.startedAt, at) } })
  }
  return {
    createProfile(name: string) {
      dispatch({ t: 'profile', row: { id: userId, name: name.trim(), ranks: {}, askMmr: false, idleMinutes: 45, lastMode: '2v2', customActivities: { warmup: [], training: [] } } })
    },
    updateProfile(patch: Partial<Omit<Profile, 'id'>>) {
      const p = getStore().profile
      if (p) dispatch({ t: 'profile', row: { ...p, ...patch } })
    },
    startSession(): string {
      const existing = activeSession(getStore().sessions)
      if (existing) return existing.id
      const now = Date.now()
      const id = uid()
      dispatch({ t: 'session', row: { id, startedAt: now, lastActivityAt: now } })
      return id
    },
    endSession(s: Session, endedAt: number) {
      stopRunning(s, endedAt)
      dispatch({ t: 'session', row: { ...core(s), endedAt } })
    },
    snoozeIdle(s: Session, now: number) {
      dispatch({ t: 'session', row: { ...core(s), lastActivityAt: now } })
    },
    addMatch(sessionId: string, fields: Omit<Match, 'id'>): string {
      const id = uid()
      dispatch({ t: 'match', sessionId, row: { id, ...fields } })
      return id
    },
    setMatchMmr(sessionId: string, match: Match, mmr: number) {
      dispatch({ t: 'match', sessionId, row: { ...match, mmr } })
      const p = getStore().profile
      if (p) dispatch({ t: 'profile', row: profileWithMmr(p, match.mode, mmr) })
    },
    deleteMatch(id: string) { dispatch({ t: 'delMatch', id }) },
    startActivity(s: Session, kind: ActivityKind, type: string, now: number): string {
      stopRunning(s, now)
      const id = uid()
      dispatch({ t: 'activity', sessionId: s.id, row: { id, kind, type, startedAt: now } })
      return id
    },
    stopActivity(sessionId: string, a: Activity, endedAt: number, note?: string) {
      const clean = note?.trim()
      dispatch({ t: 'activity', sessionId, row: { ...a, endedAt: Math.max(a.startedAt, endedAt), ...(clean ? { note: clean } : {}) } })
    },
    deleteActivity(id: string) { dispatch({ t: 'delActivity', id }) },
    deleteSession(s: Session) { dispatch({ t: 'delSession', id: s.id }) },
    saveGoal(config: GoalConfig, existing?: Goal): string {
      const id = existing?.id ?? uid()
      const configChanged = existing && JSON.stringify(existing.config) !== JSON.stringify(config)
      const row: Goal = { id, config, createdAt: existing?.createdAt ?? Date.now(), ...(existing?.archivedAt ? { archivedAt: existing.archivedAt } : {}), ...(existing?.achievedAt && !configChanged ? { achievedAt: existing.achievedAt } : {}) }
      dispatch({ t: 'goal', row })
      return id
    },
    deleteGoal(id: string) { dispatch({ t: 'delGoal', id }) },
    archiveGoal(goal: Goal) { dispatch({ t: 'goal', row: { ...goal, archivedAt: Date.now() } }) },
    markAchieved(goal: Goal, at: number) { dispatch({ t: 'goal', row: { ...goal, achievedAt: at } }) },
  }
}
