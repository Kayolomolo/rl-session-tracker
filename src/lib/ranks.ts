import type { RankEntry } from './types'

const TIERED = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Champion', 'Grand Champion']

export const RANK_TIERS: string[] = [
  'Unranked',
  ...TIERED.flatMap((t) => [`${t} I`, `${t} II`, `${t} III`]),
  'Supersonic Legend',
]

export function hasDivisions(tier: string): boolean {
  return tier !== 'Unranked' && tier !== 'Supersonic Legend' && RANK_TIERS.includes(tier)
}

export function rankLabel(r?: RankEntry): string {
  if (!r) return 'Unranked'
  return hasDivisions(r.tier) && r.division ? `${r.tier} Div ${r.division}` : r.tier
}
