import { HashRouter, Route, Routes } from 'react-router-dom'
import { OfflineBadge } from './components/OfflineBadge'
import { hasConfig } from './db/supabase'
import { DataContext, type Ready } from './db/dataContext'
import { useMyData } from './db/useMyData'
import { Layout } from './screens/Layout'
import { ProfilePage } from './screens/ProfilePage'
import { SessionOverview } from './screens/SessionOverview'
import { SessionsList } from './screens/SessionsList'
import { StatsPage } from './screens/StatsPage'
import { TrainingPage } from './screens/TrainingPage'
import { Home } from './screens/Home'
import { IdleDialog } from './screens/IdleDialog'
import { SessionScreen } from './screens/SessionScreen'
import { Login } from './screens/Login'
import { Onboarding } from './screens/Onboarding'

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
          <Route path="/session" element={<SessionScreen />} />
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/sessions" element={<SessionsList />} />
            <Route path="/sessions/:id" element={<SessionOverview />} />
            <Route path="/training" element={<TrainingPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Routes>
        <IdleDialog />
        <OfflineBadge online={data.online} pending={data.pending} dropped={data.dropped} />
      </HashRouter>
    </DataContext.Provider>
  )
}
