import { IconChevronLeft } from '@tabler/icons-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BoostMeter } from '../components/BoostMeter'
import { Card } from '../components/Card'
import { Heading, Label } from '../components/Label'
import { Sheet } from '../components/Sheet'
import { SkewButton } from '../components/SkewButton'
import { TimeRing } from '../components/TimeRing'
import { WinLossBar } from '../components/WinLossBar'
import { useData } from '../db/dataContext'
import { useNow } from '../hooks/useNow'
import { summarizeSession } from '../lib/stats'
import { formatDate, formatDuration, formatTime } from '../lib/time'
import { MODES } from '../lib/types'
import { SessionLog } from './session/SessionLog'

export function SessionOverview() {
  const { id } = useParams()
  const { sessions, actions } = useData()
  const navigate = useNavigate()
  const now = useNow(1000)
  const [confirm, setConfirm] = useState(false)
  const s = sessions.find((x) => x.id === id)

  if (!s) {
    return (
      <>
        <Heading className="text-3xl">Sessie niet gevonden</Heading>
        <SkewButton variant="ghost" onClick={() => navigate('/sessions')}><span className="text-ink">Naar Sessions</span></SkewButton>
      </>
    )
  }

  const sum = summarizeSession(s, now)
  const remove = () => { actions.deleteSession(s); navigate('/sessions') }

  return (
    <>
      <button type="button" onClick={() => navigate('/sessions')} className="-ml-1 flex items-center gap-1 text-sm text-muted"><IconChevronLeft size={18} />Sessions</button>
      <header>
        <Label>{formatDate(s.startedAt)} · {formatTime(s.startedAt)}{s.endedAt !== undefined ? ` – ${formatTime(s.endedAt)}` : ''}</Label>
        <Heading className="mt-1 text-5xl">{formatDuration(sum.durationMs)}</Heading>
        {s.endedAt === undefined && (
          <button type="button" onClick={() => navigate('/session')} className="mt-2 text-sm font-medium text-blue-text">Sessie loopt nog — ga verder</button>
        )}
      </header>

      <Card className="flex items-center gap-5">
        <BoostMeter value={sum.winRate} size={104} label="win%" />
        <div className="grid flex-1 grid-cols-3 gap-2 text-center">
          <div><Label>Games</Label><Heading className="mt-1 text-3xl">{sum.played}</Heading></div>
          <div><Label>Win</Label><Heading className="mt-1 text-3xl text-blue-text">{sum.wins}</Heading></div>
          <div><Label>Loss</Label><Heading className="mt-1 text-3xl text-orange-text">{sum.losses}</Heading></div>
        </div>
      </Card>

      <Card className="space-y-3">
        <Label>Per gamemode</Label>
        {MODES.map((m) => {
          const c = sum.perMode[m]
          return (
            <div key={m} className={`flex items-center gap-3 ${c.played ? '' : 'opacity-50'}`}>
              <span className="w-9 font-display text-lg font-bold italic">{m}</span>
              <WinLossBar wins={c.wins} losses={c.losses} className="flex-1" />
              <span className="w-20 text-right text-sm"><span className="text-blue-text">{c.wins}</span>–<span className="text-orange-text">{c.losses}</span> · {c.winRate === null ? '–' : `${c.winRate}%`}</span>
            </div>
          )
        })}
      </Card>

      <Card className="space-y-4">
        <Label>Tijdverdeling</Label>
        <TimeRing parts={[{ label: 'Warm-up', ms: sum.warmupMs, color: 'blue' }, { label: 'Training', ms: sum.trainingMs, color: 'orange' }, { label: 'Wedstrijden en pauze', ms: sum.otherMs, color: 'muted' }]} />
        <div className="flex items-baseline justify-between border-t border-rl-line pt-3">
          <span className="text-sm text-muted">Totale trainingsduur</span>
          <span className="font-display text-xl font-bold italic">{formatDuration(sum.totalTrainingMs)}</span>
        </div>
      </Card>

      <SessionLog session={s} now={now} editable={false} />

      <SkewButton variant="ghost" className="w-full" onClick={() => setConfirm(true)}><span className="text-orange-text">Verwijder sessie</span></SkewButton>
      <Sheet open={confirm} title="Sessie verwijderen?" onClose={() => setConfirm(false)}>
        <p className="mb-4 text-muted">Alle wedstrijden, warm-ups en trainingen van deze sessie worden verwijderd. Dit kan niet ongedaan worden gemaakt.</p>
        <div className="grid grid-cols-2 gap-3">
          <SkewButton variant="ghost" size="lg" onClick={() => setConfirm(false)}><span className="text-ink">Annuleren</span></SkewButton>
          <SkewButton variant="orange" size="lg" onClick={remove}>Verwijderen</SkewButton>
        </div>
      </Sheet>
    </>
  )
}
