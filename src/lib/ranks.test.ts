import { expect, test } from 'vitest'
import { hasDivisions, RANK_TIERS, rankIcon, rankIndex, rankLabel } from './ranks'

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

test('rankIndex: oplopend getal per divisie', () => {
  expect(rankIndex('Bronze I Div 1')).toBe(0)
  expect(rankIndex('Bronze I Div 4')).toBe(3)
  expect(rankIndex('Bronze II Div 1')).toBe(4)
  expect(rankIndex('Champion II Div 3')).toBe(66)
  expect(rankIndex('Supersonic Legend')).toBe(84)
  expect(rankIndex('Gold I')).toBe(24)
  expect(rankIndex('Unranked')).toBeNull()
  expect(rankIndex('Onzin')).toBeNull()
})
test('rankIcon geeft per rank het juiste plaatje', () => {
  expect(rankIcon('Bronze I')).toBe('ranks/bronze-1.png')
  expect(rankIcon('Grand Champion III')).toBe('ranks/grand-champion-3.png')
  expect(rankIcon('Supersonic Legend')).toBe('ranks/supersonic-legend.png')
})
test('rankIcon gebruikt bij een divisie het icoon van de rank', () => {
  expect(rankIcon('Champion II Div 3')).toBe('ranks/champion-2.png')
})
test('rankIcon geeft null bij Unranked of onbekend', () => {
  expect(rankIcon('Unranked')).toBeNull()
  expect(rankIcon('Mega Rank')).toBeNull()
})
test('elke rank behalve Unranked heeft een icoon', () => {
  expect(RANK_TIERS.filter((t) => rankIcon(t) === null)).toEqual(['Unranked'])
})
