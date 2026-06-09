import { useState } from 'react'
import { UserPlus, Users, Shield, User } from 'lucide-react'
import { useProfiles } from '../../hooks'
import { Button, Spinner, Skeleton, Card } from '../../components/ui'
import { supabase } from '../../lib/supabase'
import { getInitials, formatDate } from '../../lib/utils'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'

export default function UsersSettingsPage() {
  const { profile: currentProfile } = useAuth()
  const { data: profiles = [], isLoading } = useProfiles()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  const isSuperadmin = currentProfile?.role === 'superadmin'

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail) return
    setInviting(true)
    try {
      const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail)
      if (error) throw error
      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
    } catch (err) {
      // Fallback: show manual instruction if admin API not accessible from client
      toast.error('Invite failed. Use the Supabase dashboard to invite users, or ensure service role key is configured.')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="page-container max-w-2xl">
      <div className="mb-6">
        <h1 className="page-title">Team & Access</h1>
        <p className="page-subtitle">Manage who has access to PG Manager</p>
      </div>

      {/* Invite section — superadmin only */}
      {isSuperadmin && (
        <div className="surface p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus size={15} className="text-[var(--text-muted)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Invite a team member</h2>
          </div>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              className="input flex-1"
              type="email"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              required
            />
            <Button type="submit" disabled={inviting}>
              {inviting ? <Spinner size={13} /> : <UserPlus size={13} />}
              Invite
            </Button>
          </form>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            They'll receive an email to set their password. No signup page exists — access is invite-only.
          </p>
        </div>
      )}

      {/* Current team */}
      <div className="surface overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
          <Users size={14} className="text-[var(--text-muted)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Team members</h2>
          <span className="text-xs text-[var(--text-muted)] ml-1">({profiles.length})</span>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] text-sm">No team members yet</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {profiles.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  {getInitials(p.full_name || p.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {p.full_name || '(No name set)'}
                    {p.id === currentProfile?.id && (
                      <span className="ml-2 text-xs text-[var(--text-muted)]">(you)</span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] truncate">{p.email}</div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {p.role === 'superadmin'
                    ? <span className="badge badge-booked flex items-center gap-1"><Shield size={10} />Admin</span>
                    : <span className="badge badge-new flex items-center gap-1"><User size={10} />Staff</span>
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="mt-4 p-4 rounded-md border border-[var(--border)] bg-[var(--bg-surface)]">
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          <strong className="text-[var(--text-primary)]">Access policy:</strong> This is a private internal tool.
          There is no public signup page. New accounts can only be created via invitation from an admin.
          To remove a user, go to the Supabase dashboard → Authentication → Users.
        </p>
      </div>
    </div>
  )
}
