import type { ActivityKind } from './types'

export const DEFAULT_ACTIVITIES: Record<ActivityKind, string[]> = {
  warmup: ['Freeplay', 'Shooting', 'Dribbling', 'Aerials', 'Recoveries'],
  training: ['Mechanical training', 'Workshop maps', 'Rings maps', 'Dribble maps', 'Custom training packs', 'Shooting practice'],
}

export const KIND_LABEL: Record<ActivityKind, string> = { warmup: 'Warm-up', training: 'Training' }

export function activityOptions(kind: ActivityKind, custom: string[]): string[] {
  return [...DEFAULT_ACTIVITIES[kind], ...custom]
}

export function addCustom(list: string[], name: string): string[] {
  const clean = name.trim().replace(/\s+/g, ' ')
  if (!clean) return list
  const taken = [...list, ...DEFAULT_ACTIVITIES.warmup, ...DEFAULT_ACTIVITIES.training].map((n) => n.toLowerCase())
  return taken.includes(clean.toLowerCase()) ? list : [...list, clean]
}
