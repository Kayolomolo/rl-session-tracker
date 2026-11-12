import { IconBattery2, IconFlame, IconMedal, IconTrophy } from '@tabler/icons-react'
import type { ReactNode } from 'react'
import { Card } from '../../components/Card'
import { Heading, Label } from '../../components/Label'
import { bestMode, fatigue, records, warmupEffect, type Insight } from '../../lib/insights'
import { formatDate, formatDuration } from '../../lib/time'
import type { Session } from '../../lib/types'

function Row({ icon, title, insight }: { icon: ReactNode; title: string; insight: Insight }) {
  return (
    <li className="flex gap-3 py-2.5">
      <span className={`mt-0.5 shrink-0 ${insight.ok ? 'text-orange-text' : 'text-muted'}`}>{icon}</span>
      <div>
        <p className="text-xs uppercase tracking-widest text-muted">{title}</p>
        {insight.ok ? (
          <>
            <p className="text-sm">{insight.text}</p>
            {insight.tip && <p className="text-xs text-orange-text">{insight.tip}</p>}
          </>
        ) : <p className="text-sm text-muted">{insight.need}</p>}
      </div>
    </li>
  )
}

export function InsightsCard({ sessions, now }: { sessions: Session[]; now: number }) {
  const rec = records(sessions, now)
  return (
    <Card className="space-y-1">
      <Label>Inzichten</Label>
      <ul className="divide-y divide-rl-line">
        <Row icon={<IconTrophy size={20} aria-hidden="true" />} title="Beste modus" insight={bestMode(sessions)} />
        <Row icon={<IconBattery2 size={20} aria-hidden="true" />} title="Vermoeidheid" insight={fatigue(sessions)} />
        <Row icon={<IconFlame size={20} aria-hidden="true" />} title="Warm-up" insight={warmupEffect(sessions)} />
      </ul>
      <div className="flex items-center gap-2 pt-2 text-xs uppercase tracking-widest text-muted"><IconMedal size={18} className="text-orange-text" aria-hidden="true" />Records</div>
      {rec ? (
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div><Heading className="text-2xl">{rec.longestWinStreak}</Heading><p className="text-[11px] text-muted">wins op rij</p></div>
          <div><Heading className="text-2xl">{formatDuration(rec.longestSessionMs)}</Heading><p className="text-[11px] text-muted">langste sessie</p></div>
          <div><Heading className="text-2xl">{rec.mostGamesInDay}</Heading><p className="text-[11px] text-muted">games op {rec.mostGamesDay ? formatDate(rec.mostGamesDay) : 'één dag'}</p></div>
        </div>
      ) : <p className="text-sm text-muted">Speel je eerste sessie voor je records.</p>}
    </Card>
  )
}
