import type { Activity, Match, Profile, Session } from './types'

export interface Store { profile?: Profile; sessions: Session[] }
export type SessionCore = Omit<Session, 'matches' | 'activities'>

export type Op =
  | { t: 'session'; row: SessionCore }
  | { t: 'match'; sessionId: string; row: Match }
  | { t: 'activity'; sessionId: string; row: Activity }
  | { t: 'profile'; row: Profile }
  | { t: 'delMatch' | 'delActivity' | 'delSession'; id: string }

const byTime = <T,>(key: keyof T) => (a: T, b: T) => (a[key] as number) - (b[key] as number)
const upsert = <T extends { id: string }>(list: T[], row: T) => [...list.filter((x) => x.id !== row.id), row]

function mapSession(store: Store, sessionId: string, fn: (s: Session) => Session): Store {
  if (!store.sessions.some((s) => s.id === sessionId)) return store
  return { ...store, sessions: store.sessions.map((s) => (s.id === sessionId ? fn(s) : s)) }
}

export function applyOp(store: Store, op: Op): Store {
  switch (op.t) {
    case 'session': {
      const old = store.sessions.find((s) => s.id === op.row.id)
      const next: Session = { matches: old?.matches ?? [], activities: old?.activities ?? [], ...op.row }
      return { ...store, sessions: upsert(store.sessions, next).sort((a, b) => b.startedAt - a.startedAt) }
    }
    case 'match':
      return mapSession(store, op.sessionId, (s) => ({ ...s, matches: upsert(s.matches, op.row).sort(byTime<Match>('playedAt')) }))
    case 'activity':
      return mapSession(store, op.sessionId, (s) => ({ ...s, activities: upsert(s.activities, op.row).sort(byTime<Activity>('startedAt')) }))
    case 'profile':
      return { ...store, profile: op.row }
    case 'delMatch':
      return { ...store, sessions: store.sessions.map((s) => ({ ...s, matches: s.matches.filter((x) => x.id !== op.id) })) }
    case 'delActivity':
      return { ...store, sessions: store.sessions.map((s) => ({ ...s, activities: s.activities.filter((x) => x.id !== op.id) })) }
    case 'delSession':
      return { ...store, sessions: store.sessions.filter((s) => s.id !== op.id) }
  }
}

export function rebase(server: Store, pending: Op[]): Store {
  return pending.reduce(applyOp, server)
}

const TRANSIENT_STATUS = new Set([401, 408, 429])
const PERMANENT_CODE = /^(23\w{3}|22\w{3}|42\w{3}|PGRST[12]\d\d)$/

/** Definitief = de server weigert het verzoek inhoudelijk; opnieuw proberen helpt niet. Bij twijfel: tijdelijk. */
export function isPermanentError(err: { code?: string; status?: number } | null): boolean {
  if (!err) return false
  const { status, code } = err
  if (status !== undefined && (status === 0 || status >= 500 || TRANSIENT_STATUS.has(status))) return false
  return !!code && PERMANENT_CODE.test(code)
}
