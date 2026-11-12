import { expect, test } from 'vitest'
import { hasDivisions, RANK_TIERS, rankLabel } from './ranks'

test('rank-lijst loopt van Unranked tot Supersonic Legend', () => {
  expect(RANK_TIERS[0]).toBe('Unranked')
  expect(RANK_TIERS.at(-1)).toBe('Supersonic Legend')
  expect(RANK_TIERS).toHaveLength(23)
  expect(RANK_TIERS).toContain('Grand Champion III')
})
test('divisies alleen tussen Bronze en Grand Champion', () => {
  expect(hasDivisions('Champion II')).toBe(true)
  expect(hasDivisions('Supersonic Legend')).toBe(false)
  expect(hasDivisions('Unranked')).toBe(false)
})
test('rankLabel', () => {
  expect(rankLabel({ tier: 'Champion II', division: 3 })).toBe('Champion II Div 3')
  expect(rankLabel({ tier: 'Supersonic Legend' })).toBe('Supersonic Legend')
  expect(rankLabel({ tier: 'Supersonic Legend', division: 2 })).toBe('Supersonic Legend')
  expect(rankLabel(undefined)).toBe('Unranked')
})
