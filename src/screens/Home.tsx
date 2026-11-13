import { IconBarbell, IconChevronsRight, IconClock, IconFlame, IconTarget } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../db/dataContext'
import { BoostMeter } from '../components/BoostMeter'
import { Card } from '../components/Card'
import { Heading, Label } from '../components/Label'
import { SkewButton } from '../components/SkewButton'
import { GoalRow } from '../components/GoalRow'
import { WinLossBar } from '../components/WinLossBar'
import { useNow } from '../hooks/useNow'
import { goalProgress, isActiveGoal } from '../lib/goals'
import { rankLabel } from '../lib/ranks'
import { activityTotals, sessionMs, summarizeSession, todayCounts, totals } from '../lib/stats'
import { dayStreak, winStreak } from '../lib/streaks'
import { formatClock, formatDate, formatDuration, startOfWeek } from '../lib/time'
import { RankIcon } from '../components/RankIcon'

export function Home() {
  const { profile, sessions, active, actions, goals } = useData()
  const navigate = useNavigate()
  const now = useNow(1000)
  const days = dayStreak(sessions.map((s) => s.startedAt), now)
  const wins = winStreak(sessions.flatMap((s) => s.matches))
  const today = todayCounts(sessions, now)
  const last = sessions.find((s) => s.endedAt !== undefined)
  const lastSum = last ? summarizeSession(last, now) : undefined
  const week = startOfWeek(now)
  const weekly = [...activityTotals(sessions, 'warmup', now, week), ...activityTotals(sessions, 'training', now, week)].sort((a, b) => b.ms - a.ms)
  const weekMs = weekly.reduce((s, a) => s + a.ms, 0)
  const all = totals(sessions, now)

  const activeGoals = goals.filter(isActiveGoal)
  const rankGoal = activeGoals.map((g) => g.config).find((c) => c.kind === 'rank')

  const start = () => { actions.startSession(); navigate('/session') }

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[#050c1c]">
        <img src="theme/stadium.webp" alt="" className="h-full w-full object-cover object-[50%_32%]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(5_12_28/.15)_0%,rgb(5_12_28/.35)_30%,rgb(5_12_28/.6)_60%,rgb(5_12_28/.35)_100%)]" />
      </div>
      <section className="relative -mx-4 -mt-[calc(16px+env(safe-area-inset-top))] flex min-h-[calc(clamp(250px,68vw,310px)+env(safe-area-inset-top))] flex-col justify-between overflow-hidden px-4 pb-6 pt-[calc(14px+env(safe-area-inset-top))]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[calc(90px+env(safe-area-inset-top))] bg-gradient-to-b from-[#050c1c]/70 to-transparent" />
        <img src="theme/ball.webp" alt="" aria-hidden="true" className="pointer-events-none absolute bottom-[34px] left-[-6%] w-[37%] max-w-[200px] drop-shadow-[0_0_18px_rgb(30_139_255/.45)]" />
        <img src="theme/car.webp" alt="" aria-hidden="true" className="pointer-events-none absolute bottom-[70px] right-[7%] w-[46%] max-w-[240px] drop-shadow-[0_8px_14px_rgb(0_0_0/.6)]" />
      <header className="relative flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-blue bg-[#071733]/90 font-display text-xl font-bold italic shadow-[0_0_14px_rgb(30_139_255/.7)]">{profile.name.charAt(0).toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl font-bold uppercase italic leading-tight">{profile.name}</p>
          <p className="flex items-center gap-1 text-xs text-blue-text"><RankIcon label={rankLabel(profile.ranks[profile.lastMode])} size={20} /><span className="truncate">{rankLabel(profile.ranks[profile.lastMode])} · {profile.lastMode}</span></p>
        </div>
        <div className="text-right">
          <div className="inline-flex -skew-x-12 items-center rounded-lg border border-orange bg-[#2a1a0a]/90 px-3 py-1 shadow-[0_0_14px_rgb(255_122_26/.55)]">
            <span className="flex skew-x-12 items-center gap-1 font-display font-bold italic text-orange-text"><IconFlame size={18} aria-hidden="true" />{days} {days === 1 ? 'dag' : 'dagen'}</span>
          </div>
          <p className="mt-1 text-[11px] text-[#c6d4ee]">{wins} {wins === 1 ? 'win' : 'wins'} op rij</p>
        </div>
      </header>

      {active ? (
        <SkewButton variant="blue" size="lg" className="relative mx-auto w-[88%] !py-4" onClick={() => navigate('/session')}>
          <span className="text-2xl">Ga verder · {formatClock(sessionMs(active, now))}</span><IconChevronsRight aria-hidden="true" />
        </SkewButton>
      ) : (
        <SkewButton variant="blue" size="lg" className="relative mx-auto w-[88%] !py-4" onClick={start}>
          <span className="text-3xl">Start session</span><IconChevronsRight size={28} aria-hidden="true" />
        </SkewButton>
      )}
      </section>

      <Card glow="orange" className="relative flex items-center gap-4 overflow-hidden">
        <BoostMeter value={today.winRate} />
        <img src="icon-192.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-2 top-1/2 h-24 w-24 -translate-y-1/2 opacity-25 [mask-image:radial-gradient(circle,black_40%,transparent_70%)]" />
        <div className="relative">
          <Label>Vandaag</Label>
          <Heading className="mt-1 text-2xl">{today.played} {today.played === 1 ? 'game' : 'games'}</Heading>
          <p className="mt-1 text-sm"><span className="text-blue-text">{today.wins}W</span> · <span className="text-orange-text">{today.losses}L</span></p>
        </div>
      </Card>

      <Card glow="purple" onClick={() => navigate('/goals')} className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <Label><IconTarget size={18} aria-hidden="true" className="mr-1.5 inline align-[-4px]" />Doelen</Label>
          {activeGoals.length ? (
            <div className="divide-y divide-rl-line">
              {activeGoals.slice(0, 4).map((g) => <GoalRow key={g.id} goal={g} progress={goalProgress(g, sessions, profile, now)} />)}
            </div>
          ) : <p className="mt-1 text-sm text-blue-text">Stel je eerste doel</p>}
        </div>
        {rankGoal && <RankIcon label={rankGoal.tier} size={76} className="drop-shadow-[0_0_10px_rgb(163_101_255/.8)]" />}
      </Card>

      {last && lastSum ? (
        <Card onClick={() => navigate(`/sessions/${last.id}`)}>
          <Label><IconClock size={18} aria-hidden="true" className="mr-1.5 inline align-[-4px]" />Laatste sessie · {formatDate(last.startedAt)}</Label>
          <Heading className="mb-3 mt-1 text-lg">{formatDuration(lastSum.durationMs)} · {lastSum.played} games · {lastSum.wins}W {lastSum.losses}L</Heading>
          <WinLossBar wins={lastSum.wins} losses={lastSum.losses} />
        </Card>
      ) : (
        <Card><Label><IconClock size={18} aria-hidden="true" className="mr-1.5 inline align-[-4px]" />Laatste sessie</Label><p className="mt-1 text-sm text-muted">Start je eerste sessie om hier je resultaten te zien.</p></Card>
      )}

      <Card>
        <div className="flex items-baseline justify-between">
          <Label><IconBarbell size={18} aria-hidden="true" className="mr-1.5 inline align-[-4px]" />Training deze week</Label>
          <span className="font-display font-bold italic">{formatDuration(weekMs)}</span>
        </div>
        {weekly.length ? (
          <ul className="mt-3 space-y-2">
            {weekly.slice(0, 3).map((a) => (
              <li key={a.type} className="flex justify-between text-sm"><span>{a.type}</span><span className="text-muted">{formatDuration(a.ms)}</span></li>
            ))}
          </ul>
        ) : <p className="mt-1 text-sm text-muted">Nog geen warm-up of training deze week.</p>}
      </Card>

      <Card className="grid grid-cols-2 gap-3">
        <div><Label>Totale speeltijd</Label><Heading className="mt-1 text-2xl">{formatDuration(all.playedMs)}</Heading></div>
        <div><Label>Sessies</Label><Heading className="mt-1 text-2xl">{all.sessions}</Heading></div>
      </Card>
    </>
  )
}
