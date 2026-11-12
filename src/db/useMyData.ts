import { useMemo } from 'react'
import { activeSession } from '../lib/session'
import type { Profile, Session } from '../lib/types'
import { makeActions, type Actions } from './actions'
import { useAuth } from './auth'
import { useSync } from './sync'

export interface MyData {
  isLoading: boolean
  error?: string
  user?: { id: string; email: string }
  profile?: Profile
  sessions: Session[]
  active?: Session
  actions?: Actions
  pending: number
  dropped: number
  online: boolean
}

export function useMyData(): MyData {
  const auth = useAuth()
  const sync = useSync(auth.user?.id)
  const userId = auth.user?.id
  const actions = useMemo(() => (userId ? makeActions(sync.dispatch, sync.getStore, userId) : undefined), [userId, sync.dispatch, sync.getStore])
  const base = { pending: sync.pending, dropped: sync.dropped, online: sync.online, sessions: sync.store.sessions }
  if (auth.loading) return { ...base, isLoading: true }
  if (!auth.user) return { ...base, isLoading: false }
  if (!sync.loaded) return { ...base, isLoading: true, user: auth.user }
  return { ...base, isLoading: false, error: sync.error, user: auth.user, profile: sync.store.profile, active: activeSession(sync.store.sessions), actions }
}
