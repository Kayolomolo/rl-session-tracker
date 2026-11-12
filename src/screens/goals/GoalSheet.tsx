import { useEffect, useState } from 'react'
import { Sheet } from '../../components/Sheet'
import { SkewButton } from '../../components/SkewButton'
import { RangePicker } from '../../components/charts/RangePicker'
import { Label } from '../../components/Label'
import { useData } from '../../db/dataContext'
import { activityOptions } from '../../lib/activities'
import { validateGoal, type Goal, type GoalConfig, type GoalTarget } from '../../lib/goals'
import { hasDivisions, RANK_TIERS } from '../../lib/ranks'
import { MODES, type Mode } from '../../lib/types'
import { RankIcon } from '../../components/RankIcon'

type Kind = GoalConfig['kind']
const KINDS: { value: Kind; label: string; sub: string }[] = [
  { value: 'training', label: 'Training', sub: 'Minuten of keren per week' },
  { value: 'winrate', label: 'Winpercentage', sub: 'Per week of maand' },
  { value: 'rank', label: 'Rank', sub: 'Een rank halen' },
  { value: 'mmr', label: 'MMR', sub: 'Een MMR halen' },
]
const field = 'w-full rounded-xl border border-rl-line bg-rl-nav px-3 py-2.5 text-ink outline-none focus:border-blue'
const num = (v: string) => (v === '' ? NaN : Number(v))

function defaults(kind: Kind, mode: Mode): GoalConfig {
  switch (kind) {
    case 'training': return { kind, target: { kind: 'training' }, count: 'minutes', minutes: 60, times: 3 }
    case 'winrate': return { kind, mode, percent: 55, period: 'week', minGames: 10 }
    case 'rank': return { kind, mode, tier: 'Champion I', division: 1 }
    case 'mmr': return { kind, mode, mmr: 1000 }
  }
}

