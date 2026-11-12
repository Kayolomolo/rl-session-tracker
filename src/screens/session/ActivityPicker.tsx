import { useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { SkewButton } from '../../components/SkewButton'
import { useData } from '../../db/dataContext'
import { activityOptions, addCustom, KIND_LABEL } from '../../lib/activities'
import type { ActivityKind, Session } from '../../lib/types'

export function ActivityPicker({ session }: { session: Session }) {
  const { profile, actions } = useData()
  const [kind, setKind] = useState<ActivityKind | null>(null)
  const [custom, setCustom] = useState<string | null>(null)

  const close = () => { setKind(null); setCustom(null) }
  const start = (type: string) => { if (kind) actions.startActivity(session, kind, type, Date.now()); close() }
  const startCustom = () => {
    if (!kind || custom === null) return
    const clean = custom.trim().replace(/\s+/g, ' ')
    if (!clean) return
    const list = profile.customActivities[kind]
    const next = addCustom(list, clean)
    if (next !== list) actions.updateProfile({ customActivities: { ...profile.customActivities, [kind]: next } })
    const existing = activityOptions(kind, list).find((o) => o.toLowerCase() === clean.toLowerCase())
    start(existing ?? clean)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <SkewButton variant="ghost" size="lg" onClick={() => setKind('warmup')}><span className="text-ink">Warm-up</span></SkewButton>
        <SkewButton variant="ghost" size="lg" onClick={() => setKind('training')}><span className="text-ink">Training</span></SkewButton>
      </div>
      <Sheet open={kind !== null} title={kind ? `Start ${KIND_LABEL[kind]}` : ''} onClose={close}>
        {kind && custom === null && (
          <div className="grid grid-cols-2 gap-2">
            {activityOptions(kind, profile.customActivities[kind]).map((o) => (
              <button key={o} type="button" onClick={() => start(o)} className="rounded-xl border border-rl-line bg-rl-nav px-3 py-4 text-left font-medium active:scale-[0.98]">{o}</button>
            ))}
            <button type="button" onClick={() => setCustom('')} className="rounded-xl border border-dashed border-blue px-3 py-4 text-left font-medium text-blue-text">+ Custom</button>
          </div>
        )}
        {kind && custom !== null && (
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); startCustom() }}>
            <input autoFocus maxLength={40} placeholder="Bijv. Wall reads" value={custom} onChange={(e) => setCustom(e.target.value)}
              className="w-full rounded-xl border border-rl-line bg-rl-nav px-4 py-3 text-lg outline-none focus:border-blue" />
            <SkewButton variant="blue" size="lg" className="w-full" onClick={startCustom}>Start timer</SkewButton>
          </form>
        )}
      </Sheet>
    </>
  )
}
