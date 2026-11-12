import { useCallback, useEffect, useRef, useState } from 'react'
import type { Op, Store } from '../lib/store'
import { createSyncEngine, type Cache, type EngineState, type SyncEngine, type Transport } from './engine'
import { fetchAllRows } from './paging'
import { opToRequest, rowsToStore, type ActivityRow, type MatchRow, type ProfileRow, type SessionRow } from './rows'
import { supabase } from './supabase'

const keyFor = (userId: string) => `rl-tracker:${userId}`

function storageFor(userId: string) {
  return {
    read(): Cache | undefined {
      try { const raw = localStorage.getItem(keyFor(userId)); return raw ? (JSON.parse(raw) as Cache) : undefined } catch { return undefined }
    },
    write(c: Cache) {
      try { localStorage.setItem(keyFor(userId), JSON.stringify(c)) } catch { /* opslag vol of geblokkeerd: app werkt door */ }
    },
  }
}

function transportFor(userId: string): Transport {
  const all = <T,>(table: string) => fetchAllRows<T>((from, to) => supabase.from(table).select('*').order('id').range(from, to))
  return {
    async fetchAll() {
      const [p, s, m, a] = await Promise.all([all<ProfileRow>('profiles'), all<SessionRow>('sessions'), all<MatchRow>('matches'), all<ActivityRow>('activities')])
      return rowsToStore(p, s, m, a)
    },
    async send(op) {
      const req = opToRequest(op, userId)
      const res = req.kind === 'upsert'
        ? await supabase.from(req.table).upsert(req.row)
        : await supabase.from(req.table).delete().eq('id', req.id)
      return { error: res.error ? { code: res.error.code, status: res.status } : null }
    },
  }
}

const INITIAL: EngineState = { store: { sessions: [] }, loaded: false, pending: 0, dropped: 0 }

export interface SyncState extends EngineState { online: boolean; dispatch: (op: Op) => void; getStore: () => Store }

export function useSync(userId: string | undefined): SyncState {
  const [state, setState] = useState<EngineState>(INITIAL)
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const engine = useRef<SyncEngine | null>(null)

  useEffect(() => {
    setState(INITIAL)
    if (!userId) return
    const e = createSyncEngine(transportFor(userId), storageFor(userId), setState)
    engine.current = e
    setState(e.state())
    void e.sync()

    let timer: ReturnType<typeof setTimeout> | undefined
    const soon = () => { clearTimeout(timer); timer = setTimeout(() => void e.sync(), 400) }
    const channel = supabase.channel(`rl-${userId}-${crypto.randomUUID()}`)
    for (const table of ['sessions', 'matches', 'activities']) channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` }, soon)
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, soon)
    channel.subscribe()

    const goOnline = () => { setOnline(true); void e.sync() }
    const goOffline = () => setOnline(false)
    const onVisible = () => { if (document.visibilityState === 'visible') void e.sync() }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      e.dispose()
      if (engine.current === e) engine.current = null
      clearTimeout(timer)
      void supabase.removeChannel(channel)
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId])

  const dispatch = useCallback((op: Op) => engine.current?.dispatch(op), [])
  const getStore = useCallback(() => engine.current?.getStore() ?? INITIAL.store, [])
  return { ...state, online, dispatch, getStore }
}
