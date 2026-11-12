import { useState } from 'react'
import { Card } from '../components/Card'
import { Heading, Label } from '../components/Label'
import { SkewButton } from '../components/SkewButton'
import { db } from '../db/client'

const input = 'w-full rounded-xl border border-rl-line bg-rl-nav px-4 py-3 text-lg text-ink outline-none focus:border-blue'

export function Login() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function sendCode() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Vul een geldig e-mailadres in.')
    setBusy(true); setError('')
    try { await db.auth.sendMagicCode({ email: email.trim() }); setStep('code') }
    catch { setError('De code kon niet worden verstuurd. Probeer het opnieuw.') }
    finally { setBusy(false) }
  }

  async function verify() {
    if (!/^\d{6}$/.test(code.trim())) return setError('De code bestaat uit 6 cijfers.')
    setBusy(true); setError('')
    try { await db.auth.signInWithMagicCode({ email: email.trim(), code: code.trim() }) }
    catch { setError('Die code klopt niet. Probeer het opnieuw.') }
    finally { setBusy(false) }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[520px] flex-col justify-center gap-6 p-5">
      <div>
        <Label>Rocket League</Label>
        <Heading className="mt-1 text-5xl">Session <span className="text-blue-text">Tracker</span></Heading>
      </div>
      <Card className="space-y-4">
        {step === 'email' ? (
          <form onSubmit={(e) => { e.preventDefault(); sendCode() }} className="space-y-4">
            <label className="block space-y-2"><Label>Je e-mail</Label>
              <input className={input} type="email" inputMode="email" autoComplete="email" placeholder="naam@voorbeeld.nl" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} />
            </label>
            <SkewButton variant="blue" size="lg" className="w-full" disabled={busy} onClick={sendCode}>Stuur code</SkewButton>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); verify() }} className="space-y-4">
            <p className="text-sm text-muted">We hebben een code van 6 cijfers gestuurd naar <span className="text-ink">{email}</span>.</p>
            <label className="block space-y-2"><Label>Code</Label>
              <input className={`${input} tracking-[0.4em]`} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError('') }} />
            </label>
            <SkewButton variant="blue" size="lg" className="w-full" disabled={busy} onClick={verify}>Inloggen</SkewButton>
            <button type="button" className="w-full text-sm text-muted" onClick={() => { setStep('email'); setCode(''); setError('') }}>Andere e-mail</button>
          </form>
        )}
        {error && <p className="text-sm text-orange-text" role="alert">{error}</p>}
      </Card>
    </main>
  )
}
