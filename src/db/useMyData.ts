import { activeSession } from '../lib/session'
import type { Profile, Session } from '../lib/types'
import { db } from './client'
import { toProfile, toSession, type RawProfile, type RawSession } from './mappers'

export interface MyData {
  isLoading: boolean
  error?: string
  user?: { id: string; email: string }
  profile?: Profile
  sessions: Session[]
  active?: Session
}

export function useMyData(): MyData {
  const auth = db.useAuth()
  const q = db.useQuery(auth.user ? { profiles: {}, sessions: { matches: {}, activities: {} } } : null)
  if (auth.isLoading) return { isLoading: true, sessions: [] }
  if (auth.error) return { isLoading: false, error: auth.error.message, sessions: [] }
  if (!auth.user) return { isLoading: false, sessions: [] }
  const user = { id: auth.user.id, email: auth.user.email ?? '' }
  if (q.isLoading) return { isLoading: true, user, sessions: [] }
  if (q.error) return { isLoading: false, error: q.error.message, user, sessions: [] }
  const sessions = (q.data?.sessions ?? []).map((s) => toSession(s as unknown as RawSession)).sort((a, b) => b.startedAt - a.startedAt)
  const rawProfile = q.data?.profiles?.[0]
  return {
    isLoading: false,
    user,
    profile: rawProfile ? toProfile(rawProfile as unknown as RawProfile) : undefined,
    sessions,
    active: activeSession(sessions),
  }
}
