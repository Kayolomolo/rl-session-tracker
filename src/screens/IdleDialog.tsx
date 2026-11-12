import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heading } from '../components/Label'
import { SkewButton } from '../components/SkewButton'
import { useData } from '../db/dataContext'
import { useNow } from '../hooks/useNow'
import { isIdle, resolveIdleEnd, runningActivity, suggestActivityMinutes } from '../lib/session'

export function IdleDialog() {
  const { active, profile, actions } = useData()
  const now = useNow(30_000)
  const navigate = useNavigate()
  const [minutes, setMinutes] = useState<string | null>(null)
  if (!active || !isIdle(active, now, profile.idleMinutes)) return null

  const running = runningActivity(active)
  const suggested = running ? suggestActivityMinutes(running, now, profile.idleMinutes) : 0
  const value = minutes ?? String(suggested)

  const end = () => {
    const mins = running ? Math.max(1, Math.min(600, Number(value) || suggested)) : undefined
    const { sessionEndedAt, activityEndedAt } = resolveIdleEnd(active, mins)
    const s = running && activityEndedAt !== undefined
      ? { ...active, activities: active.activities.map((a) => (a.id === running.id ? { ...a, endedAt: activityEndedAt } : a)) }
      : active
    if (running && activityEndedAt !== undefined) actions.stopActivity(active.id, running, activityEndedAt)
    actions.endSession(s, sessionEndedAt)
    setMinutes(null)
    navigate(`/sessions/${active.id}`)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-5">
      <div role="alertdialog" aria-label="Ben je nog bezig?" className="anim-rise w-full max-w-[440px] space-y-4 rounded-3xl border border-rl-line bg-rl-card p-6">
        <Heading className="text-3xl">Ben je nog <span className="text-blue-text">bezig?</span></Heading>
        <p className="text-muted">Je hebt al {profile.idleMinutes} minuten niets vastgelegd.</p>
        {running && (
          <label className="block space-y-2">
            <span className="text-sm">Hoeveel minuten deed je {running.type}?</span>
            <input inputMode="numeric" value={value} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-xl border border-rl-line bg-rl-nav px-4 py-3 text-lg outline-none focus:border-blue" />
          </label>
        )}
        <div className="grid grid-cols-2 gap-3">
          <SkewButton variant="ghost" size="lg" onClick={() => { actions.snoozeIdle(active, Date.now()); setMinutes(null) }}><span className="text-ink">Doorgaan</span></SkewButton>
          <SkewButton variant="blue" size="lg" onClick={end}>Beëindigen</SkewButton>
        </div>
      </div>
    </div>
  )
}
