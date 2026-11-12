import { describe, expect, test } from 'vitest'
import { applyOp, isPermanentError, rebase, type Store } from './store'
import { act, m, profile, sess } from './testHelpers'

const base = (): Store => ({ profile: profile({}), sessions: [sess({ id: 's1', startedAt: 10 })] })

describe('applyOp', () => {
  test('nieuwe sessie komt vooraan (nieuwste eerst)', () => {
    const r = applyOp(base(), { t: 'session', row: { id: 's2', startedAt: 20, lastActivityAt: 20 } })
    expect(r.sessions.map((s) => s.id)).toEqual(['s2', 's1'])
    expect(r.sessions[0]).toMatchObject({ matches: [], activities: [] })
  })
  test('sessie bijwerken behoudt wedstrijden', () => {
    let st = applyOp(base(), { t: 'match', sessionId: 's1', row: m('2v2', 'win', 12) })
    st = applyOp(st, { t: 'session', row: { id: 's1', startedAt: 10, endedAt: 99, lastActivityAt: 10 } })
    expect(st.sessions[0].endedAt).toBe(99)
    expect(st.sessions[0].matches).toHaveLength(1)
  })
  test('wedstrijd toevoegen en vervangen, gesorteerd op tijd', () => {
    const a = { ...m('2v2', 'win', 15), id: 'ma' }
    let st = applyOp(base(), { t: 'match', sessionId: 's1', row: a })
    st = applyOp(st, { t: 'match', sessionId: 's1', row: { ...m('1v1', 'loss', 12), id: 'mb' } })
    st = applyOp(st, { t: 'match', sessionId: 's1', row: { ...a, mmr: 900 } })
    expect(st.sessions[0].matches.map((x) => x.id)).toEqual(['mb', 'ma'])
    expect(st.sessions[0].matches[1].mmr).toBe(900)
  })
  test('activiteit toevoegen en verwijderen', () => {
    const a = { ...act('warmup', 'Freeplay', 11), id: 'a1' }
    let st = applyOp(base(), { t: 'activity', sessionId: 's1', row: a })
    expect(st.sessions[0].activities).toHaveLength(1)
    st = applyOp(st, { t: 'delActivity', id: 'a1' })
    expect(st.sessions[0].activities).toHaveLength(0)
  })
  test('wedstrijd voor onbekende sessie wordt genegeerd', () => {
    expect(applyOp(base(), { t: 'match', sessionId: 'nope', row: m('2v2', 'win', 1) })).toEqual(base())
  })
  test('sessie en wedstrijd verwijderen', () => {
    let st = applyOp(base(), { t: 'match', sessionId: 's1', row: { ...m('2v2', 'win', 1), id: 'x' } })
    st = applyOp(st, { t: 'delMatch', id: 'x' })
    expect(st.sessions[0].matches).toHaveLength(0)
    expect(applyOp(st, { t: 'delSession', id: 's1' }).sessions).toEqual([])
  })
  test('profiel vervangen', () => {
    expect(applyOp(base(), { t: 'profile', row: profile({ name: 'Nieuw' }) }).profile?.name).toBe('Nieuw')
  })
  test('applyOp verandert de oude store niet', () => {
    const st = base()
    applyOp(st, { t: 'match', sessionId: 's1', row: m('2v2', 'win', 1) })
    expect(st.sessions[0].matches).toHaveLength(0)
  })
})

test('rebase past wachtende wijzigingen toe op serverdata', () => {
  const server = base()
  const r = rebase(server, [{ t: 'session', row: { id: 's2', startedAt: 30, lastActivityAt: 30 } }, { t: 'match', sessionId: 's2', row: m('3v3', 'win', 31) }])
  expect(r.sessions[0].id).toBe('s2')
  expect(r.sessions[0].matches).toHaveLength(1)
})

describe('isPermanentError', () => {
  test('netwerkfout en serverfouten zijn tijdelijk', () => {
    expect(isPermanentError({ code: '', status: 0 })).toBe(false)
    expect(isPermanentError({})).toBe(false)
    expect(isPermanentError({ status: 503 })).toBe(false)
    expect(isPermanentError({ code: 'PGRST002', status: 503 })).toBe(false)
    expect(isPermanentError({ code: 'PGRST000', status: 503 })).toBe(false)
  })
  test('tijdelijke databasecodes zijn tijdelijk', () => {
    expect(isPermanentError({ code: '40001', status: 500 })).toBe(false)
    expect(isPermanentError({ code: '08006' })).toBe(false)
    expect(isPermanentError({ code: '57014', status: 500 })).toBe(false)
    expect(isPermanentError({ code: '53300' })).toBe(false)
  })
  test('te veel verzoeken, time-out en verlopen login zijn tijdelijk', () => {
    expect(isPermanentError({ status: 429 })).toBe(false)
    expect(isPermanentError({ status: 408 })).toBe(false)
    expect(isPermanentError({ status: 401 })).toBe(false)
    expect(isPermanentError({ code: 'PGRST301', status: 401 })).toBe(false)
  })
  test('inhoudelijke weigeringen zijn definitief', () => {
    expect(isPermanentError({ code: '23503', status: 409 })).toBe(true)
    expect(isPermanentError({ code: '23505', status: 409 })).toBe(true)
    expect(isPermanentError({ code: '42501', status: 403 })).toBe(true)
    expect(isPermanentError({ code: '22P02', status: 400 })).toBe(true)
    expect(isPermanentError({ code: 'PGRST116', status: 406 })).toBe(true)
    expect(isPermanentError({ code: 'PGRST204', status: 400 })).toBe(true)
  })
})
