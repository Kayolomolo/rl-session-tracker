import type { Range } from '../../lib/trends'

export const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: 4, label: '4 wk' },
  { value: 12, label: '12 wk' },
  { value: 'all', label: 'Alles' },
]
export const isRange = (v: unknown): v is Range => v === 4 || v === 12 || v === 'all'
export const weekLabel = (week: number) => new Date(week).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace('.', '')
