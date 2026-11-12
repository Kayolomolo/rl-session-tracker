import { IconChevronLeft } from '@tabler/icons-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/Card'
import { GoalRow } from '../components/GoalRow'
import { Heading, Label } from '../components/Label'
import { SkewButton } from '../components/SkewButton'
import { useData } from '../db/dataContext'
import { useNow } from '../hooks/useNow'
import { goalProgress, goalTitle, isActiveGoal, MAX_ACTIVE_GOALS, weekHistory, type Goal } from '../lib/goals'
import { formatDate } from '../lib/time'
import { GoalSheet } from './goals/GoalSheet'

export function GoalsPage() {
  const { goals, sessions, profile, actions } = useData()
  const navigate = useNavigate()
  const now = useNow(30_000)
  const [editing, setEditing] = useState<Goal | undefined>()
  const [open, setOpen] = useState(false)
  const active = goals.filter(isActiveGoal)
  const achieved = goals.filter((g) => !g.archivedAt && g.achievedAt)
  const edit = (g?: Goal) => { setEditing(g); setOpen(true) }

  return (
    <main className="mx-auto max-w-[520px] space-y-4 px-4 pb-12 pt-[calc(12px+env(safe-area-inset-top))]">
      <header className="flex items-center gap-2">
        <button type="button" onClick={() => navigate(-1)} aria-label="Terug" className="-ml-2 p-2 text-muted"><IconChevronLeft size={26} /></button>
        <Heading className="text-4xl">Doelen</Heading>
      </header>

      <Card>
        <Label className="mb-1">Actief · {active.length}/{MAX_ACTIVE_GOALS}</Label>
        {active.length ? (
          <div className="divide-y divide-rl-line">
            {active.map((g) => <GoalRow key={g.id} goal={g} progress={goalProgress(g, sessions, profile, now)} history={weekHistory(g, sessions, now)} onClick={() => edit(g)} />)}
          </div>
        ) : <p className="py-2 text-sm text-muted">Nog geen doelen. Stel er een om gericht te trainen.</p>}
      </Card>

      {active.length < MAX_ACTIVE_GOALS
        ? <SkewButton variant="blue" size="lg" className="w-full" onClick={() => edit()}>+ Nieuw doel</SkewButton>
        : <p className="text-center text-sm text-muted">Maximaal {MAX_ACTIVE_GOALS} doelen. Verwijder of archiveer er een.</p>}

      {achieved.length > 0 && (
        <Card>
          <Label className="mb-1">Gehaald</Label>
          <ul className="divide-y divide-rl-line">
            {achieved.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 py-2.5">
                <div>
                  <p className="font-display font-bold uppercase italic text-blue-text">{goalTitle(g.config)}</p>
                  <p className="text-xs text-muted">Gehaald op {formatDate(g.achievedAt!)}</p>
                </div>
                <button type="button" onClick={() => actions.archiveGoal(g)} className="rounded-lg border border-rl-line px-3 py-1.5 text-xs text-muted">Archiveren</button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <GoalSheet open={open} goal={editing} onClose={() => setOpen(false)} />
    </main>
  )
}
