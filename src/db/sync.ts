import { useCallback, useEffect, useRef, useState } from 'react'
import { applyOp, isPermanentError, rebase, type Op, type Store } from '../lib/store'
import { opToRequest, rowsToStore, type ActivityRow, type MatchRow, type ProfileRow, type SessionRow } from './rows'
import { supabase } from './supabase'

interface Cache { store: Store; queue: Op[] }
const EMPTY: Store = { sessions: [] }
const keyFor = (userId: string) => `rl-tracker:${userId}`

function readCache(userId: string): Cache | undefined {
  try { const raw = localStorage.getItem(keyFor(userId)); return raw ? (JSON.parse(raw) as Cache) : undefined } catch { return undefined }
}
function writeCache(userId: string, c: Cache) {
  try { localStorage.setItem(keyFor(userId), JSON.stringify(c)) } catch { /* opslag vol of geblokkeerd: app werkt door */ }
}

export interface SyncState { store: Store; loaded: boolean; error?: string; pending: number; online: boolean; dispatch: (op: Op) => void; getStore: () => Store }

export function useSync(userId: string | undefined): SyncState {
  const [store, setStore] = useState<Store>(EMPTY)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(0)
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const queue = useRef<Op[]>([])
  const storeRef = useRef<Store>(EMPTY)
  const version = useRef(0)
  const flushing = useRef(false)

  const commit = useCallback((next: Store) => {
    storeRef.current = next
    setStore(next)
    setPending(queue.current.length)
    if (userId) writeCache(userId, { store: next, queue: queue.current })
  }, [userId])

  const refetch = useCallback(async () => {
    if (!userId) return
    const v = version.current
    const [p, s, m, a] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('sessions').select('*'),
      supabase.from('matches').select('*'),
      supabase.from('activities').select('*'),
    ])
    const err = p.error ?? s.error ?? m.error ?? a.error
    if (err) {
      if (!storeRef.current.profile && !readCache(userId)) setError('Geen verbinding met de database. Controleer je internet.')
      setLoaded(true)
      return
    }
    if (v !== version.current) return void refetch()
    setError(undefined)
    commit(rebase(rowsToStore(p.data as ProfileRow[], s.data as SessionRow[], m.data as MatchRow[], a.data as ActivityRow[]), queue.current))
    setLoaded(true)
  }, [userId, commit])

  const flush = useCallback(async () => {
    if (!userId || flushing.current) return
    flushing.current = true
    try {
      while (queue.current.length) {
        const req = opToRequest(queue.current[0], userId)
        const res = req.kind === 'upsert'
          ? await supabase.from(req.table).upsert(req.row)
          : await supabase.from(req.table).delete().eq('id', req.id)
        if (res.error && !isPermanentError({ code: res.error.code, status: res.status })) break
        if (res.error) console.warn('Wijziging overgeslagen', res.error)
        queue.current = queue.current.slice(1)
        commit(storeRef.current)
      }
    } finally {
      flushing.current = false
    }
  }, [userId, commit])

  const dispatch = useCallback((op: Op) => {
    version.current++
    queue.current = [...queue.current, op]
    commit(applyOp(storeRef.current, op))
    void flush()
  }, [commit, flush])

  useEffect(() => {
    if (!userId) return
    const cached = readCache(userId)
    queue.current = cached?.queue ?? []
    if (cached) { commit(cached.store); setLoaded(true) }
    void flush().then(refetch)

    let timer: ReturnType<typeof setTimeout> | undefined
    const soon = () => { clearTimeout(timer); timer = setTimeout(() => { if (!queue.current.length) void refetch() }, 400) }
    const channel = supabase.channel(`rl-${userId}`)
    for (const table of ['sessions', 'matches', 'activities']) channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` }, soon)
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, soon)
    channel.subscribe()

    const goOnline = () => { setOnline(true); void flush().then(refetch) }
    const goOffline = () => setOnline(false)
    const onVisible = () => { if (document.visibilityState === 'visible') void flush().then(refetch) }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      void supabase.removeChannel(channel)
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId, commit, flush, refetch])

  const getStore = useCallback(() => storeRef.current, [])
  return { store, loaded, error, pending, online, dispatch, getStore }
}
