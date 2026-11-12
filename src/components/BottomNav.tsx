import { IconChartBar, IconHistory, IconHome, IconTarget, IconUser } from '@tabler/icons-react'
import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/', label: 'Home', Icon: IconHome },
  { to: '/sessions', label: 'Sessions', Icon: IconHistory },
  { to: '/training', label: 'Training', Icon: IconTarget },
  { to: '/stats', label: 'Stats', Icon: IconChartBar },
  { to: '/profile', label: 'Profile', Icon: IconUser },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-rl-line bg-rl-nav pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-[520px] justify-around">
        {ITEMS.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink to={to} end={to === '/'} className={({ isActive }) => `flex flex-col items-center gap-0.5 px-3 pb-2 pt-2.5 text-[11px] ${isActive ? 'text-blue-text' : 'text-muted'}`}>
              {({ isActive }) => (
                <>
                  <Icon size={22} stroke={1.8} aria-hidden="true" />
                  {label}
                  <span className={`mt-0.5 h-[3px] w-6 rounded-full ${isActive ? 'bg-blue' : 'bg-transparent'}`} />
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
