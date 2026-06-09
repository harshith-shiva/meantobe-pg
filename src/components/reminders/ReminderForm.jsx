import { useState } from 'react'
import { useCreateReminder, usePGs, useLeads } from '../../hooks'
import { Modal, Button, Spinner } from '../ui'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'

export default function ReminderForm({ open, onClose, pgId }) {
  const { user } = useAuth()
  const { data: pgs = [] } = usePGs()
  const createReminder = useCreateReminder()

  const [form, setForm] = useState({
    title: '',
    due_date: '',
    pg_id: pgId || '',
    lead_id: '',
  })

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const { data: leads = [] } = useLeads({ pg_id: form.pg_id || undefined })

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title || !form.due_date) {
      toast.error('Title and due date are required')
      return
    }
    try {
      await createReminder.mutateAsync({
        title: form.title,
        due_date: form.due_date,
        pg_id: form.pg_id || null,
        lead_id: form.lead_id || null,
        is_done: false,
        created_by: user.id,
      })
      toast.success('Reminder added')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to add reminder')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Reminder">
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="label">Reminder Title *</label>
          <input
            className="input"
            placeholder="e.g. Call owner tomorrow, Student visit on Friday"
            value={form.title}
            onChange={set('title')}
            required
          />
        </div>
        <div>
          <label className="label">Due Date *</label>
          <input className="input" type="date" value={form.due_date} onChange={set('due_date')} required />
        </div>
        {!pgId && (
          <div>
            <label className="label">Linked PG (optional)</label>
            <select className="select" value={form.pg_id} onChange={set('pg_id')}>
              <option value="">No PG</option>
              {pgs.map(pg => (
                <option key={pg.id} value={pg.id}>{pg.name}</option>
              ))}
            </select>
          </div>
        )}
        {leads.length > 0 && (
          <div>
            <label className="label">Linked Lead (optional)</label>
            <select className="select" value={form.lead_id} onChange={set('lead_id')}>
              <option value="">No lead</option>
              {leads.map(l => (
                <option key={l.id} value={l.id}>{l.student_name} — {l.phone}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={createReminder.isPending}>
            {createReminder.isPending && <Spinner size={13} />}
            Add Reminder
          </Button>
        </div>
      </form>
    </Modal>
  )
}
