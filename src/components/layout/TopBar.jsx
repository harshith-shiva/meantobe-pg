import { Menu, Sun, Moon, Bell } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useLocation } from 'react-router-dom'

const ROUTE_LABELS = {
  '/':                  'Dashboard',
  '/pgs':               'PGs',
  '/pgs/new':           'Add PG',
  '/leads':             'Leads',
  '/bookings':          'Bookings',
  '/reminders':         'Reminders',
  '/settings/users':    'Settings · Users',
  '/settings/profile':  'Settings · Profile',
}

export default function TopBar({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const label = (() => {
    const path = location.pathname
    if (ROUTE_LABELS[path]) return ROUTE_LABELS[path]
    if (path.startsWith('/pgs/') && path.endsWith('/edit')) return 'Edit PG'
    if (path.startsWith('/pgs/')) return 'PG Details'
    return ''
  })()

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-[var(--border)] bg-[var(--bg-surface)] flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button className="btn-ghost h-8 w-8 p-0 lg:hidden" onClick={onMenuClick}>
          <Menu size={16} />
        </button>
        <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
      </div>

      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <button
          className="btn-ghost h-8 w-8 p-0 flex items-center justify-center"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark'
            ? <Sun size={15} />
            : <Moon size={15} />
          }
        </button>
      </div>
    </header>
  )
}
