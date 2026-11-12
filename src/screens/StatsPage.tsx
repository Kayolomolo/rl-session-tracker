import { BoostMeter } from '../components/BoostMeter'
import { Card } from '../components/Card'
import { Heading, Label } from '../components/Label'
import { WinLossBar } from '../components/WinLossBar'
import { useData } from '../db/dataContext'
import { useNow } from '../hooks/useNow'
import { totals } from '../lib/stats'
import { formatDuration } from '../lib/time'
import { MODES } from '../lib/types'

export function StatsPage() {
  const { sessions } = useData()
  const now = useNow(30_000)
  const t = totals(sessions, now)
  return (
    <>
      <Heading className="text-4xl">Stats</Heading>
      <Card className="flex items-center gap-5">
        <BoostMeter value={t.winRate} size={104} label="win%" />
        <div className="grid flex-1 grid-cols-2 gap-3">
          <div><Label>Games</Label><Heading className="mt-1 text-3xl">{t.played}</Heading></div>
          <div><Label>Sessies</Label><Heading className="mt-1 text-3xl">{t.sessions}</Heading></div>
          <div className="col-span-2"><Label>Totale speeltijd</Label><Heading className="mt-1 text-2xl">{formatDuration(t.playedMs)}</Heading></div>
        </div>
      </Card>
      <Card className="space-y-3">
        <Label>Per gamemode</Label>
        {MODES.map((m) => {
          const c = t.perMode[m]
          return (
            <div key={m} className="flex items-center gap-3">
              <span className="w-9 font-display text-lg font-bold italic">{m}</span>
              <WinLossBar wins={c.wins} losses={c.losses} className="flex-1" />
              <span className="w-24 text-right text-sm"><span className="text-blue-text">{c.wins}</span>–<span className="text-orange-text">{c.losses}</span> · {c.winRate === null ? '–' : `${c.winRate}%`}</span>
            </div>
          )
        })}
      </Card>
      <p className="text-center text-xs text-muted">Grafieken over tijd komen in fase 2.</p>
    </>
  )
}
