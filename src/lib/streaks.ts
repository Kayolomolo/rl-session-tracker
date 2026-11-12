import { dayKey } from './time'
import type { Match } from './types'

export function dayStreak(sessionStarts: number[], now: number): number {
  const days = new Set(sessionStarts.map(dayKey))
  const d = new Date(now)
  let cursor = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const back = () => { cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1) }
  if (!days.has(dayKey(cursor.getTime()))) back()
  let streak = 0
  while (days.has(dayKey(cursor.getTime()))) { streak++; back() }
  return streak
}

export function winStreak(matches: Match[]): number {
  const sorted = [...matches].sort((a, b) => b.playedAt - a.playedAt)
  const firstLoss = sorted.findIndex((x) => x.result !== 'win')
  return firstLoss === -1 ? sorted.length : firstLoss
}
