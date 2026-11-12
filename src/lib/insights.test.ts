import { describe, expect, test } from 'vitest'
import { bestMode, fatigue, records, warmupEffect } from './insights'
import { act, m, MIN, sess } from './testHelpers'
import type { Match, Mode, Result } from './types'

const games = (mode: Mode, n: number, wins: number, start = 0): Match[] =>
  Array.from({ length: n }, (_, i) => m(mode, (i < wins ? 'win' : 'loss') as Result, start + i))

describe('bestMode', () => {
  test('hoogste winpercentage met minstens 10 games', () => {
    const s = sess({ matches: [...games('2v2', 12, 8), ...games('3v3', 10, 5, 100), ...games('1v1', 3, 3, 200)] })
    expect(bestMode([s])).toEqual({ ok: true, text: 'Je wint het vaakst in 2v2 (67%, 12 games).' })
  })
  test('te weinig games', () => {
    expect(bestMode([sess({ matches: games('2v2', 9, 5) })])).toEqual({ ok: false, need: 'Nog 1 game in één modus nodig' })
  })
})

describe('fatigue', () => {
  const tenGames = (start: number) => sess({ startedAt: start, matches: [...games('2v2', 5, 4, start), ...games('2v2', 5, 2, start + 10)] })
  test('vergelijkt game 1–5 met 6+', () => {
    expect(fatigue([tenGames(0), tenGames(1000), tenGames(2000), tenGames(3000)])).toEqual({ ok: true, text: 'Na 5 games zak je van 80% naar 40%.', tip: 'Overweeg kortere sessies.' })
  })
  test('korte sessie telt alleen bij 1–5, te weinig gegevens', () => {
    expect(fatigue([sess({ matches: games('2v2', 4, 2) }), tenGames(1000)])).toEqual({ ok: false, need: 'Nog 15 wedstrijden na de 5e game nodig' })
  })
  test('geen daling: geen tip', () => {
    const flat = (start: number) => sess({ startedAt: start, matches: [...games('2v2', 5, 3, start), ...games('2v2', 5, 3, start + 10)] })
    expect(fatigue([flat(0), flat(1000), flat(2000), flat(3000)])).toEqual({ ok: true, text: 'Na 5 games blijf je rond 60% (60% → 60%).' })
  })
})

describe('warmupEffect', () => {
  const withW = (i: number, wins: number) => sess({ startedAt: i, matches: games('2v2', 10, wins, i), activities: [act('warmup', 'Freeplay', i, i + 5 * MIN)] })
  const without = (i: number, wins: number) => sess({ startedAt: i, matches: games('2v2', 10, wins, i) })
  test('met warm-up beter', () => {
    const all = [0, 1, 2, 3, 4].map((i) => withW(i * 100, 6)).concat([5, 6, 7, 8, 9].map((i) => without(i * 100, i === 5 ? 5 : 4) ))
    expect(warmupEffect(all)).toEqual({ ok: true, text: 'Met warm-up win je 18 procentpunt vaker (60% tegen 42%).' })
  })
  test('zonder warm-up beter', () => {
    const all = [0, 1, 2, 3, 4].map((i) => withW(i * 100, 4)).concat([5, 6, 7, 8, 9].map((i) => without(i * 100, 5)))
    expect(warmupEffect(all)).toEqual({ ok: true, text: 'Zonder warm-up win je 10 procentpunt vaker (50% tegen 40%).' })
  })
  test('geen verschil', () => {
    const all = [0, 1, 2, 3, 4].map((i) => withW(i * 100, 5)).concat([5, 6, 7, 8, 9].map((i) => without(i * 100, 5)))
    expect(warmupEffect(all)).toEqual({ ok: true, text: 'Met en zonder warm-up win je even vaak (50%).' })
  })
  test('te weinig sessies', () => {
    const all = [0, 1, 2, 3, 4].map((i) => withW(i * 100, 6)).concat([5, 6, 7].map((i) => without(i * 100, 4)))
    expect(warmupEffect(all)).toEqual({ ok: false, need: 'Nog 2 sessies zonder warm-up nodig' })
  })
})

describe('records', () => {
  test('winstreak, langste sessie, meeste games op een dag', () => {
    const d1 = new Date(2026, 10, 10, 20).getTime()
    const d2 = new Date(2026, 10, 11, 20).getTime()
    const a = sess({ startedAt: d1, endedAt: d1 + 90 * MIN, matches: [m('2v2', 'win', d1 + 1), m('2v2', 'win', d1 + 2), m('2v2', 'loss', d1 + 3), m('2v2', 'win', d1 + 4)] })
    const b = sess({ startedAt: d2, endedAt: d2 + 30 * MIN, matches: [m('2v2', 'win', d2 + 1), m('2v2', 'win', d2 + 2)] })
    expect(records([a, b], d2 + 99 * MIN)).toEqual({ longestWinStreak: 3, longestSessionMs: 90 * MIN, mostGamesInDay: 4, mostGamesDay: d1 + 1 })
    expect(records([], 0)).toBeNull()
  })
})
