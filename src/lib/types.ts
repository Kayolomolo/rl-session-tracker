export type Mode = '1v1' | '2v2' | '3v3'
export const MODES: Mode[] = ['1v1', '2v2', '3v3']
export type Result = 'win' | 'loss'
export type ActivityKind = 'warmup' | 'training'

export interface Match { id: string; mode: Mode; result: Result; playedAt: number; rank?: string; mmr?: number }
export interface Activity { id: string; kind: ActivityKind; type: string; startedAt: number; endedAt?: number; note?: string }
export interface Session { id: string; startedAt: number; endedAt?: number; lastActivityAt: number; matches: Match[]; activities: Activity[] }
export interface RankEntry { tier: string; division?: number; mmr?: number }
export interface Profile {
  id: string
  name: string
  ranks: Partial<Record<Mode, RankEntry>>
  askMmr: boolean
  idleMinutes: number
  lastMode: Mode
  customActivities: Record<ActivityKind, string[]>
  /** undefined = nooit ingesteld (kolom niet meesturen), null = leeggemaakt */
  tracker?: TrackerProfile | null
}

export interface TrackerProfile { platform: 'epic' | 'steam'; id: string }
