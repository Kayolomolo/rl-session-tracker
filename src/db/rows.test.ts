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

test('rowsToStore en opToRequest voor doelen', () => {
  const st = rowsToStore([], [], [], [], [{ id: 'g1', user_id: 'u1', kind: 'mmr', config: { kind: 'mmr', mode: '2v2', mmr: 1000 }, created_at: 1, achieved_at: null, archived_at: null }])
  expect(st.goals).toEqual([{ id: 'g1', createdAt: 1, config: { kind: 'mmr', mode: '2v2', mmr: 1000 } }])
  expect(rowsToStore([], [], [], []).goals).toEqual([])
  expect(opToRequest({ t: 'goal', row: { id: 'g1', createdAt: 1, achievedAt: 9, config: { kind: 'mmr', mode: '2v2', mmr: 1000 } } }, 'u1')).toEqual({
    table: 'goals', kind: 'upsert',
    row: { id: 'g1', user_id: 'u1', kind: 'mmr', config: { kind: 'mmr', mode: '2v2', mmr: 1000 }, created_at: 1, achieved_at: 9, archived_at: null },
  })
  expect(opToRequest({ t: 'delGoal', id: 'g1' }, 'u1')).toEqual({ table: 'goals', kind: 'delete', id: 'g1' })
})

test('tracker-profiel uit de database komt in het profiel; ongeldig wordt genegeerd', () => {
  const base = { id: 'u1', name: 'Kay', ranks: {}, ask_mmr: false, idle_minutes: 45, last_mode: '2v2', custom_activities: {} }
  expect(rowsToStore([{ ...base, tracker: { platform: 'epic', id: 'Kayolomolo' } }], [], [], []).profile?.tracker).toEqual({ platform: 'epic', id: 'Kayolomolo' })
  expect(rowsToStore([{ ...base, tracker: { platform: 'xbox', id: 'x' } }], [], [], []).profile?.tracker).toBeUndefined()
  expect(rowsToStore([{ ...base, tracker: null }], [], [], []).profile?.tracker).toBeUndefined()
})
test('profiel zonder tracker stuurt geen tracker-kolom mee (werkt ook zonder nieuwe kolom)', () => {
  const req = opToRequest({ t: 'profile', row: { id: 'u1', name: 'Kay', ranks: {}, askMmr: true, idleMinutes: 30, lastMode: '1v1', customActivities: { warmup: [], training: [] } } }, 'u1')
  expect('tracker' in (req as { row: object }).row).toBe(false)
})
test('profiel met tracker stuurt de tracker-kolom mee', () => {
  const req = opToRequest({ t: 'profile', row: { id: 'u1', name: 'Kay', ranks: {}, askMmr: true, idleMinutes: 30, lastMode: '1v1', customActivities: { warmup: [], training: [] }, tracker: { platform: 'steam', id: '123' } } }, 'u1')
  expect(req).toMatchObject({ row: { tracker: { platform: 'steam', id: '123' } } })
})
test('tracker leegmaken stuurt null zodat de oude naam verdwijnt', () => {
  const req = opToRequest({ t: 'profile', row: { id: 'u1', name: 'Kay', ranks: {}, askMmr: true, idleMinutes: 30, lastMode: '1v1', customActivities: { warmup: [], training: [] }, tracker: null } }, 'u1')
  expect(req).toMatchObject({ row: { tracker: null } })
})
