import { describe, expect, test } from 'vitest'
import { act, m, MIN, sess } from './testHelpers'
import { notesList, rankHistory, weekStarts, weeklyTraining, weeklyVolume, weeklyWinRate } from './trends'

const W = (y: number, mo: number, d: number) => new Date(y, mo, d).getTime()
const now = new Date(2026, 10, 12, 15).getTime()

describe('weekStarts', () => {
  test('4 en 12 weken eindigend in de huidige week', () => {
    expect(weekStarts(now, 4)).toEqual([W(2026, 9, 19), W(2026, 9, 26), W(2026, 10, 2), W(2026, 10, 9)])
    expect(weekStarts(now, 12)).toHaveLength(12)
  })
  test('alles begint bij de week van de eerste sessie, minimaal 4 weken', () => {
    expect(weekStarts(now, 'all', W(2026, 8, 1))[0]).toBe(W(2026, 7, 31))
    expect(weekStarts(now, 'all', W(2026, 10, 10))).toHaveLength(4)
    expect(weekStarts(now, 'all')).toHaveLength(4)
  })
})

describe('weeklyWinRate', () => {
  const weeks = weekStarts(now, 4)
  const s = sess({ startedAt: W(2026, 10, 10), matches: [m('2v2', 'win', W(2026, 10, 10) + 1), m('2v2', 'loss', W(2026, 10, 10) + 2), m('1v1', 'win', W(2026, 10, 10) + 3)] })
  test('per week, gat zonder games', () => {
    const r = weeklyWinRate([s], weeks)
    expect(r[3]).toEqual({ week: W(2026, 10, 9), played: 3, wins: 2, winRate: 67 })
    expect(r[2].winRate).toBeNull()
  })
  test('filter per modus', () => {
    expect(weeklyWinRate([s], weeks, '2v2')[3]).toMatchObject({ played: 2, winRate: 50 })
  })
})

test('weeklyVolume: wedstrijden per speeltijdstip, speeltijd per sessiestart', () => {
  const weeks = weekStarts(now, 4)
  const edge = sess({ startedAt: new Date(2026, 10, 8, 23, 30).getTime(), endedAt: new Date(2026, 10, 9, 0, 40).getTime(), matches: [m('3v3', 'win', new Date(2026, 10, 9, 0, 30).getTime())] })
  const v = weeklyVolume([edge], weeks, now)
  expect(v[2]).toEqual({ week: W(2026, 10, 2), games: 0, playedMs: 70 * MIN })
  expect(v[3]).toMatchObject({ games: 1, playedMs: 0 })
})

test('weeklyTraining telt een lopende timer tot nu', () => {
  const weeks = weekStarts(now, 4)
  const t = sess({ startedAt: now - 30 * MIN, activities: [act('warmup', 'Freeplay', now - 30 * MIN, now - 20 * MIN), act('training', 'Aerials', now - 15 * MIN)] })
  expect(weeklyTraining([t], weeks, now)[3]).toEqual({ week: W(2026, 10, 9), warmupMs: 10 * MIN, trainingMs: 15 * MIN })
})

describe('notesList', () => {
  const n = sess({ startedAt: 0, activities: [{ ...act('training', 'Aerials', 100, 200), note: 'Eerder flippen' }, { ...act('warmup', 'Freeplay', 300, 400), note: 'Goed' }, act('training', 'Rings maps', 500, 600)] })
  test('nieuwste eerst, alleen met notitie', () => {
    expect(notesList([n]).map((x) => x.note)).toEqual(['Goed', 'Eerder flippen'])
  })
  test('filter op activiteit', () => {
    expect(notesList([n], 'Aerials')).toEqual([{ id: n.activities[0].id, kind: 'training', type: 'Aerials', at: 100, note: 'Eerder flippen' }])
  })
})

describe('rankHistory', () => {
  const s = sess({ startedAt: 0, matches: [
    { ...m('2v2', 'win', 10), rank: 'Champion I Div 2' }, { ...m('2v2', 'loss', 20), rank: 'Champion I Div 2' },
    { ...m('1v1', 'win', 25), rank: 'Gold I Div 1' }, { ...m('2v2', 'win', 30), rank: 'Champion I Div 3' },
    { ...m('2v2', 'win', 40), rank: 'Unranked' }, { ...m('2v2', 'win', 50), rank: 'Champion I Div 3', mmr: 1010 }, { ...m('2v2', 'win', 60), mmr: 1022 },
  ] })
  test('trapjes: veranderingen plus laatste punt, per modus', () => {
    expect(rankHistory([s], '2v2').steps.map((p) => [p.at, p.label])).toEqual([[10, 'Champion I Div 2'], [30, 'Champion I Div 3'], [50, 'Champion I Div 3']])
  })
  test('MMR-punten', () => {
    expect(rankHistory([s], '2v2').mmr).toEqual([{ at: 50, mmr: 1010 }, { at: 60, mmr: 1022 }])
  })
  test('since en lege invoer', () => {
    expect(rankHistory([s], '2v2', 35).steps.map((p) => p.at)).toEqual([50])
    expect(rankHistory([], '3v3')).toEqual({ steps: [], mmr: [] })
  })
})
