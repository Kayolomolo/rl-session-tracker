import { expect, test } from 'vitest'
import { cleanTrackerId, profileWithMmr, quickMmrPicks, trackerUrl } from './mmr'

test('snelknoppen na winst tellen op vanaf de vorige MMR', () => {
  expect(quickMmrPicks('win', 1000)).toEqual([1008, 1009, 1010, 1011])
})
test('snelknoppen na verlies tellen af', () => {
  expect(quickMmrPicks('loss', 1000)).toEqual([992, 991, 990, 989])
})
test('geen snelknoppen zonder vorige MMR', () => {
  expect(quickMmrPicks('win', undefined)).toEqual([])
})
test('snelknoppen blijven binnen 1-4999', () => {
  expect(quickMmrPicks('loss', 9)).toEqual([1])
  expect(quickMmrPicks('win', 4990)).toEqual([4998, 4999])
})
test('tracker-adres voor Epic en Steam', () => {
  expect(trackerUrl({ platform: 'epic', id: 'Kayolomolo' })).toBe('https://rocketleague.tracker.network/rocket-league/profile/epic/Kayolomolo/overview')
  expect(trackerUrl({ platform: 'steam', id: '76561198000000000' })).toBe('https://rocketleague.tracker.network/rocket-league/profile/steam/76561198000000000/overview')
})
test('tracker-adres codeert spaties en rare tekens', () => {
  expect(trackerUrl({ platform: 'epic', id: 'Kay lolo/#1' })).toBe('https://rocketleague.tracker.network/rocket-league/profile/epic/Kay%20lolo%2F%231/overview')
})
test('geen tracker-adres zonder naam', () => {
  expect(trackerUrl(undefined)).toBeNull()
  expect(trackerUrl({ platform: 'epic', id: '   ' })).toBeNull()
})
test('cleanTrackerId knipt spaties weg en geeft null bij leeg of te lang', () => {
  expect(cleanTrackerId('  Kayolomolo ')).toBe('Kayolomolo')
  expect(cleanTrackerId('   ')).toBeNull()
  expect(cleanTrackerId('x'.repeat(65))).toBeNull()
})
test('profileWithMmr zet de MMR bij de juiste modus en laat de rank staan', () => {
  const p = { id: 'u', name: 'K', ranks: { '2v2': { tier: 'Champion I', division: 2, mmr: 1200 } }, askMmr: true, idleMinutes: 45, lastMode: '2v2' as const, customActivities: { warmup: [], training: [] } }
  expect(profileWithMmr(p, '2v2', 1210).ranks['2v2']).toEqual({ tier: 'Champion I', division: 2, mmr: 1210 })
  expect(profileWithMmr(p, '1v1', 900).ranks['1v1']).toEqual({ tier: 'Unranked', mmr: 900 })
  expect(p.ranks['2v2'].mmr).toBe(1200)
})
