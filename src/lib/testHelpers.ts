import type { Activity, ActivityKind, Match, Mode, Profile, Result, Session } from './types'

export const MIN = 60_000
let n = 0
export const m = (mode: Mode, result: Result, playedAt: number): Match => ({ id: `m${n++}`, mode, result, playedAt })
export const act = (kind: ActivityKind, type: string, startedAt: number, endedAt?: number): Activity =>
  ({ id: `a${n++}`, kind, type, startedAt, ...(endedAt !== undefined ? { endedAt } : {}) })
export const sess = (p: Partial<Session>): Session =>
  ({ id: `s${n++}`, startedAt: 0, lastActivityAt: p.startedAt ?? 0, matches: [], activities: [], ...p })
export const profile = (p: Partial<Profile>): Profile => ({
  id: 'p', name: 'Kay', ranks: {}, askMmr: false, idleMinutes: 45, lastMode: '2v2',
  customActivities: { warmup: [], training: [] }, ...p,
})
