import { describe, expect, test } from 'vitest'
import { activityMs, activityTotals, counts, perMode, summarizeSession, todayCounts, totals } from './stats'
import { act, m, MIN, sess } from './testHelpers'

describe('counts', () => {
  test('geen wedstrijden geeft winRate null', () => {
    expect(counts([])).toEqual({ played: 0, wins: 0, losses: 0, winRate: null })
  })
  test('winRate is afgerond op hele procenten', () => {
    expect(counts([m('2v2', 'win', 1), m('2v2', 'win', 2), m('1v1', 'loss', 3)])).toEqual({ played: 3, wins: 2, losses: 1, winRate: 67 })
  })
})

describe('perMode', () => {
  test('telt per gamemode', () => {
    const r = perMode([m('2v2', 'win', 1), m('3v3', 'loss', 2)])
    expect(r['2v2']).toEqual({ played: 1, wins: 1, losses: 0, winRate: 100 })
    expect(r['3v3'].winRate).toBe(0)
    expect(r['1v1'].winRate).toBeNull()
  })
})

describe('summarizeSession', () => {
  const s = sess({ startedAt: 0, endedAt: 60 * MIN, activities: [act('warmup', 'Freeplay', 0, 10 * MIN), act('training', 'Rings maps', 10 * MIN, 30 * MIN)] })
  test('afgeronde sessie', () => {
    expect(summarizeSession(s, 999 * MIN)).toMatchObject({ durationMs: 60 * MIN, warmupMs: 10 * MIN, trainingMs: 20 * MIN, totalTrainingMs: 30 * MIN, otherMs: 30 * MIN, played: 0, winRate: null })
  })
  test('actieve sessie en lopende timer tellen tot nu', () => {
    const live = { ...s, endedAt: undefined, activities: [act('training', 'Aerials', 50 * MIN)] }
    expect(summarizeSession(live, 60 * MIN)).toMatchObject({ durationMs: 60 * MIN, trainingMs: 10 * MIN })
  })
  test('activityMs is nooit negatief', () => {
    expect(activityMs(act('warmup', 'Freeplay', 10 * MIN, 5 * MIN), 0)).toBe(0)
  })
})

describe('todayCounts', () => {
  test('sessie over middernacht telt alleen wedstrijden van vandaag', () => {
    const now = new Date(2026, 10, 12, 1, 0).getTime()
    const night = sess({ startedAt: new Date(2026, 10, 11, 23, 0).getTime(), matches: [m('2v2', 'win', new Date(2026, 10, 11, 23, 30).getTime()), m('2v2', 'loss', new Date(2026, 10, 12, 0, 30).getTime())] })
    expect(todayCounts([night], now)).toEqual({ played: 1, wins: 0, losses: 1, winRate: 0 })
  })
})

describe('totals', () => {
  test('telt alle sessies samen', () => {
    const a = sess({ startedAt: 0, endedAt: 30 * MIN, matches: [m('1v1', 'win', 1)] })
    const b = sess({ startedAt: 100 * MIN, endedAt: 160 * MIN, matches: [m('2v2', 'loss', 2), m('2v2', 'win', 3)] })
    expect(totals([a, b], 999 * MIN)).toMatchObject({ sessions: 2, playedMs: 90 * MIN, played: 3, wins: 2, winRate: 67 })
    expect(totals([a, b], 999 * MIN).perMode['2v2'].played).toBe(2)
  })
})

describe('activityTotals', () => {
  const s = sess({ startedAt: 0, endedAt: 60 * MIN, activities: [act('training', 'Rings maps', 10 * MIN, 30 * MIN), act('training', 'Aerials', 30 * MIN, 35 * MIN), act('training', 'Rings maps', 40 * MIN, 45 * MIN), act('warmup', 'Freeplay', 0, 10 * MIN)] })
  test('groepeert per soort, aflopend op tijd', () => {
    expect(activityTotals([s], 'training', 999 * MIN)).toEqual([{ type: 'Rings maps', ms: 25 * MIN }, { type: 'Aerials', ms: 5 * MIN }])
  })
  test('since filtert op starttijd', () => {
    expect(activityTotals([s], 'training', 999 * MIN, 31 * MIN)).toEqual([{ type: 'Rings maps', ms: 5 * MIN }])
  })
})
