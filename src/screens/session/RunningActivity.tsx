import { useState } from 'react'
import { Card } from '../../components/Card'
import { Heading, Label } from '../../components/Label'
import { Sheet } from '../../components/Sheet'
import { SkewButton } from '../../components/SkewButton'
import { useData } from '../../db/dataContext'
import { useNow } from '../../hooks/useNow'
import { KIND_LABEL } from '../../lib/activities'
import { formatClock } from '../../lib/time'
import type { Activity, Session } from '../../lib/types'

export function RunningActivity({ session, activity }: { session: Session; activity: Activity }) {
  const { actions } = useData()
  const now = useNow(1000)
  const [stopping, setStopping] = useState(false)
  const [note, setNote] = useState('')
  const finish = (withNote: boolean) => { actions.stopActivity(session.id, activity, Date.now(), withNote ? note : undefined); setStopping(false); setNote('') }

  return (
    <Card accent className="flex items-center justify-between gap-3">
      <div>
        <Label>{KIND_LABEL[activity.kind]} loopt</Label>
        <Heading className="mt-1 text-xl">{activity.type} · <span className="text-blue-text">{formatClock(now - activity.startedAt)}</span></Heading>
      </div>
      <SkewButton variant="ghost" onClick={() => setStopping(true)}><span className="text-ink">Stop</span></SkewButton>
      <Sheet open={stopping} title={`${activity.type} stoppen`} onClose={() => setStopping(false)}>
        <div className="space-y-3">
          <Label>Notitie (optioneel)</Label>
          <textarea rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Wat ging goed, wat moet beter?"
            className="w-full rounded-xl border border-rl-line bg-rl-nav px-4 py-3 outline-none focus:border-blue" />
          <div className="grid grid-cols-2 gap-3">
            <SkewButton variant="ghost" size="lg" onClick={() => finish(false)}><span className="text-ink">Overslaan</span></SkewButton>
            <SkewButton variant="blue" size="lg" onClick={() => finish(true)}>Opslaan</SkewButton>
          </div>
        </div>
      </Sheet>
    </Card>
  )
}
