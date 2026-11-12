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
    <nav className="fixed inset-x-0 bottom-0 z-20 px-2 pb-[max(8px,env(safe-area-inset-bottom))]">
      <ul className="glass mx-auto flex max-w-[520px] justify-around rounded-[20px] border border-[#3d8bff]/70 px-1 py-1.5 shadow-[0_0_20px_rgb(30_139_255/.35),inset_0_0_18px_rgb(30_139_255/.10)]">
        {ITEMS.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink to={to} end={to === '/'} className="block">
              {({ isActive }) => (
                <span className={`flex -skew-x-6 flex-col items-center rounded-xl border px-1 pb-1 pt-1.5 text-[11px] transition ${isActive ? 'border-[#5fb8ff] bg-[linear-gradient(180deg,rgb(30_110_255/.35),rgb(10_40_100/.5))] font-semibold text-white shadow-[0_0_14px_rgb(30_139_255/.6)]' : 'border-transparent text-[#c6d4ee]'}`}>
                  <span className="flex skew-x-6 flex-col items-center gap-0.5">
                    <Icon size={22} stroke={1.8} aria-hidden="true" className={isActive ? 'text-blue-text' : ''} />
                    {label}
                    <span className={`mt-0.5 h-[3px] w-6 rounded-full ${isActive ? 'bg-blue-text shadow-[0_0_6px_#5fb8ff]' : 'bg-transparent'}`} />
                  </span>
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
