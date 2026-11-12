import { useState } from 'react'
import { Card } from '../components/Card'
import { Heading, Label } from '../components/Label'
import { SkewButton } from '../components/SkewButton'
import { signIn, signUp } from '../db/auth'

const input = 'w-full rounded-xl border border-rl-line bg-rl-nav px-4 py-3 text-lg text-ink outline-none focus:border-blue'

function explain(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'E-mail of wachtwoord klopt niet.'
  if (m.includes('not confirmed')) return 'Bevestig eerst je e-mail via de link in je mail.'
  if (m.includes('already registered')) return 'Dit e-mailadres heeft al een account. Log in.'
  if (m.includes('rate limit') || m.includes('security purposes')) return 'Te veel pogingen. Wacht even en probeer het opnieuw.'
  if (m.includes('password')) return 'Kies een wachtwoord van minstens 6 tekens.'
  return 'Er ging iets mis. Controleer je internet en probeer het opnieuw.'
}

export function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    const mail = email.trim()
    if (!/^\S+@\S+\.\S+$/.test(mail)) return setError('Vul een geldig e-mailadres in.')
    if (password.length < 6) return setError('Kies een wachtwoord van minstens 6 tekens.')
    setBusy(true); setError(''); setInfo('')
    if (mode === 'login') {
      const { error: err } = await signIn(mail, password)
      if (err) setError(explain(err.message))
    } else {
      const { data, error: err } = await signUp(mail, password)
      if (err) setError(explain(err.message))
      else if (!data.session) { setInfo('Account gemaakt. Klik op de bevestigingslink in je mail en log daarna hier in.'); setMode('login') }
    }
    setBusy(false)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-[520px] flex-col justify-center gap-6 p-5">
      <div>
        <Label>Rocket League</Label>
        <Heading className="mt-1 text-5xl">Session <span className="text-blue-text">Tracker</span></Heading>
      </div>
      <Card className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <SkewButton variant={mode === 'login' ? 'light' : 'ghost'} onClick={() => { setMode('login'); setError('') }}>Inloggen</SkewButton>
          <SkewButton variant={mode === 'signup' ? 'light' : 'ghost'} onClick={() => { setMode('signup'); setError('') }}>Account maken</SkewButton>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); submit() }} className="space-y-4">
          <label className="block space-y-2"><Label>E-mail</Label>
            <input className={input} type="email" inputMode="email" autoComplete="email" placeholder="naam@voorbeeld.nl" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} />
          </label>
          <label className="block space-y-2"><Label>Wachtwoord</Label>
            <input className={input} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} />
          </label>
          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
          <SkewButton variant="blue" size="lg" className="w-full" disabled={busy} onClick={submit}>{mode === 'login' ? 'Inloggen' : 'Account maken'}</SkewButton>
        </form>
        {info && <p className="text-sm text-blue-text" role="status">{info}</p>}
        {error && <p className="text-sm text-orange-text" role="alert">{error}</p>}
      </Card>
    </main>
  )
}
