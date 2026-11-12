import { applyOp, type Op, type Store } from '../lib/store'
import type { Goal, GoalConfig } from '../lib/goals'
import type { ActivityKind, Mode, Profile, RankEntry, Result } from '../lib/types'

export interface ProfileRow { id: string; name: string; ranks: unknown; ask_mmr: boolean | null; idle_minutes: number | null; last_mode: string | null; custom_activities: unknown; created_at?: number | null }
export interface SessionRow { id: string; user_id: string; started_at: number; ended_at: number | null; last_activity_at: number }
export interface MatchRow { id: string; user_id: string; session_id: string; mode: string; result: string; rank: string | null; mmr: number | null; played_at: number }
export interface ActivityRow { id: string; user_id: string; session_id: string; kind: string; type: string; started_at: number; ended_at: number | null; note: string | null }

export interface GoalRow { id: string; user_id: string; kind: string; config: unknown; created_at: number; achieved_at: number | null; archived_at: number | null }

export type Table = 'profiles' | 'sessions' | 'matches' | 'activities' | 'goals'
export type Request = { table: Table; kind: 'upsert'; row: Record<string, unknown> } | { table: Table; kind: 'delete'; id: string }

const num = (v: number | string | null | undefined) => (v === null || v === undefined ? undefined : Number(v))

function toProfile(r: ProfileRow): Profile {
  const custom = (r.custom_activities ?? {}) as Partial<Record<ActivityKind, string[]>>
  return {
    id: r.id,
    name: r.name,
    ranks: (r.ranks ?? {}) as Partial<Record<Mode, RankEntry>>,
    askMmr: r.ask_mmr ?? false,
    idleMinutes: r.idle_minutes ?? 45,
    lastMode: (r.last_mode as Mode | null) ?? '2v2',
    customActivities: { warmup: custom.warmup ?? [], training: custom.training ?? [] },
  }
}

function toGoal(r: GoalRow): Goal {
  const g: Goal = { id: r.id, createdAt: Number(r.created_at), config: r.config as GoalConfig }
  if (r.achieved_at !== null) g.achievedAt = Number(r.achieved_at)
  if (r.archived_at !== null) g.archivedAt = Number(r.archived_at)
  return g
}

export function rowsToStore(profiles: ProfileRow[], sessions: SessionRow[], matches: MatchRow[], activities: ActivityRow[], goals: GoalRow[] = []): Store {
  let st: Store = { profile: profiles[0] ? toProfile(profiles[0]) : undefined, sessions: [], goals: [] }
  for (const g of goals) st = applyOp(st, { t: 'goal', row: toGoal(g) })
  for (const s of sessions) st = applyOp(st, { t: 'session', row: { id: s.id, startedAt: Number(s.started_at), endedAt: num(s.ended_at), lastActivityAt: Number(s.last_activity_at) } })
  for (const x of matches) {
    const row = { id: x.id, mode: x.mode as Mode, result: x.result as Result, playedAt: Number(x.played_at), ...(x.rank ? { rank: x.rank } : {}), ...(x.mmr !== null ? { mmr: Number(x.mmr) } : {}) }
    st = applyOp(st, { t: 'match', sessionId: x.session_id, row })
  }
  for (const a of activities) {
    const row = { id: a.id, kind: a.kind as ActivityKind, type: a.type, startedAt: Number(a.started_at), ...(a.ended_at !== null ? { endedAt: Number(a.ended_at) } : {}), ...(a.note ? { note: a.note } : {}) }
    st = applyOp(st, { t: 'activity', sessionId: a.session_id, row })
  }
  return st
}

export function opToRequest(op: Op, userId: string): Request {
  switch (op.t) {
    case 'session':
      return { table: 'sessions', kind: 'upsert', row: { id: op.row.id, user_id: userId, started_at: op.row.startedAt, ended_at: op.row.endedAt ?? null, last_activity_at: op.row.lastActivityAt } }
    case 'match':
      return { table: 'matches', kind: 'upsert', row: { id: op.row.id, user_id: userId, session_id: op.sessionId, mode: op.row.mode, result: op.row.result, rank: op.row.rank ?? null, mmr: op.row.mmr ?? null, played_at: op.row.playedAt } }
    case 'activity':
      return { table: 'activities', kind: 'upsert', row: { id: op.row.id, user_id: userId, session_id: op.sessionId, kind: op.row.kind, type: op.row.type, started_at: op.row.startedAt, ended_at: op.row.endedAt ?? null, note: op.row.note ?? null } }
    case 'profile':
      return { table: 'profiles', kind: 'upsert', row: { id: op.row.id, name: op.row.name, ranks: op.row.ranks, ask_mmr: op.row.askMmr, idle_minutes: op.row.idleMinutes, last_mode: op.row.lastMode, custom_activities: op.row.customActivities } }
    case 'delMatch': return { table: 'matches', kind: 'delete', id: op.id }
    case 'delActivity': return { table: 'activities', kind: 'delete', id: op.id }
    case 'delSession': return { table: 'sessions', kind: 'delete', id: op.id }
    case 'goal':
      return { table: 'goals', kind: 'upsert', row: { id: op.row.id, user_id: userId, kind: op.row.config.kind, config: op.row.config, created_at: op.row.createdAt, achieved_at: op.row.achievedAt ?? null, archived_at: op.row.archivedAt ?? null } }
    case 'delGoal': return { table: 'goals', kind: 'delete', id: op.id }
  }
}
