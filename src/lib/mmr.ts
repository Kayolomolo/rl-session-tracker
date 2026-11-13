import type { Mode, Profile, Result, TrackerProfile } from './types'

/** Snelknoppen voor de MMR na een wedstrijd: vorige MMR ± 8–11, binnen 1–4999. */
export function quickMmrPicks(result: Result, prev: number | undefined): number[] {
  if (prev === undefined) return []
  const sign = result === 'win' ? 1 : -1
  const picks = [8, 9, 10, 11].map((d) => prev + sign * d).map((v) => Math.min(4999, Math.max(1, v)))
  return [...new Set(picks)]
}

export function cleanTrackerId(raw: string): string | null {
  const id = raw.trim()
  return id && id.length <= 64 ? id : null
}

export function trackerUrl(t: TrackerProfile | null | undefined): string | null {
  const id = t ? cleanTrackerId(t.id) : null
  if (!t || !id) return null
  return `https://rocketleague.tracker.network/rocket-league/profile/${t.platform}/${encodeURIComponent(id)}/overview`
}

/** Profiel met bijgewerkte MMR voor één modus (rank blijft staan). */
export function profileWithMmr(profile: Profile, mode: Mode, mmr: number): Profile {
  const current = profile.ranks[mode] ?? { tier: 'Unranked' }
  return { ...profile, ranks: { ...profile.ranks, [mode]: { ...current, mmr } } }
}
