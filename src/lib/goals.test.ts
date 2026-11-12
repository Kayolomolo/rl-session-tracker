import { describe, expect, test } from 'vitest'
import { currentMmr, goalProgress, goalTitle, validateGoal, weekHistory, type Goal, type GoalConfig } from './goals'
import { act, m, MIN, profile, sess } from './testHelpers'

const W = (y: number, mo: number, d: number) => new Date(y, mo, d).getTime()
const now = new Date(2026, 10, 12, 15).getTime()
const g = (config: GoalConfig): Goal => ({ id: 'g', createdAt: 0, config })

const s = sess({ startedAt: W(2026, 10, 10), activities: [
  act('training', 'Aerials', W(2026, 10, 10), W(2026, 10, 10) + 20 * MIN),
  act('training', 'Aerials', W(2026, 10, 11), W(2026, 10, 11) + 22 * MIN),
  act('warmup', 'Freeplay', W(2026, 10, 11), W(2026, 10, 11) + 10 * MIN),
  act('training', 'Aerials', W(2026, 10, 3), W(2026, 10, 3) + 60 * MIN),
] })

describe('trainingsdoelen', () => {
  test('totaal minuten deze week', () => {
    expect(goalProgress(g({ kind: 'training', target: { kind: 'activity', type: 'Aerials' }, count: 'minutes', minutes: 60 }), [s], profile({}), now))
      .toMatchObject({ current: 42, target: 60, done: false, label: 'Aerials · 42 van 60 min' })
    expect(goalProgress(g({ kind: 'training', target: { kind: 'warmup' }, count: 'minutes', minutes: 10 }), [s], profile({}), now).done).toBe(true)
  })
  test('aantal keer: alleen lang genoeg telt', () => {
    expect(goalProgress(g({ kind: 'training', target: { kind: 'activity', type: 'Aerials' }, count: 'times', minutes: 21, times: 3 }), [s], profile({}), now))
      .toMatchObject({ current: 1, target: 3, label: 'Aerials · 1 van 3 keer' })
  })
  test('lopende timer telt pas mee na genoeg minuten', () => {
    const live = sess({ startedAt: now - 5 * MIN, activities: [act('training', 'Rings maps', now - 5 * MIN)] })
    expect(goalProgress(g({ kind: 'training', target: { kind: 'training' }, count: 'times', minutes: 15, times: 1 }), [live], profile({}), now).current).toBe(0)
  })
})

describe('winpercentagedoelen', () => {
  const ms = sess({ startedAt: W(2026, 10, 10), matches: [m('2v2', 'win', W(2026, 10, 10) + 1), m('2v2', 'win', W(2026, 10, 10) + 2), m('2v2', 'loss', W(2026, 10, 10) + 3)] })
  test('onder het minimum nooit gehaald', () => {
    expect(goalProgress(g({ kind: 'winrate', mode: '2v2', percent: 55, period: 'week', minGames: 10 }), [ms], profile({}), now))
      .toMatchObject({ done: false, needMore: 7, label: '2v2 · nog 7 games nodig' })
  })
  test('boven het minimum', () => {
    expect(goalProgress(g({ kind: 'winrate', mode: '2v2', percent: 55, period: 'month', minGames: 3 }), [ms], profile({}), now))
      .toMatchObject({ current: 67, target: 55, done: true, label: '2v2 · 67% van 55% · 3 games' })
  })
})

describe('rank- en MMR-doelen', () => {
  const p = profile({ ranks: { '2v2': { tier: 'Champion I', division: 2 } } })
  test('rank', () => {
    expect(goalProgress(g({ kind: 'rank', mode: '2v2', tier: 'Champion II', division: 1 }), [], p, now)).toMatchObject({ done: false, label: '2v2 · nog 3 divisies' })
    expect(goalProgress(g({ kind: 'rank', mode: '2v2', tier: 'Champion I', division: 1 }), [], p, now)).toMatchObject({ done: true, label: '2v2 · Gehaald' })
    expect(goalProgress(g({ kind: 'rank', mode: '1v1', tier: 'Gold I' }), [], p, now)).toMatchObject({ done: false, label: '1v1 · Stel je rank in bij Profile' })
  })
  test('currentMmr: laatste wedstrijd, anders profiel', () => {
    expect(currentMmr([sess({ matches: [{ ...m('2v2', 'win', 5), mmr: 1000 }, { ...m('2v2', 'win', 9), mmr: 1012 }] })], profile({}), '2v2')).toBe(1012)
    expect(currentMmr([], profile({ ranks: { '3v3': { tier: 'Gold I', mmr: 700 } } }), '3v3')).toBe(700)
  })
  test('mmr-doel zonder MMR', () => {
    expect(goalProgress(g({ kind: 'mmr', mode: '1v1', mmr: 900 }), [], profile({}), now).label).toBe('1v1 · Vul je MMR in')
    expect(goalProgress(g({ kind: 'mmr', mode: '3v3', mmr: 650 }), [], profile({ ranks: { '3v3': { tier: 'Gold I', mmr: 700 } } }), now)).toMatchObject({ done: true, label: '3v3 · Gehaald' })
  })
})

test('weekHistory: 4 weken vóór deze week', () => {
  expect(weekHistory(g({ kind: 'training', target: { kind: 'activity', type: 'Aerials' }, count: 'minutes', minutes: 60 }), [s], now)).toEqual([false, false, false, true])
  expect(weekHistory(g({ kind: 'rank', mode: '2v2', tier: 'Gold I' }), [], now)).toBeNull()
})

test('validatie en titels', () => {
  expect(validateGoal({ kind: 'training', target: { kind: 'warmup' }, count: 'minutes', minutes: 3 })).toBe('Kies tussen 5 en 600 minuten.')
  expect(validateGoal({ kind: 'training', target: { kind: 'warmup' }, count: 'times', minutes: 15, times: 20 })).toBe('Kies 1 tot 14 keer.')
  expect(validateGoal({ kind: 'winrate', mode: '2v2', percent: 55, period: 'week', minGames: 10 })).toBeNull()
  expect(validateGoal({ kind: 'mmr', mode: '2v2', mmr: 0 })).toBe('Kies een MMR van 1 tot 3000.')
  expect(goalTitle({ kind: 'training', target: { kind: 'activity', type: 'Aerials' }, count: 'times', minutes: 15, times: 3 })).toBe('Aerials · 3× 15 min per week')
  expect(goalTitle({ kind: 'winrate', mode: '2v2', percent: 55, period: 'month', minGames: 10 })).toBe('2v2 · 55% winst deze maand')
})
