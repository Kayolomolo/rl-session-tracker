import { IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { Card } from '../../components/Card'
import { Label } from '../../components/Label'
import { useData } from '../../db/dataContext'
import { KIND_LABEL } from '../../lib/activities'
import { activityMs } from '../../lib/stats'
import { formatDuration, formatTime } from '../../lib/time'
import type { Session } from '../../lib/types'

type Item = { id: string; at: number; kind: 'match' | 'activity'; title: string; sub?: string; tone: 'blue' | 'orange' | 'ink' }

export function SessionLog({ session, now, editable = true }: { session: Session; now: number; editable?: boolean }) {
  const { actions } = useData()
  const [confirm, setConfirm] = useState<string | null>(null)
  const items: Item[] = [
    ...session.matches.map((x): Item => ({ id: x.id, at: x.playedAt, kind: 'match', title: `${x.mode} · ${x.result === 'win' ? 'Win' : 'Loss'}`, sub: [x.rank, x.mmr ? `${x.mmr} MMR` : ''].filter(Boolean).join(' · ') || undefined, tone: x.result === 'win' ? 'blue' : 'orange' })),
    ...session.activities.map((a): Item => ({ id: a.id, at: a.startedAt, kind: 'activity', title: `${KIND_LABEL[a.kind]} · ${a.type}`, sub: [a.endedAt === undefined ? 'loopt' : formatDuration(activityMs(a, now)), a.note].filter(Boolean).join(' · '), tone: 'ink' })),
  ].sort((a, b) => b.at - a.at)

  if (!items.length) return null
  const remove = (it: Item) => { if (it.kind === 'match') actions.deleteMatch(it.id); else actions.deleteActivity(it.id); setConfirm(null) }

  return (
    <Card>
      <Label className="mb-2">Deze sessie</Label>
      <ul className="divide-y divide-rl-line">
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-3 py-2.5">
            <span className="w-11 shrink-0 text-xs text-muted">{formatTime(it.at)}</span>
            <div className="min-w-0 flex-1">
              <p className={`font-display font-bold uppercase italic ${it.tone === 'blue' ? 'text-blue-text' : it.tone === 'orange' ? 'text-orange-text' : ''}`}>{it.title}</p>
              {it.sub && <p className="truncate text-xs text-muted">{it.sub}</p>}
            </div>
            {editable && (confirm === it.id ? (
              <button type="button" onClick={() => remove(it)} className="rounded-lg border border-orange px-2 py-1 text-xs text-orange-text">Verwijder</button>
            ) : (
              <button type="button" onClick={() => setConfirm(it.id)} aria-label={`Verwijder ${it.title}`} className="p-1 text-muted"><IconTrash size={18} /></button>
            ))}
          </li>
        ))}
      </ul>
    </Card>
  )
}
