import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Building2, Users, BookOpen, Menu } from 'lucide-react'

const TABS = [
  { to: '/',         label: 'Home',     icon: LayoutDashboard, exact: true },
  { to: '/pgs',      label: 'PGs',      icon: Building2 },
  { to: '/leads',    label: 'Leads',    icon: Users },
  { to: '/bookings', label: 'Bookings', icon: BookOpen },
]

export default function MobileNav({ onMenuClick }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[var(--bg-surface)] border-t border-[var(--border)] lg:hidden safe-area-bottom">
      <div className="flex items-center">
        {TABS.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => `
              flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-medium transition-colors
              ${isActive
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-muted)]'
              }
            `}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
        {/* More button */}
        <button
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-medium text-[var(--text-muted)]"
          onClick={onMenuClick}
        >
          <Menu size={18} />
          More
        </button>
      </div>
    </nav>
  )
}
