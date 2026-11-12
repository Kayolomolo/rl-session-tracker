import { closeStaleSessions } from '../lib/session'
import { applyOp, isPermanentError, rebase, type Op, type Store } from '../lib/store'

export interface Cache { store: Store; queue: Op[] }
export interface Storage { read(): Cache | undefined; write(c: Cache): void }
export interface Transport {
  fetchAll(): Promise<Store>
  send(op: Op): Promise<{ error: { code?: string; status?: number } | null }>
}
export interface EngineState { store: Store; loaded: boolean; error?: string; pending: number; dropped: number }

const EMPTY: Store = { sessions: [] }

/** Lokaal-eerst synchronisatie: wijzigingen direct lokaal, op volgorde naar de server, serverstand + wachtrij = wat je ziet. */
export function createSyncEngine(transport: Transport, storage: Storage, onChange: (s: EngineState) => void) {
  const cached = storage.read()
  let store: Store = cached?.store ?? EMPTY
  let queue: Op[] = cached?.queue ?? []
  let loaded = !!cached
  let error: string | undefined
  let dropped = 0
  let disposed = false
  let version = 0
  let flushing: Promise<void> | null = null

  const state = (): EngineState => ({ store, loaded, error, pending: queue.length, dropped })
  const emit = () => { if (!disposed) onChange(state()) }
  const persist = () => { if (!disposed) storage.write({ store, queue }) }

  function dispatch(op: Op) {
    if (disposed) return
    version++
    queue = [...queue, op]
    store = applyOp(store, op)
    persist()
    emit()
    void flush()
  }

  function flush(): Promise<void> {
    if (flushing) return flushing
    flushing = (async () => {
      while (queue.length && !disposed) {
        let res: Awaited<ReturnType<Transport['send']>>
        try { res = await transport.send(queue[0]) } catch { break }
        if (disposed) return
        if (res.error && !isPermanentError(res.error)) break
        if (res.error) { dropped++; console.warn('Wijziging overgeslagen', res.error) }
        queue = queue.slice(1)
        version++
        persist()
        emit()
      }
    })().finally(() => { flushing = null })
    return flushing
  }

  async function refetch(): Promise<void> {
    if (flushing) await flushing
    if (disposed) return
    const v = version
    let server: Store
    try { server = await transport.fetchAll() } catch {
      if (disposed) return
      if (!store.profile && !cached) error = 'Geen verbinding met de database. Controleer je internet.'
      loaded = true
      emit()
      return
    }
    if (disposed) return
    if (v !== version) return refetch()
    store = rebase(server, queue)
    error = undefined
    loaded = true
    persist()
    emit()
    for (const op of closeStaleSessions(store.sessions)) dispatch(op)
  }

  return {
    state,
    getStore: () => store,
    dispatch,
    flush,
    refetch,
    sync: () => flush().then(refetch),
    hasPending: () => queue.length > 0,
    dispose: () => { disposed = true },
  }
}

export type SyncEngine = ReturnType<typeof createSyncEngine>
