import { expect, test } from 'vitest'
import { trainingSummary, volumeSummary, winSummary } from './summaries'

test('winSummary noemt laatste week met games en gemiddelde', () => {
  expect(winSummary([{ week: 1, played: 10, wins: 5, winRate: 50 }, { week: 2, played: 0, wins: 0, winRate: null }, { week: 3, played: 20, wins: 14, winRate: 70 }]))
    .toBe('Laatste week met games: 70% uit 20 games. Gemiddeld 63% over 30 games.')
  expect(winSummary([{ week: 1, played: 0, wins: 0, winRate: null }])).toBe('Nog geen games in deze periode.')
})

test('volumeSummary en trainingSummary', () => {
  expect(volumeSummary([{ week: 1, games: 4, playedMs: 30 * 60000 }, { week: 2, games: 6, playedMs: 90 * 60000 }]))
    .toBe('Deze week 6 games (1u 30m). Totaal 10 games in deze periode.')
  expect(trainingSummary([{ week: 1, warmupMs: 10 * 60000, trainingMs: 20 * 60000 }, { week: 2, warmupMs: 5 * 60000, trainingMs: 0 }]))
    .toBe('Deze week 5m warm-up en 0m training. Totaal 15m warm-up en 20m training in deze periode.')
})
