import { useNavigate } from 'react-router-dom'
import { Card } from '../components/Card'
import { Heading, Label } from '../components/Label'
import { WinLossBar } from '../components/WinLossBar'
import { useData } from '../db/dataContext'
import { useNow } from '../hooks/useNow'
import { summarizeSession } from '../lib/stats'
import { formatDate, formatDuration, startOfWeek } from '../lib/time'
import type { Session } from '../lib/types'

function weekLabel(week: number, now: number): string {
  const thisWeek = startOfWeek(now)
  if (week === thisWeek) return 'Deze week'
  if (week === startOfWeek(thisWeek - 1)) return 'Vorige week'
  return `Week van ${new Date(week).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace('.', '')}`
}

export function SessionsList() {
  const { sessions } = useData()
  const navigate = useNavigate()
  const now = useNow(30_000)
  const groups = new Map<number, Session[]>()
  for (const s of sessions) {
    const w = startOfWeek(s.startedAt)
    groups.set(w, [...(groups.get(w) ?? []), s])
  }

  return (
    <>
      <Heading className="text-4xl">Sessions</Heading>
      {!sessions.length && <Card><p className="text-muted">Nog geen sessies. Start er een op Home.</p></Card>}
      {[...groups].map(([week, list]) => (
        <section key={week} className="space-y-3">
          <Label>{weekLabel(week, now)}</Label>
          {list.map((s) => {
            const sum = summarizeSession(s, now)
            const live = s.endedAt === undefined
            return (
              <Card key={s.id} accent={live} onClick={() => navigate(live ? '/session' : `/sessions/${s.id}`)}>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <span className="font-display text-lg font-bold uppercase italic">{formatDate(s.startedAt)}</span>
                  {live ? <span className="-skew-x-12 rounded bg-blue px-2 text-xs font-bold text-white"><span className="inline-block skew-x-12">BEZIG</span></span> : <span className="text-sm text-muted">{formatDuration(sum.durationMs)}</span>}
                </div>
                <p className="mb-3 text-sm text-muted">{sum.played} games · <span className="text-blue-text">{sum.wins}W</span> <span className="text-orange-text">{sum.losses}L</span>{sum.totalTrainingMs > 0 ? ` · ${formatDuration(sum.totalTrainingMs)} training` : ''}</p>
                <WinLossBar wins={sum.wins} losses={sum.losses} />
              </Card>
            )
          })}
        </section>
      ))}
    </>
  )
}
