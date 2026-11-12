import { IconChevronsRight, IconFlame } from '@tabler/icons-react'
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

  const start = () => { actions.startSession(); navigate('/session') }

  return (
    <>
      <header className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-blue bg-rl-card font-display text-xl font-bold italic">{profile.name.charAt(0).toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl font-bold uppercase italic leading-tight">{profile.name}</p>
          <p className="text-xs text-blue-text">{rankLabel(profile.ranks[profile.lastMode])} · {profile.lastMode}</p>
        </div>
        <div className="text-right">
          <div className="inline-flex -skew-x-12 items-center rounded-lg border border-orange bg-[#2a1a0a] px-3 py-1">
            <span className="flex skew-x-12 items-center gap-1 font-display font-bold italic text-orange-text"><IconFlame size={18} aria-hidden="true" />{days} {days === 1 ? 'dag' : 'dagen'}</span>
          </div>
          <p className="mt-1 text-[11px] text-muted">{wins} {wins === 1 ? 'win' : 'wins'} op rij</p>
        </div>
      </header>

      {active ? (
        <SkewButton variant="blue" size="lg" className="w-full !py-6" onClick={() => navigate('/session')}>
          <span className="text-2xl">Ga verder · {formatClock(sessionMs(active, now))}</span><IconChevronsRight aria-hidden="true" />
        </SkewButton>
      ) : (
        <SkewButton variant="blue" size="lg" className="w-full !py-6" onClick={start}>
          <span className="text-3xl">Start session</span><IconChevronsRight size={28} aria-hidden="true" />
        </SkewButton>
      )}

      <Card className="flex items-center gap-4">
        <BoostMeter value={today.winRate} />
        <div>
          <Label>Vandaag</Label>
          <Heading className="mt-1 text-2xl">{today.played} {today.played === 1 ? 'game' : 'games'}</Heading>
          <p className="mt-1 text-sm"><span className="text-blue-text">{today.wins}W</span> · <span className="text-orange-text">{today.losses}L</span></p>
        </div>
      </Card>

      <Card onClick={() => navigate('/goals')}>
        <Label>Doelen</Label>
        {goals.filter(isActiveGoal).length ? (
          <div className="divide-y divide-rl-line">
            {goals.filter(isActiveGoal).slice(0, 4).map((g) => <GoalRow key={g.id} goal={g} progress={goalProgress(g, sessions, profile, now)} />)}
          </div>
        ) : <p className="mt-1 text-sm text-blue-text">Stel je eerste doel</p>}
      </Card>

      {last && lastSum ? (
        <Card onClick={() => navigate(`/sessions/${last.id}`)}>
          <Label>Laatste sessie · {formatDate(last.startedAt)}</Label>
          <Heading className="mb-3 mt-1 text-lg">{formatDuration(lastSum.durationMs)} · {lastSum.played} games · {lastSum.wins}W {lastSum.losses}L</Heading>
          <WinLossBar wins={lastSum.wins} losses={lastSum.losses} />
        </Card>
      ) : (
        <Card><Label>Laatste sessie</Label><p className="mt-1 text-sm text-muted">Start je eerste sessie om hier je resultaten te zien.</p></Card>
      )}

      <Card>
        <div className="flex items-baseline justify-between">
          <Label>Training deze week</Label>
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
