import { createContext, useContext } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { hasConfig } from './db/supabase'
import { useMyData, type MyData } from './db/useMyData'
import { Layout, Placeholder } from './screens/Layout'
import { Login } from './screens/Login'
import { Onboarding } from './screens/Onboarding'

type Ready = MyData & { user: NonNullable<MyData['user']>; profile: NonNullable<MyData['profile']>; actions: NonNullable<MyData['actions']> }
const DataContext = createContext<Ready | null>(null)
export function useData(): Ready {
  const d = useContext(DataContext)
  if (!d) throw new Error('useData buiten DataContext')
  return d
}

function Centered({ children }: { children: React.ReactNode }) {
  return <main className="flex min-h-screen items-center justify-center p-6 text-center text-muted">{children}</main>
}

export default function App() {
  if (!hasConfig) return <Centered>Stel VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY in in .env.local</Centered>
  return <Gate />
}

function Gate() {
  const data = useMyData()
  if (data.isLoading) return <Centered><span className="font-display text-2xl font-bold uppercase italic text-blue-text">Laden…</span></Centered>
  if (data.error) return <Centered>Er ging iets mis: {data.error}</Centered>
  if (!data.user) return <Login />
  if (!data.actions) return null
  if (!data.profile) return <Onboarding actions={data.actions} />
  return (
    <DataContext.Provider value={data as Ready}>
      <HashRouter>
        <Routes>
          <Route path="/session" element={<Placeholder title="Sessie" />} />
          <Route element={<Layout />}>
            <Route index element={<Placeholder title="Home" />} />
            <Route path="/sessions" element={<Placeholder title="Sessions" />} />
            <Route path="/sessions/:id" element={<Placeholder title="Overzicht" />} />
            <Route path="/training" element={<Placeholder title="Training" />} />
            <Route path="/stats" element={<Placeholder title="Stats" />} />
            <Route path="/profile" element={<Placeholder title="Profile" />} />
          </Route>
        </Routes>
      </HashRouter>
    </DataContext.Provider>
  )
}
