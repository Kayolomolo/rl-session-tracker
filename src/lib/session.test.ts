import { describe, expect, test } from 'vitest'
import { activeSession, isIdle, lastActivityAt, matchFields, resolveIdleEnd, runningActivity, suggestActivityMinutes } from './session'
import { act, m, MIN, profile, sess } from './testHelpers'

describe('activeSession', () => {
  test('kiest de nieuwste open sessie', () => {
    expect(activeSession([sess({ id: 'a', startedAt: 1 }), sess({ id: 'b', startedAt: 5 }), sess({ id: 'c', startedAt: 9, endedAt: 10 })])?.id).toBe('b')
    expect(activeSession([])).toBeUndefined()
  })
})

describe('inactiviteit', () => {
  const s = sess({ startedAt: 0, matches: [m('2v2', 'win', 20 * MIN)], activities: [act('warmup', 'Freeplay', 0, 10 * MIN)] })
  test('lastActivityAt is het laatste moment van activiteit', () => {
    expect(lastActivityAt(s)).toBe(20 * MIN)
  })
  test('isIdle na de ingestelde minuten', () => {
    expect(isIdle(s, 64 * MIN, 45)).toBe(false)
    expect(isIdle(s, 65 * MIN, 45)).toBe(true)
  })
  test('Doorgaan schuift lastActivityAt op', () => {
    expect(isIdle({ ...s, lastActivityAt: 60 * MIN }, 65 * MIN, 45)).toBe(false)
  })
  test('resolveIdleEnd zonder timer eindigt op laatste activiteit', () => {
    expect(resolveIdleEnd(s)).toEqual({ sessionEndedAt: 20 * MIN })
  })
})

describe('vergeten timer', () => {
  const t = sess({ startedAt: 0, activities: [act('training', 'Aerials', 30 * MIN)] })
  test('runningActivity vindt de lopende timer', () => {
    expect(runningActivity(t)?.type).toBe('Aerials')
    expect(runningActivity(sess({}))).toBeUndefined()
  })
  test('suggestActivityMinutes is begrensd en minstens 1', () => {
    expect(suggestActivityMinutes(runningActivity(t)!, 200 * MIN, 45)).toBe(45)
    expect(suggestActivityMinutes(runningActivity(t)!, 30 * MIN + 10_000, 45)).toBe(1)
    expect(suggestActivityMinutes(runningActivity(t)!, 42 * MIN, 45)).toBe(12)
  })
  test('resolveIdleEnd met minuten: sessie eindigt niet voor de activiteit', () => {
    expect(resolveIdleEnd(t, 25)).toEqual({ sessionEndedAt: 55 * MIN, activityEndedAt: 55 * MIN })
    expect(resolveIdleEnd(t)).toEqual({ sessionEndedAt: 30 * MIN, activityEndedAt: 30 * MIN })
  })
})

describe('matchFields', () => {
  const p = profile({ ranks: { '2v2': { tier: 'Champion II', division: 3 }, '1v1': { tier: 'Unranked' } } })
  test('slaat de huidige rank op', () => {
    expect(matchFields(p, '2v2', 'win', 7)).toEqual({ mode: '2v2', result: 'win', playedAt: 7, rank: 'Champion II Div 3' })
  })
  test('Unranked of ontbrekend geeft geen rank', () => {
    expect(matchFields(p, '1v1', 'loss', 7)).toEqual({ mode: '1v1', result: 'loss', playedAt: 7 })
    expect(matchFields(p, '3v3', 'loss', 7)).toEqual({ mode: '3v3', result: 'loss', playedAt: 7 })
  })
})
