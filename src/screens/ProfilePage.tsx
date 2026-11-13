import { useState } from 'react'
import { Card } from '../components/Card'
import { Heading, Label } from '../components/Label'
import { SkewButton } from '../components/SkewButton'
import { signOut } from '../db/auth'
import { useData } from '../db/dataContext'
import { hasDivisions, RANK_TIERS, rankLabel } from '../lib/ranks'
import { MODES, type Mode, type RankEntry, type TrackerProfile } from '../lib/types'
import { RankIcon } from '../components/RankIcon'
import { TrackerLink } from '../components/TrackerLink'
import { cleanTrackerId } from '../lib/mmr'

const field = 'rounded-xl border border-rl-line bg-rl-nav px-3 py-2.5 text-ink outline-none focus:border-blue'

export function ProfilePage() {
  const { profile, user, actions } = useData()
  const [name, setName] = useState(profile.name)
  const [trackerPlatform, setTrackerPlatform] = useState<TrackerProfile['platform']>('epic')
  const [idle, setIdle] = useState(String(profile.idleMinutes))
  const [trackerId, setTrackerId] = useState(profile.tracker?.id ?? '')
  const platform: TrackerProfile['platform'] = profile.tracker?.platform ?? trackerPlatform
  const saveTracker = (p: TrackerProfile['platform'], raw: string) => {
    const id = cleanTrackerId(raw)
    setTrackerPlatform(p)
    actions.updateProfile({ tracker: id ? { platform: p, id } : null })
  }

  const setRank = (mode: Mode, patch: Partial<RankEntry>) => {
    const current = profile.ranks[mode] ?? { tier: 'Unranked' }
    const next: RankEntry = { ...current, ...patch }
    if (!hasDivisions(next.tier)) delete next.division
    else if (!next.division) next.division = 1
    actions.updateProfile({ ranks: { ...profile.ranks, [mode]: next } })
  }
  const saveName = () => { const n = name.trim(); if (n && n !== profile.name) actions.updateProfile({ name: n.slice(0, 40) }); else setName(profile.name) }
  const saveIdle = () => { const v = Math.min(240, Math.max(5, Math.round(Number(idle) || 45))); setIdle(String(v)); if (v !== profile.idleMinutes) actions.updateProfile({ idleMinutes: v }) }

  return (
    <>
      <Heading className="text-4xl">Profile</Heading>
      <Card className="space-y-2">
        <Label>Spelersnaam</Label>
        <input className={`${field} w-full text-lg`} maxLength={40} value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} />
        <p className="text-xs text-muted">{user.email}</p>
      </Card>

      <Card className="space-y-4">
        <Label>Rank per gamemode</Label>
        {MODES.map((m) => {
          const r = profile.ranks[m] ?? { tier: 'Unranked' }
          return (
            <div key={m} className="space-y-2">
              <div className="flex items-center gap-2"><RankIcon label={rankLabel(r)} size={36} /><span className="font-display text-lg font-bold italic">{m}</span><span className="truncate text-xs text-muted">{rankLabel(r)}</span></div>
              <div className="flex gap-2">
                <select aria-label={`Rank ${m}`} className={`${field} min-w-0 flex-1`} value={r.tier} onChange={(e) => setRank(m, { tier: e.target.value })}>
                  {RANK_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {hasDivisions(r.tier) && (
                  <select aria-label={`Divisie ${m}`} className={field} value={r.division ?? 1} onChange={(e) => setRank(m, { division: Number(e.target.value) })}>
                    {[1, 2, 3, 4].map((d) => <option key={d} value={d}>Div {d}</option>)}
                  </select>
                )}
                <input aria-label={`MMR ${m}`} inputMode="numeric" placeholder="MMR" className={`${field} w-20`} defaultValue={r.mmr ?? ''} key={`${m}-${r.mmr ?? ''}`}
                  onBlur={(e) => { const v = Number(e.target.value); setRank(m, { mmr: v > 0 && v < 5000 ? Math.round(v) : undefined }) }} />
              </div>
            </div>
          )
        })}
      </Card>

      <Card className="space-y-3">
        <Label>Tracker-profiel</Label>
        <p className="text-xs text-muted">Je naam op rocketleague.tracker.network, om snel je MMR op te zoeken.</p>
        <div className="flex gap-2" role="group" aria-label="Platform">
          {(['epic', 'steam'] as const).map((p) => (
            <SkewButton key={p} variant={platform === p ? 'light' : 'ghost'} onClick={() => saveTracker(p, trackerId)} ariaLabel={`Platform ${p === 'epic' ? 'Epic' : 'Steam'}`}>{p === 'epic' ? 'Epic' : 'Steam'}</SkewButton>
          ))}
        </div>
        <input aria-label={platform === 'epic' ? 'Epic-naam' : 'Steam-ID'} placeholder={platform === 'epic' ? 'Epic-naam' : 'Steam-ID (17 cijfers)'} maxLength={64}
          className={`${field} w-full`} value={trackerId} onChange={(e) => setTrackerId(e.target.value)} onBlur={() => saveTracker(platform, trackerId)} />
        <TrackerLink tracker={profile.tracker} className="w-full" />
      </Card>

      <Card className="space-y-4">
        <label className="flex items-center justify-between gap-4">
          <span><span className="block font-medium">MMR na elke wedstrijd vragen</span><span className="text-xs text-muted">Een optioneel veldje na WIN of LOSS</span></span>
          <input type="checkbox" className="h-6 w-6 accent-[#1e8bff]" checked={profile.askMmr} onChange={(e) => actions.updateProfile({ askMmr: e.target.checked })} />
        </label>
        <label className="flex items-center justify-between gap-4">
          <span><span className="block font-medium">"Ben je nog bezig?" na</span><span className="text-xs text-muted">Minuten zonder activiteit (5–240)</span></span>
          <input inputMode="numeric" className={`${field} w-20 text-center`} value={idle} onChange={(e) => setIdle(e.target.value.replace(/\D/g, ''))} onBlur={saveIdle} />
        </label>
      </Card>

      <SkewButton variant="ghost" className="w-full" onClick={() => void signOut()}><span className="text-ink">Uitloggen</span></SkewButton>
    </>
  )
}
