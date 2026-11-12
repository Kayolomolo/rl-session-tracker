import { useState } from 'react'
import { Card } from '../components/Card'
import { Heading, Label } from '../components/Label'
import { SkewButton } from '../components/SkewButton'
import { createProfile } from '../db/actions'

export function Onboarding({ userId }: { userId: string }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const save = () => (name.trim() ? createProfile(userId, name) : setError('Vul een naam in'))
  return (
    <main className="mx-auto flex min-h-screen max-w-[520px] flex-col justify-center gap-6 p-5">
      <Heading className="text-4xl">Welkom op het <span className="text-blue-text">veld</span></Heading>
      <Card className="space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); save() }} className="space-y-4">
          <label className="block space-y-2"><Label>Je spelersnaam</Label>
            <input className="w-full rounded-xl border border-rl-line bg-rl-nav px-4 py-3 text-lg outline-none focus:border-blue" maxLength={24} value={name} onChange={(e) => { setName(e.target.value); setError('') }} />
          </label>
          <SkewButton variant="blue" size="lg" className="w-full" onClick={save}>Aan de slag</SkewButton>
        </form>
        {error && <p className="text-sm text-orange-text" role="alert">{error}</p>}
      </Card>
    </main>
  )
}
