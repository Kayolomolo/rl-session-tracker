import { describe, expect, test } from 'vitest'
import { dayKey, durationMs, formatClock, formatDuration, startOfWeek } from './time'

describe('time', () => {
  test('formatClock toont u:mm:ss', () => {
    expect(formatClock(47 * 60_000 + 12_000)).toBe('0:47:12')
    expect(formatClock(0)).toBe('0:00:00')
    expect(formatClock(3 * 3_600_000 + 5_000)).toBe('3:00:05')
  })
  test('formatDuration toont uren en minuten', () => {
    expect(formatDuration(102 * 60_000)).toBe('1u 42m')
    expect(formatDuration(42 * 60_000)).toBe('42m')
    expect(formatDuration(30_000)).toBe('0m')
  })
  test('durationMs is nooit negatief', () => {
    expect(durationMs(5000, 1000)).toBe(0)
    expect(durationMs(1000, 5000)).toBe(4000)
  })
  test('dayKey gebruikt de lokale datum', () => {
    expect(dayKey(new Date(2026, 10, 12, 23, 59).getTime())).toBe('2026-11-12')
    expect(dayKey(new Date(2026, 0, 5, 0, 1).getTime())).toBe('2026-01-05')
  })
  test('startOfWeek geeft maandag 00:00', () => {
    expect(startOfWeek(new Date(2026, 10, 12, 15, 0).getTime())).toBe(new Date(2026, 10, 9).getTime())
    expect(startOfWeek(new Date(2026, 10, 15, 23, 0).getTime())).toBe(new Date(2026, 10, 9).getTime())
    expect(startOfWeek(new Date(2026, 10, 9, 0, 0).getTime())).toBe(new Date(2026, 10, 9).getTime())
  })
})
