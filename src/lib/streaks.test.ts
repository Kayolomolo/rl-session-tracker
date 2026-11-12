import { expect, test } from 'vitest'
import { dayStreak, winStreak } from './streaks'
import { m } from './testHelpers'

const d = (day: number, h = 20) => new Date(2026, 10, day, h).getTime()

test('dayStreak telt opeenvolgende speeldagen', () => {
  expect(dayStreak([], d(12))).toBe(0)
  expect(dayStreak([d(10), d(11), d(12)], d(12, 22))).toBe(3)
})
test('dayStreak blijft staan als vandaag nog niet gespeeld is', () => {
  expect(dayStreak([d(10), d(11)], d(12, 9))).toBe(2)
})
test('dayStreak vervalt na een gemiste dag', () => {
  expect(dayStreak([d(9), d(10)], d(12))).toBe(0)
  expect(dayStreak([d(10), d(12), d(12, 23)], d(12))).toBe(1)
})
test('dayStreak rond middernacht', () => {
  expect(dayStreak([d(11, 23)], d(12, 0))).toBe(1)
})
test('dayStreak over de maandgrens', () => {
  expect(dayStreak([new Date(2026, 9, 31, 20).getTime(), new Date(2026, 10, 1, 20).getTime()], new Date(2026, 10, 1, 21).getTime())).toBe(2)
})
test('winStreak telt laatste wins op rij over alle modi', () => {
  expect(winStreak([])).toBe(0)
  expect(winStreak([m('2v2', 'loss', 1), m('1v1', 'win', 2), m('3v3', 'win', 3)])).toBe(2)
})
test('winStreak sorteert op tijd, niet op volgorde in de lijst', () => {
  expect(winStreak([m('2v2', 'win', 3), m('2v2', 'loss', 4)])).toBe(0)
})
