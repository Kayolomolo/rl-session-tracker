import { expect, test } from 'vitest'
import { opToRequest, rowsToStore } from './rows'

test('rowsToStore bouwt sessies met wedstrijden en activiteiten', () => {
  const st = rowsToStore(
    [{ id: 'u1', name: 'Kay', ranks: null, ask_mmr: null, idle_minutes: null, last_mode: null, custom_activities: null, created_at: 1 }],
    [{ id: 's1', user_id: 'u1', started_at: 10, ended_at: null, last_activity_at: 10 }, { id: 's2', user_id: 'u1', started_at: 50, ended_at: 60, last_activity_at: 50 }],
    [{ id: 'm1', user_id: 'u1', session_id: 's1', mode: '2v2', result: 'win', rank: null, mmr: null, played_at: 12 }],
    [{ id: 'a1', user_id: 'u1', session_id: 's1', kind: 'warmup', type: 'Freeplay', started_at: 11, ended_at: null, note: null }],
  )
  expect(st.profile).toEqual({ id: 'u1', name: 'Kay', ranks: {}, askMmr: false, idleMinutes: 45, lastMode: '2v2', customActivities: { warmup: [], training: [] } })
  expect(st.sessions.map((s) => s.id)).toEqual(['s2', 's1'])
  expect(st.sessions[1]).toEqual({
    id: 's1', startedAt: 10, endedAt: undefined, lastActivityAt: 10,
    matches: [{ id: 'm1', mode: '2v2', result: 'win', playedAt: 12 }],
    activities: [{ id: 'a1', kind: 'warmup', type: 'Freeplay', startedAt: 11 }],
  })
})

test('rowsToStore zonder profiel', () => {
  expect(rowsToStore([], [], [], []).profile).toBeUndefined()
})

test('opToRequest zet een wedstrijd om naar een rij', () => {
  expect(opToRequest({ t: 'match', sessionId: 's1', row: { id: 'm1', mode: '2v2', result: 'win', playedAt: 12, rank: 'Gold I' } }, 'u1')).toEqual({
    table: 'matches', kind: 'upsert',
    row: { id: 'm1', user_id: 'u1', session_id: 's1', mode: '2v2', result: 'win', rank: 'Gold I', mmr: null, played_at: 12 },
  })
})

test('opToRequest voor een lopende activiteit en een sessie', () => {
  expect(opToRequest({ t: 'activity', sessionId: 's1', row: { id: 'a1', kind: 'training', type: 'Aerials', startedAt: 5 } }, 'u1')).toMatchObject({ row: { id: 'a1', user_id: 'u1', session_id: 's1', kind: 'training', type: 'Aerials', started_at: 5, ended_at: null, note: null } })
  expect(opToRequest({ t: 'session', row: { id: 's1', startedAt: 1, lastActivityAt: 2 } }, 'u1')).toMatchObject({ row: { id: 's1', user_id: 'u1', started_at: 1, ended_at: null, last_activity_at: 2 } })
})

test('opToRequest voor verwijderen en profiel', () => {
  expect(opToRequest({ t: 'delSession', id: 's1' }, 'u1')).toEqual({ table: 'sessions', kind: 'delete', id: 's1' })
  expect(opToRequest({ t: 'profile', row: { id: 'u1', name: 'Kay', ranks: {}, askMmr: true, idleMinutes: 30, lastMode: '1v1', customActivities: { warmup: ['X'], training: [] } } }, 'u1')).toMatchObject({ row: { id: 'u1', name: 'Kay', ranks: {}, ask_mmr: true, idle_minutes: 30, last_mode: '1v1', custom_activities: { warmup: ['X'], training: [] } } })
})
