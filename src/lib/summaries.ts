import { formatDuration } from './time'
import type { WeekWin } from './trends'

export function winSummary(weeks: WeekWin[]): string {
  const withGames = weeks.filter((w) => w.played > 0)
  if (!withGames.length) return 'Nog geen games in deze periode.'
  const last = withGames.at(-1)!
  const played = withGames.reduce((s, w) => s + w.played, 0)
  const wins = withGames.reduce((s, w) => s + w.wins, 0)
  return `Laatste week met games: ${last.winRate}% uit ${last.played} games. Gemiddeld ${Math.round((wins / played) * 100)}% over ${played} games.`
}

export function volumeSummary(weeks: { week?: number; games: number; playedMs: number }[]): string {
  const cur = weeks.at(-1)
  const total = weeks.reduce((s, w) => s + w.games, 0)
  return `Deze week ${cur?.games ?? 0} games (${formatDuration(cur?.playedMs ?? 0)}). Totaal ${total} games in deze periode.`
}

export function trainingSummary(weeks: { week?: number; warmupMs: number; trainingMs: number }[]): string {
  const cur = weeks.at(-1)
  const w = weeks.reduce((s, x) => s + x.warmupMs, 0)
  const t = weeks.reduce((s, x) => s + x.trainingMs, 0)
  return `Deze week ${formatDuration(cur?.warmupMs ?? 0)} warm-up en ${formatDuration(cur?.trainingMs ?? 0)} training. Totaal ${formatDuration(w)} warm-up en ${formatDuration(t)} training in deze periode.`
}