export function GoalSheet({ open, goal, onClose }: { open: boolean; goal?: Goal; onClose: () => void }) {
  const { profile, actions } = useData()
  const [config, setConfig] = useState<GoalConfig | null>(goal?.config ?? null)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  useEffect(() => { if (open) { setConfig(goal?.config ?? null); setError(''); setConfirmDelete(false) } }, [open, goal])

  const set = (patch: Partial<GoalConfig>) => { setError(''); setConfig((c) => (c ? ({ ...c, ...patch } as GoalConfig) : c)) }
  const save = () => {
    if (!config) return
    const err = validateGoal(config)
    if (err) return setError(err)
    actions.saveGoal(config, goal)
    onClose()
  }
  const remove = () => { if (goal) actions.deleteGoal(goal.id); onClose() }

  const targetValue = (t: GoalTarget) => (t.kind === 'activity' ? `a:${t.type}` : t.kind)
  const targetFrom = (v: string): GoalTarget => (v.startsWith('a:') ? { kind: 'activity', type: v.slice(2) } : { kind: v as 'warmup' | 'training' })
  const activities = [...new Set([...activityOptions('warmup', profile.customActivities.warmup), ...activityOptions('training', profile.customActivities.training)])]
  const modePicker = (mode: Mode) => <RangePicker value={mode} options={MODES.map((m) => ({ value: m, label: m }))} onChange={(m) => set({ mode: m } as Partial<GoalConfig>)} />

  return (
    <Sheet open={open} title={goal ? 'Doel bewerken' : 'Nieuw doel'} onClose={onClose}>
      {!config ? (
        <div className="grid grid-cols-2 gap-2">
          {KINDS.map((k) => (
            <button key={k.value} type="button" onClick={() => setConfig(defaults(k.value, profile.lastMode))} className="rounded-xl border border-rl-line bg-rl-nav p-3 text-left active:scale-[0.98]">
              <span className="block font-display text-lg font-bold uppercase italic">{k.label}</span>
              <span className="text-xs text-muted">{k.sub}</span>
            </button>
          ))}
        </div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save() }}>
          {config.kind === 'training' && (
            <>
              <label className="block space-y-2"><Label>Waarop telt het?</Label>
                <select className={field} value={targetValue(config.target)} onChange={(e) => set({ target: targetFrom(e.target.value) })}>
                  <option value="training">Alle training</option>
                  <option value="warmup">Alle warm-up</option>
                  {activities.map((a) => <option key={a} value={`a:${a}`}>{a}</option>)}
                </select>
              </label>
              <RangePicker value={config.count} options={[{ value: 'minutes', label: 'Totaal' }, { value: 'times', label: 'Aantal keer' }]} onChange={(v) => set({ count: v })} />
              <div className="flex gap-3">
                {config.count === 'times' && (
                  <label className="block flex-1 space-y-2"><Label>Keer per week</Label>
                    <input className={field} inputMode="numeric" value={Number.isNaN(config.times) ? '' : config.times ?? ''} onChange={(e) => set({ times: num(e.target.value.replace(/\D/g, '')) })} />
                  </label>
                )}
                <label className="block flex-1 space-y-2"><Label>{config.count === 'times' ? 'Minstens min per keer' : 'Minuten per week'}</Label>
                  <input className={field} inputMode="numeric" value={Number.isNaN(config.minutes) ? '' : config.minutes} onChange={(e) => set({ minutes: num(e.target.value.replace(/\D/g, '')) })} />
                </label>
              </div>
            </>
          )}
          {config.kind === 'winrate' && (
            <>
              {modePicker(config.mode)}
              <RangePicker value={config.period} options={[{ value: 'week', label: 'Deze week' }, { value: 'month', label: 'Deze maand' }]} onChange={(v) => set({ period: v })} />
              <div className="flex gap-3">
                <label className="block flex-1 space-y-2"><Label>Winst %</Label>
                  <input className={field} inputMode="numeric" value={Number.isNaN(config.percent) ? '' : config.percent} onChange={(e) => set({ percent: num(e.target.value.replace(/\D/g, '')) })} />
                </label>
                <label className="block flex-1 space-y-2"><Label>Minimaal games</Label>
                  <input className={field} inputMode="numeric" value={Number.isNaN(config.minGames) ? '' : config.minGames} onChange={(e) => set({ minGames: num(e.target.value.replace(/\D/g, '')) })} />
                </label>
              </div>
            </>
          )}
          {config.kind === 'rank' && (
            <>
              {modePicker(config.mode)}
              <div className="flex items-center gap-2">
                <RankIcon label={config.tier} size={40} />
                <select aria-label="Rank" className={`${field} min-w-0 flex-1`} value={config.tier} onChange={(e) => set({ tier: e.target.value, division: hasDivisions(e.target.value) ? config.division ?? 1 : undefined })}>
                  {RANK_TIERS.filter((t) => t !== 'Unranked').map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {hasDivisions(config.tier) && (
                  <select aria-label="Divisie" className={`${field} !w-28 shrink-0`} value={config.division ?? 1} onChange={(e) => set({ division: Number(e.target.value) })}>
                    {[1, 2, 3, 4].map((d) => <option key={d} value={d}>Div {d}</option>)}
                  </select>
                )}
              </div>
            </>
          )}
          {config.kind === 'mmr' && (
            <>
              {modePicker(config.mode)}
              <label className="block space-y-2"><Label>MMR</Label>
                <input className={field} inputMode="numeric" value={Number.isNaN(config.mmr) ? '' : config.mmr} onChange={(e) => set({ mmr: num(e.target.value.replace(/\D/g, '')) })} />
              </label>
            </>
          )}
          {error && <p className="text-sm text-orange-text" role="alert">{error}</p>}
          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
          <SkewButton variant="blue" size="lg" className="w-full" onClick={save}>Opslaan</SkewButton>
          {!goal && <button type="button" className="w-full text-sm text-muted" onClick={() => setConfig(null)}>Ander soort doel</button>}
          {goal && (confirmDelete
            ? <SkewButton variant="orange" className="w-full" onClick={remove}>Echt verwijderen</SkewButton>
            : <button type="button" className="w-full text-sm text-orange-text" onClick={() => setConfirmDelete(true)}>Doel verwijderen</button>)}
        </form>
      )}
    </Sheet>
  )
}
