import { expect, test } from 'vitest'
import { toProfile, toSession } from './mappers'

test('toSession laat lege velden weg', () => {
  const raw = {
    id: 's1', startedAt: 10, endedAt: null, lastActivityAt: 10,
    matches: [{ id: 'm1', mode: '2v2', result: 'win', playedAt: 12, rank: null, mmr: null }],
    activities: [{ id: 'a1', kind: 'warmup', type: 'Freeplay', startedAt: 11, endedAt: null, note: null }],
  }
  expect(toSession(raw)).toEqual({
    id: 's1', startedAt: 10, endedAt: undefined, lastActivityAt: 10,
    matches: [{ id: 'm1', mode: '2v2', result: 'win', playedAt: 12 }],
    activities: [{ id: 'a1', kind: 'warmup', type: 'Freeplay', startedAt: 11 }],
  })
})

test('toSession bewaart ingevulde optionele velden en sorteert', () => {
  const raw = {
    id: 's2', startedAt: 1, endedAt: 50, lastActivityAt: 1,
    matches: [{ id: 'b', mode: '1v1', result: 'loss', playedAt: 30, rank: 'Gold I', mmr: 500 }, { id: 'a', mode: '1v1', result: 'win', playedAt: 20 }],
    activities: [],
  }
  const s = toSession(raw)
  expect(s.endedAt).toBe(50)
  expect(s.matches.map((x) => x.id)).toEqual(['a', 'b'])
  expect(s.matches[1]).toEqual({ id: 'b', mode: '1v1', result: 'loss', playedAt: 30, rank: 'Gold I', mmr: 500 })
})

test('toProfile vult standaardwaarden', () => {
  expect(toProfile({ id: 'p', name: 'Kay' })).toEqual({
    id: 'p', name: 'Kay', ranks: {}, askMmr: false, idleMinutes: 45, lastMode: '2v2',
    customActivities: { warmup: [], training: [] },
  })
})
