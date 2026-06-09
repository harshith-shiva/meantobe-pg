import { useState } from 'react'
import { Plus, Users, Pencil, Trash2, Phone } from 'lucide-react'
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead, usePGs } from '../hooks'
import { Button, Badge, EmptyState, SearchInput, Skeleton, ConfirmDialog, Modal } from '../components/ui'
import { formatDate } from '../lib/utils'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useSearchParams } from 'react-router-dom'

const STATUSES = ['new', 'called', 'visited', 'booked', 'rejected']

function LeadForm({ open, onClose, existing }) {
  const { user } = useAuth()
  const { data: pgs = [] } = usePGs()
  const createLead = useCreateLead()
  const updateLead = useUpdateLead()
  const isEdit = !!existing

  const [form, setForm] = useState(() => existing || {
    student_name: '', phone: '', pg_id: '', status: 'new'
  })

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (isEdit) {
        await updateLead.mutateAsync({ id: existing.id, ...form })
        toast.success('Lead updated')
      } else {
        await createLead.mutateAsync({ ...form, assigned_to: user.id })
        toast.success('Lead added')
      }
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to save lead')
    }
  }

  const isPending = createLead.isPending || updateLead.isPending

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Lead' : 'Add Lead'}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="label">Student Name *</label>
          <input className="input" placeholder="Full name" value={form.student_name}
            onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Phone *</label>
          <input className="input" placeholder="10-digit number" value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
        </div>
        <div>
          <label className="label">Interested PG</label>
          <select className="select" value={form.pg_id || ''}
            onChange={e => setForm(f => ({ ...f, pg_id: e.target.value }))}>
            <option value="">Select PG</option>
            {pgs.map(pg => (
              <option key={pg.id} value={pg.id}>{pg.name} — {pg.location}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="select" value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {STATUSES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isPending}>
            {isEdit ? 'Save Changes' : 'Add Lead'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function LeadsPage() {
  const [searchParams] = useSearchParams()
  const pgFilter = searchParams.get('pg') || ''
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editLead, setEditLead] = useState(null)
  const [deleteLeadId, setDeleteLeadId] = useState(null)

  const { data: leads = [], isLoading } = useLeads({
    search,
    status: statusFilter || undefined,
    pg_id: pgFilter || undefined,
  })
  const updateLead = useUpdateLead()
  const deleteLead = useDeleteLead()

  async function handleStatusChange(lead, newStatus) {
    try {
      await updateLead.mutateAsync({ id: lead.id, status: newStatus })
      toast.success('Status updated')
    } catch {
      toast.error('Failed to update status')
    }
  }

  async function handleDelete() {
    try {
      await deleteLead.mutateAsync(deleteLeadId)
      toast.success('Lead deleted')
      setDeleteLeadId(null)
    } catch {
      toast.error('Failed to delete')
    }
  }

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length
    return acc
  }, {})

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">{leads.length} total leads</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus size={14} />Add Lead</Button>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 flex-wrap">
        <button
          className={`badge cursor-pointer whitespace-nowrap transition-all ${!statusFilter ? 'badge-booked' : 'badge-new'}`}
          onClick={() => setStatusFilter('')}
        >
          All ({leads.length})
        </button>
        {STATUSES.map(s => (
          <button
            key={s}
            className={`badge cursor-pointer whitespace-nowrap transition-all ${statusFilter === s ? `badge-${s}` : 'badge-new'}`}
            onClick={() => setStatusFilter(f => f === s ? '' : s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <SearchInput value={search} onChange={setSearch} placeholder="Search by name or phone…" className="mb-3" />

      {/* Table */}
      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Phone</th>
                <th className="hidden sm:table-cell">Interested PG</th>
                <th>Status</th>
                <th className="hidden md:table-cell">Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}><Skeleton className="h-4" /></td>
                    ))}
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={Users}
                      title="No leads found"
                      description="Add your first lead to start tracking"
                      action={<Button onClick={() => setAddOpen(true)}><Plus size={14} />Add Lead</Button>}
                    />
                  </td>
                </tr>
              ) : (
                leads.map(lead => (
                  <tr key={lead.id} className="group">
                    <td>
                      <div className="font-medium text-[var(--text-primary)]">{lead.student_name}</div>
                    </td>
                    <td>
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-[var(--accent)] hover:underline flex items-center gap-1 text-sm"
                        onClick={e => e.stopPropagation()}
                      >
                        <Phone size={11} />{lead.phone}
                      </a>
                    </td>
                    <td className="hidden sm:table-cell text-[var(--text-muted)]">
                      {lead.pgs?.name || '—'}
                    </td>
                    <td>
                      {/* Inline status dropdown */}
                      <select
                        className="select h-7 py-0 text-xs w-auto pr-7 pl-2"
                        style={{ minWidth: 100 }}
                        value={lead.status}
                        onChange={e => handleStatusChange(lead, e.target.value)}
                        onClick={e => e.stopPropagation()}
                      >
                        {STATUSES.map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="hidden md:table-cell text-[var(--text-muted)]">
                      {formatDate(lead.created_at)}
                    </td>
                    <td>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="btn-ghost h-7 w-12 p-0 flex items-center justify-center"
                          onClick={() => setEditLead(lead)}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="btn-ghost h-7 w-12 p-0 flex items-center justify-center text-[var(--destructive)]"
                          onClick={() => setDeleteLeadId(lead.id)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LeadForm open={addOpen} onClose={() => setAddOpen(false)} />
      {editLead && (
        <LeadForm open={!!editLead} onClose={() => setEditLead(null)} existing={editLead} />
      )}

      <ConfirmDialog
        open={!!deleteLeadId}
        onClose={() => setDeleteLeadId(null)}
        onConfirm={handleDelete}
        title="Delete Lead"
        description="Are you sure you want to delete this lead? This cannot be undone."
        loading={deleteLead.isPending}
      />
    </div>
  )
}
