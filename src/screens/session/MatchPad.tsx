import { useCallback, useRef, useState } from 'react'
import { Card } from '../../components/Card'
import { SkewButton } from '../../components/SkewButton'
import { Toast } from '../../components/Toast'
import { useData } from '../../db/dataContext'
import { currentMmr } from '../../lib/goals'
import { quickMmrPicks } from '../../lib/mmr'
import { matchFields } from '../../lib/session'
import { MODES, type Mode, type Result, type Session } from '../../lib/types'

export function MatchPad({ session }: { session: Session }) {
  const { profile, actions, sessions } = useData()
  const [mode, setMode] = useState<Mode>(profile.lastMode)
  const [locked, setLocked] = useState(false)
  const [toast, setToast] = useState<{ id: string; label: string; picks: number[] } | null>(null)
  const [mmr, setMmr] = useState('')
  const sessionRef = useRef(session)
  sessionRef.current = session

  const pickMode = (m: Mode) => { setMode(m); if (m !== profile.lastMode) actions.updateProfile({ lastMode: m }) }

  const log = (result: Result) => {
    if (locked) return
    setLocked(true)
    setTimeout(() => setLocked(false), 400)
    const prev = currentMmr(sessions, profile, mode)
    const id = actions.addMatch(session.id, matchFields(profile, mode, result, Date.now()))
    setMmr(prev !== undefined ? String(prev) : '')
    setToast({ id, label: `${mode} · ${result === 'win' ? 'Win' : 'Loss'} opgeslagen`, picks: quickMmrPicks(result, prev) })
  }

  const close = useCallback(() => setToast(null), [])
  const undo = () => { if (toast) actions.deleteMatch(toast.id); setToast(null) }
  const saveMmr = (raw: string = mmr) => {
    const value = Number(raw)
    const match = sessionRef.current.matches.find((x) => x.id === toast?.id)
    if (match && Number.isFinite(value) && value > 0 && value < 5000) actions.setMatchMmr(session.id, match, Math.round(value))
    setToast(null)
  }

  return (
    <Card className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {MODES.map((m) => (
          <SkewButton key={m} variant={m === mode ? 'light' : 'ghost'} onClick={() => pickMode(m)} ariaLabel={`Gamemode ${m}`}>{m}</SkewButton>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 px-1">
        <SkewButton variant="blue" size="xl" disabled={locked} onClick={() => log('win')}>Win</SkewButton>
        <SkewButton variant="orange" size="xl" disabled={locked} onClick={() => log('loss')}>Loss</SkewButton>
      </div>
      {toast && (
        <Toast key={toast.id} message={toast.label} actionLabel="Ongedaan maken" onAction={undo} onClose={close} durationMs={profile.askMmr ? 15000 : 5000}>
          {profile.askMmr && toast.picks.length > 0 && (
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {toast.picks.map((v) => (
                <button key={v} type="button" onClick={() => saveMmr(String(v))} aria-label={`MMR ${v} opslaan`}
                  className="rounded-lg border border-[#3d8bff]/60 bg-[#0f2c5c] py-2 font-display text-lg font-bold italic text-white active:scale-95">{v}</button>
              ))}
            </div>
          )}
          {profile.askMmr && (
            <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); saveMmr() }}>
              <input inputMode="numeric" placeholder="MMR (optioneel)" value={mmr} onChange={(e) => setMmr(e.target.value.replace(/\D/g, ''))}
                className="min-w-0 flex-1 rounded-lg border border-rl-line bg-rl-card px-3 py-2 outline-none focus:border-blue" />
              <button type="submit" className="rounded-lg bg-blue px-4 font-medium text-white">OK</button>
            </form>
          )}
        </Toast>
      )}
    </Card>
  )
}
