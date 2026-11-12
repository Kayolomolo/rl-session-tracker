import { IconChevronLeft } from '@tabler/icons-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/Card'
import { Heading, Label } from '../components/Label'
import { Sheet } from '../components/Sheet'
import { SkewButton } from '../components/SkewButton'
import { WinLossBar } from '../components/WinLossBar'
import { useData } from '../db/dataContext'
import { useNow } from '../hooks/useNow'
import { runningActivity } from '../lib/session'
import { counts, perMode, sessionMs } from '../lib/stats'
import { formatClock } from '../lib/time'
import { MODES } from '../lib/types'
import { ActivityPicker } from './session/ActivityPicker'
import { MatchPad } from './session/MatchPad'
import { RunningActivity } from './session/RunningActivity'
import { SessionLog } from './session/SessionLog'

export function SessionScreen() {
  const { active, actions } = useData()
  const navigate = useNavigate()
  const now = useNow(1000)
  const [ending, setEnding] = useState(false)

  if (!active) {
    return (
      <main className="mx-auto flex min-h-screen max-w-[520px] flex-col justify-center gap-4 p-5">
        <Heading className="text-4xl">Geen sessie bezig</Heading>
        <SkewButton variant="blue" size="lg" className="w-full !py-6" onClick={() => actions.startSession()}><span className="text-3xl">Start session</span></SkewButton>
        <button type="button" className="text-muted" onClick={() => navigate('/')}>Terug naar Home</button>
      </main>
    )
  }

  const running = runningActivity(active)
  const score = counts(active.matches)
  const modes = perMode(active.matches)
  const end = () => { const id = active.id; actions.endSession(active, Date.now()); setEnding(false); navigate(`/sessions/${id}`) }

  return (
    <main className="mx-auto max-w-[520px] space-y-4 px-4 pb-10 pt-[calc(12px+env(safe-area-inset-top))]">
      <header className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => navigate('/')} aria-label="Terug naar Home" className="-ml-2 p-2 text-muted"><IconChevronLeft size={26} /></button>
        <div className="flex-1">
          <Label>Sessie bezig</Label>
          <p className="font-display text-4xl font-bold italic leading-none tabular-nums">{formatClock(sessionMs(active, now))}</p>
        </div>
        <SkewButton variant="ghost" onClick={() => setEnding(true)}><span className="text-ink">Beëindigen</span></SkewButton>
      </header>

      {running && <RunningActivity session={active} activity={running} />}
      <MatchPad session={active} />

      <Card className="space-y-3">
        <div className="flex items-baseline justify-between">
          <Label>Score</Label>
          <span className="font-display text-2xl font-bold italic"><span className="text-blue-text">{score.wins}</span> – <span className="text-orange-text">{score.losses}</span></span>
        </div>
        {MODES.filter((m) => modes[m].played > 0).map((m) => (
          <div key={m} className="flex items-center gap-3 text-sm">
            <span className="w-8 font-display font-bold italic">{m}</span>
            <WinLossBar wins={modes[m].wins} losses={modes[m].losses} className="flex-1" />
            <span className="w-12 text-right text-muted">{modes[m].wins}–{modes[m].losses}</span>
          </div>
        ))}
      </Card>

      <ActivityPicker session={active} />
      <SessionLog session={active} now={now} />

      <Sheet open={ending} title="Sessie beëindigen?" onClose={() => setEnding(false)}>
        <p className="mb-4 text-muted">Je sessie stopt nu{running ? ` en ${running.type} wordt gestopt` : ''}. Daarna zie je je overzicht.</p>
        <div className="grid grid-cols-2 gap-3">
          <SkewButton variant="ghost" size="lg" onClick={() => setEnding(false)}><span className="text-ink">Annuleren</span></SkewButton>
          <SkewButton variant="blue" size="lg" onClick={end}>Beëindigen</SkewButton>
        </div>
      </Sheet>
    </main>
  )
}
