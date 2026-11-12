import { counts, sessionMs } from './stats'
import { dayKey } from './time'
import { MODES, type Match, type Session } from './types'

export type Insight = { ok: true; text: string; tip?: string } | { ok: false; need: string }
export interface Records { longestWinStreak: number; longestSessionMs: number; mostGamesInDay: number; mostGamesDay?: number }

const MIN_MODE_GAMES = 10
const MIN_FATIGUE_GAMES = 20
const MIN_WARMUP_SESSIONS = 5
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export function bestMode(sessions: Session[]): Insight {
  const all = sessions.flatMap((s) => s.matches)
  const per = MODES.map((mode) => ({ mode, ...counts(all.filter((x) => x.mode === mode)) }))
  const eligible = per.filter((p) => p.played >= MIN_MODE_GAMES).sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0))
  if (!eligible.length) {
    const most = Math.max(0, ...per.map((p) => p.played))
    return { ok: false, need: `Nog ${plural(MIN_MODE_GAMES - most, 'game', 'games')} in één modus nodig` }
  }
  const b = eligible[0]
  return { ok: true, text: `Je wint het vaakst in ${b.mode} (${b.winRate}%, ${b.played} games).` }
}

export function fatigue(sessions: Session[]): Insight {
  const early: Match[] = []
  const late: Match[] = []
  for (const s of sessions) {
    const ordered = [...s.matches].sort((a, b) => a.playedAt - b.playedAt)
    early.push(...ordered.slice(0, 5))
    late.push(...ordered.slice(5))
  }
  const shortEarly = MIN_FATIGUE_GAMES - early.length
  const shortLate = MIN_FATIGUE_GAMES - late.length
  if (shortEarly > 0 || shortLate > 0) {
    return shortLate >= shortEarly
      ? { ok: false, need: `Nog ${plural(shortLate, 'wedstrijd', 'wedstrijden')} na de 5e game nodig` }
      : { ok: false, need: `Nog ${plural(shortEarly, 'wedstrijd', 'wedstrijden')} in de eerste 5 games van een sessie nodig` }
  }
  const a = counts(early).winRate ?? 0
  const b = counts(late).winRate ?? 0
  if (a - b >= 5) return { ok: true, text: `Na 5 games zak je van ${a}% naar ${b}%.`, tip: 'Overweeg kortere sessies.' }
  if (b - a >= 5) return { ok: true, text: `Na 5 games ga je omhoog van ${a}% naar ${b}%.` }
  return { ok: true, text: `Na 5 games blijf je rond ${b}% (${a}% → ${b}%).` }
}

export function warmupEffect(sessions: Session[]): Insight {
  const played = sessions.filter((s) => s.matches.length > 0)
  const withW = played.filter((s) => s.activities.some((a) => a.kind === 'warmup'))
  const without = played.filter((s) => !s.activities.some((a) => a.kind === 'warmup'))
  const needWith = MIN_WARMUP_SESSIONS - withW.length
  const needWithout = MIN_WARMUP_SESSIONS - without.length
  if (needWith > 0 || needWithout > 0) {
    return needWith >= needWithout
      ? { ok: false, need: `Nog ${plural(needWith, 'sessie', 'sessies')} met warm-up nodig` }
      : { ok: false, need: `Nog ${plural(needWithout, 'sessie', 'sessies')} zonder warm-up nodig` }
  }
  const a = counts(withW.flatMap((s) => s.matches)).winRate ?? 0
  const b = counts(without.flatMap((s) => s.matches)).winRate ?? 0
  if (a >= b) return { ok: true, text: `Met warm-up win je ${a - b}% vaker (${a}% tegen ${b}%).` }
  return { ok: true, text: `Zonder warm-up win je ${b - a}% vaker (${b}% tegen ${a}%).` }
}

export function records(sessions: Session[], now: number): Records | null {
  if (!sessions.length) return null
  const all = sessions.flatMap((s) => s.matches).sort((a, b) => a.playedAt - b.playedAt)
  let longest = 0
  let run = 0
  for (const x of all) { run = x.result === 'win' ? run + 1 : 0; longest = Math.max(longest, run) }
  const perDay = new Map<string, { n: number; first: number }>()
  for (const x of all) {
    const k = dayKey(x.playedAt)
    const cur = perDay.get(k)
    perDay.set(k, cur ? { n: cur.n + 1, first: cur.first } : { n: 1, first: x.playedAt })
  }
  const best = [...perDay.values()].sort((a, b) => b.n - a.n || a.first - b.first)[0]
  return {
    longestWinStreak: longest,
    longestSessionMs: Math.max(...sessions.map((s) => sessionMs(s, now))),
    mostGamesInDay: best?.n ?? 0,
    ...(best ? { mostGamesDay: best.first } : {}),
  }
}
