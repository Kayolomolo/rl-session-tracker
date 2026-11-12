import { describe, expect, test } from 'vitest'
import type { Op, Store } from '../lib/store'
import { m, profile, sess } from '../lib/testHelpers'
import { createSyncEngine, type Cache, type Transport } from './engine'

const tick = () => new Promise((r) => setTimeout(r, 0))
function deferred<T>() { let resolve!: (v: T) => void; const p = new Promise<T>((r) => { resolve = r }); return { p, resolve } }

function memoryStorage(initial?: Cache) {
  let c = initial
  return { read: () => c, write: (x: Cache) => { c = x }, get: () => c }
}

const server = (s: Partial<Store> = {}): Store => ({ profile: profile({}), sessions: [], goals: [], ...s })

describe('sync-engine', () => {
  test('wachtrij blijft staan bij tijdelijke fout en wordt later verstuurd', async () => {
    let fail = true
    const sent: Op[] = []
    const t: Transport = {
      fetchAll: async () => server(),
      send: async (op) => { if (fail) return { error: { code: '', status: 0 } }; sent.push(op); return { error: null } },
    }
    const st = memoryStorage()
    const e = createSyncEngine(t, st, () => {})
    e.dispatch({ t: 'session', row: { id: 's1', startedAt: 1, lastActivityAt: 1 } })
    await tick()
    expect(e.state().pending).toBe(1)
    expect(st.get()?.queue).toHaveLength(1)
    fail = false
    await e.sync()
    expect(sent).toHaveLength(1)
    expect(e.state().pending).toBe(0)
  })

  test('definitieve fout wordt overgeslagen en geteld', async () => {
    const t: Transport = { fetchAll: async () => server(), send: async () => ({ error: { code: '42501', status: 403 } }) }
    const e = createSyncEngine(t, memoryStorage(), () => {})
    e.dispatch({ t: 'delMatch', id: 'x' })
    await e.sync()
    expect(e.state()).toMatchObject({ pending: 0, dropped: 1 })
  })

  test('refetch tijdens een lopende flush verliest het verstuurde item niet (I4)', async () => {
    const remote: Store = server({ sessions: [] })
    const gate = deferred<void>()
    const t: Transport = {
      fetchAll: async () => structuredClone(remote),
      send: async (op) => { await gate.p; if (op.t === 'session') remote.sessions.push({ ...op.row, matches: [], activities: [] }); return { error: null } },
    }
    const e = createSyncEngine(t, memoryStorage(), () => {})
    e.dispatch({ t: 'session', row: { id: 's1', startedAt: 1, lastActivityAt: 1 } })
    const r = e.sync()
    gate.resolve()
    await r
    expect(e.state().store.sessions.map((s) => s.id)).toEqual(['s1'])
  })

  test('na dispose worden late resultaten genegeerd (I2)', async () => {
    const late = deferred<Store>()
    const changes: Store[] = []
    const t: Transport = { fetchAll: () => late.p, send: async () => ({ error: null }) }
    const e = createSyncEngine(t, memoryStorage(), (s) => changes.push(s.store))
    const r = e.refetch()
    e.dispose()
    late.resolve(server({ sessions: [sess({ id: 'van-iemand-anders' })] }))
    await r
    expect(changes.every((s) => s.sessions.length === 0)).toBe(true)
  })

  test('start leeg en ongeladen zonder cache, met cache direct geladen', () => {
    const t: Transport = { fetchAll: async () => server(), send: async () => ({ error: null }) }
    expect(createSyncEngine(t, memoryStorage(), () => {}).state()).toMatchObject({ loaded: false, store: { sessions: [] } })
    const cached = { store: server({ sessions: [sess({ id: 'c' })] }), queue: [] }
    expect(createSyncEngine(t, memoryStorage(cached), () => {}).state().loaded).toBe(true)
  })

  test('refetch zonder verbinding en zonder cache geeft een foutmelding', async () => {
    const t: Transport = { fetchAll: async () => { throw new Error('offline') }, send: async () => ({ error: null }) }
    const e = createSyncEngine(t, memoryStorage(), () => {})
    await e.refetch()
    expect(e.state()).toMatchObject({ loaded: true, error: expect.any(String) })
  })

  test('refetch sluit een tweede open sessie automatisch (I3)', async () => {
    const remote = server({ sessions: [sess({ id: 'new', startedAt: 100 }), sess({ id: 'old', startedAt: 0, matches: [m('2v2', 'win', 50)] })] })
    const t: Transport = { fetchAll: async () => structuredClone(remote), send: async () => ({ error: null }) }
    const e = createSyncEngine(t, memoryStorage(), () => {})
    await e.refetch()
    const old = e.state().store.sessions.find((s) => s.id === 'old')
    expect(old?.endedAt).toBe(50)
    expect(e.state().store.sessions.find((s) => s.id === 'new')?.endedAt).toBeUndefined()
  })
})
