import type { Activity, ActivityKind, Match, Mode, Profile, RankEntry, Result, Session } from '../lib/types'

type Nullable<T> = { [K in keyof T]?: T[K] | null }

export interface RawMatch extends Nullable<Omit<Match, 'id' | 'mode' | 'result' | 'playedAt'>> { id: string; mode: string; result: string; playedAt: number }
export interface RawActivity extends Nullable<Omit<Activity, 'id' | 'kind' | 'type' | 'startedAt'>> { id: string; kind: string; type: string; startedAt: number }
export interface RawSession { id: string; startedAt: number; endedAt?: number | null; lastActivityAt?: number | null; matches?: RawMatch[]; activities?: RawActivity[] }
export interface RawProfile { id: string; name: string; ranks?: unknown; askMmr?: boolean | null; idleMinutes?: number | null; lastMode?: string | null; customActivities?: unknown }

const opt = <T,>(v: T | null | undefined): T | undefined => (v === null || v === undefined ? undefined : v)

function toMatch(r: RawMatch): Match {
  const x: Match = { id: r.id, mode: r.mode as Mode, result: r.result as Result, playedAt: r.playedAt }
  if (opt(r.rank) !== undefined) x.rank = r.rank!
  if (opt(r.mmr) !== undefined) x.mmr = r.mmr!
  return x
}

function toActivity(r: RawActivity): Activity {
  const x: Activity = { id: r.id, kind: r.kind as ActivityKind, type: r.type, startedAt: r.startedAt }
  if (opt(r.endedAt) !== undefined) x.endedAt = r.endedAt!
  if (opt(r.note)) x.note = r.note!
  return x
}

export function toSession(r: RawSession): Session {
  return {
    id: r.id,
    startedAt: r.startedAt,
    endedAt: opt(r.endedAt),
    lastActivityAt: r.lastActivityAt ?? r.startedAt,
    matches: (r.matches ?? []).map(toMatch).sort((a, b) => a.playedAt - b.playedAt),
    activities: (r.activities ?? []).map(toActivity).sort((a, b) => a.startedAt - b.startedAt),
  }
}

export function toProfile(r: RawProfile): Profile {
  const custom = (r.customActivities ?? {}) as Partial<Record<ActivityKind, string[]>>
  return {
    id: r.id,
    name: r.name,
    ranks: (r.ranks ?? {}) as Partial<Record<Mode, RankEntry>>,
    askMmr: r.askMmr ?? false,
    idleMinutes: r.idleMinutes ?? 45,
    lastMode: (r.lastMode as Mode | null) ?? '2v2',
    customActivities: { warmup: custom.warmup ?? [], training: custom.training ?? [] },
  }
}
