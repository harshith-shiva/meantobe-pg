import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Users, BookOpen,
  Bell, Settings, LogOut, X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getInitials } from '../../lib/utils'
import MascotGreeting from './Mascotgreeting'

const NAV = [
  { to: '/',          label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/pgs',       label: 'PGs',       icon: Building2 },
  { to: '/leads',     label: 'Leads',     icon: Users },
  { to: '/bookings',  label: 'Bookings',  icon: BookOpen },
  { to: '/reminders', label: 'Reminders', icon: Bell },
]

const BOTTOM_NAV = [
  { to: '/settings/users', label: 'Settings', icon: Settings },
]

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()

  const isActive = (to, exact) => {
    if (exact) return location.pathname === to
    return location.pathname.startsWith(to)
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar panel */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 flex flex-col
        w-[220px] bg-[var(--bg-surface)] border-r border-[var(--border)]
        transition-transform duration-200
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>

        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-[var(--accent)] flex items-center justify-center">
              <Building2 size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">PG Manager</span>
          </div>
          <button className="btn-ghost h-7 w-7 p-0 lg:hidden" onClick={onMobileClose}>
            <X size={14} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          <div className="space-y-0.5">
            {NAV.map(({ to, label, icon: Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                onClick={onMobileClose}
                className={({ isActive: navActive }) => `
                  flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors
                  ${navActive || isActive(to, exact)
                    ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Mascot — sits on the border-t line, legs dangling, gentle bob */}
        <MascotGreeting imageSrc="/mascot.png"  />

        {/* Bottom section */}
        <div className="border-t border-[var(--border)] p-2 space-y-0.5">
          {BOTTOM_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onMobileClose}
              className={({ isActive: navActive }) => `
                flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors
                ${navActive
                  ? 'bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                }
              `}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}

          {/* Profile */}
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
            <div className="h-6 w-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
              {getInitials(profile?.full_name || 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[var(--text-primary)] truncate">
                {profile?.full_name || 'User'}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] truncate capitalize">
                {profile?.role || 'staff'}
              </div>
            </div>
            <button
              className="btn-ghost h-6 w-14 p-0 flex items-center justify-center flex-shrink-0"
              onClick={signOut}
              title="Sign out"
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>

      </aside>
    </>
  )
}