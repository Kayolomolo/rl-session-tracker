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

/** Oplopend getal voor een rank-label: Bronze I Div 1 = 0, +1 per divisie; Unranked of onbekend = null. */
export function rankIndex(label: string): number | null {
  const match = /^(.*?)(?: Div ([1-4]))?$/.exec(label.trim())
  if (!match) return null
  const tier = RANK_TIERS.indexOf(match[1])
  if (tier <= 0) return null
  return (tier - 1) * 4 + (match[2] ? Number(match[2]) - 1 : 0)
}

/** Pad naar het rank-icoon (in public/ranks/) voor een tier of label met divisie; Unranked of onbekend = null. */
export function rankIcon(label: string): string | null {
  const tier = label.trim().replace(/ Div [1-4]$/, '')
  if (tier === 'Unranked' || !RANK_TIERS.includes(tier)) return null
  const slug = tier.toLowerCase().replace(/ (i{1,3})$/, (_, n: string) => `-${n.length}`).replace(/ /g, '-')
  return `ranks/${slug}.png`
}
