import { Outlet } from 'react-router-dom'
import { BottomNav } from '../components/BottomNav'

export function Layout() {
  return (
    <>
      <main className="mx-auto max-w-[520px] space-y-4 px-4 pb-32 pt-[calc(16px+env(safe-area-inset-top))]">
        <Outlet />
      </main>
      <BottomNav />
    </>
  )
}
