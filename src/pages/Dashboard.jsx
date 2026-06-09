import { Link } from 'react-router-dom'
import { Building2, Users, BookOpen, Bell, BedDouble, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { useDashboardStats, useReminders, useLeads } from '../hooks'
import { useUpdateReminder } from '../hooks'
import { StatCard, Skeleton, Badge } from '../components/ui'
import { formatDate, isOverdue, getLeadStatusBadge } from '../lib/utils'
import { toast } from 'sonner'

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="surface p-4 space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-12" />
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: reminders = [], isLoading: remLoading } = useReminders({ is_done: false })
  const { data: leads = [], isLoading: leadsLoading } = useLeads({})
  const updateReminder = useUpdateReminder()

  const pendingReminders = reminders.slice(0, 8)
  const recentLeads = leads.slice(0, 6)

  async function markDone(id) {
    try {
      await updateReminder.mutateAsync({ id, is_done: true })
      toast.success('Reminder marked as done')
    } catch {
      toast.error('Failed to update reminder')
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6">
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI Grid */}
      {statsLoading ? <KPISkeleton /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total PGs" value={stats?.totalPGs ?? 0} icon={Building2} trend={`${stats?.activePGs} active`} />
          <StatCard label="Occupancy" value={`${stats?.occupancyRate ?? 0}%`} icon={BedDouble} trend={`${stats?.occupiedBeds} / ${stats?.totalBeds} beds`} />
          <StatCard label="Total Leads" value={stats?.totalLeads ?? 0} icon={Users} trend={`${stats?.newLeads} new`} />
          <StatCard label="Bookings" value={stats?.activeBookings ?? 0} icon={BookOpen} trend={`${stats?.totalBookings} total`} />
          <StatCard label="Vacant Beds" value={stats?.vacantBeds ?? 0} icon={BedDouble} trend="Available now" />
          <StatCard label="Reminders Due" value={stats?.pendingReminders ?? 0} icon={Bell} trend={`${stats?.overdueReminders} overdue`} />
          <StatCard label="Active PGs" value={stats?.activePGs ?? 0} icon={Building2} trend="Currently listed" />
          <StatCard label="Confirmed" value={stats?.activeBookings ?? 0} icon={TrendingUp} trend="Booked + Partial" />
        </div>
      )}

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Pending Reminders */}
        <div className="surface overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-[var(--text-muted)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Pending Reminders</span>
              {reminders.length > 0 && (
                <span className="text-xs bg-[var(--accent)] text-white px-1.5 py-0.5 rounded-full">
                  {reminders.length}
                </span>
              )}
            </div>
            <Link to="/reminders" className="text-xs text-[var(--accent)] hover:underline">View all</Link>
          </div>

          {remLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : pendingReminders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-[var(--text-muted)]">
              <CheckCircle2 size={28} strokeWidth={1.5} className="mb-2 opacity-40" />
              <p className="text-sm">All caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {pendingReminders.map(r => {
                const overdue = isOverdue(r.due_date)
                return (
                  <div key={r.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors group">
                    <button
                      className="mt-0.5 h-4 w-4 rounded border border-[var(--border)] flex-shrink-0 hover:border-[var(--accent)] hover:bg-[var(--accent)] transition-colors group-hover:opacity-100 flex items-center justify-center"
                      onClick={() => markDone(r.id)}
                      title="Mark as done"
                    >
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)] truncate">{r.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {r.pgs?.name && (
                          <span className="text-xs text-[var(--text-muted)] truncate">{r.pgs.name}</span>
                        )}
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-xs flex-shrink-0 ${overdue ? 'text-[var(--destructive)]' : 'text-[var(--text-muted)]'}`}>
                      {overdue && <AlertCircle size={11} />}
                      <Clock size={11} />
                      {formatDate(r.due_date)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Leads */}
        <div className="surface overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[var(--text-muted)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Recent Leads</span>
            </div>
            <Link to="/leads" className="text-xs text-[var(--accent)] hover:underline">View all</Link>
          </div>

          {leadsLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : recentLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-[var(--text-muted)]">
              <Users size={28} strokeWidth={1.5} className="mb-2 opacity-40" />
              <p className="text-sm">No leads yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {recentLeads.map(lead => (
                <div key={lead.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors">
                  <div className="h-7 w-7 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-xs font-medium text-[var(--text-muted)] flex-shrink-0">
                    {lead.student_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] font-medium truncate">{lead.student_name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{lead.pgs?.name || '—'}</p>
                  </div>
                  <Badge variant={lead.status}>{lead.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
