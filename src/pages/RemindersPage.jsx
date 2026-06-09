import { useState } from 'react'
import { Bell, Plus, Trash2, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import { useReminders, useUpdateReminder, useDeleteReminder } from '../hooks'
import { Button, Badge, EmptyState, Skeleton, ConfirmDialog } from '../components/ui'
import { formatDate, isOverdue } from '../lib/utils'
import { toast } from 'sonner'
import ReminderForm from '../components/reminders/ReminderForm'

export default function RemindersPage() {
  const [showDone, setShowDone] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const { data: reminders = [], isLoading } = useReminders(
    showDone ? {} : { is_done: false }
  )
  const updateReminder = useUpdateReminder()
  const deleteReminder = useDeleteReminder()

  async function markDone(id, value) {
    try {
      await updateReminder.mutateAsync({ id, is_done: value })
      toast.success(value ? 'Marked as done' : 'Marked as pending')
    } catch {
      toast.error('Failed to update')
    }
  }

  async function handleDelete() {
    try {
      await deleteReminder.mutateAsync(deleteId)
      toast.success('Reminder deleted')
      setDeleteId(null)
    } catch {
      toast.error('Failed to delete')
    }
  }

  const pending = reminders.filter(r => !r.is_done)
  const overdue = pending.filter(r => isOverdue(r.due_date))
  const done = reminders.filter(r => r.is_done)

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reminders</h1>
          <p className="page-subtitle">
            {pending.length} pending
            {overdue.length > 0 && (
              <span className="text-[var(--destructive)] ml-1">· {overdue.length} overdue</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setShowDone(s => !s)}
          >
            {showDone ? 'Hide done' : 'Show done'}
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus size={14} />Add Reminder
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : reminders.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={Bell}
            title="No reminders"
            description="Add reminders to track follow-ups and important tasks"
            action={<Button onClick={() => setAddOpen(true)}><Plus size={14} />Add Reminder</Button>}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map(r => {
            const over = isOverdue(r.due_date) && !r.is_done
            return (
              <div
                key={r.id}
                className={`surface flex items-start gap-3 p-4 group transition-opacity ${r.is_done ? 'opacity-60' : ''}`}
              >
                {/* Checkbox */}
                <button
                  className={`mt-0.5 h-5 w-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
                    ${r.is_done
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                      : 'border-[var(--border)] hover:border-[var(--accent)]'
                    }`}
                  onClick={() => markDone(r.id, !r.is_done)}
                  title={r.is_done ? 'Mark as pending' : 'Mark as done'}
                >
                  {r.is_done && <CheckCircle2 size={12} />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${r.is_done ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                    {r.title}
                  </p>
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1">
                    {r.pgs?.name && (
                      <span className="text-xs text-[var(--text-muted)]">{r.pgs.name}</span>
                    )}
                    {r.leads?.student_name && (
                      <span className="text-xs text-[var(--text-muted)]">Re: {r.leads.student_name}</span>
                    )}
                    <span className={`text-xs flex items-center gap-1 ${over ? 'text-[var(--destructive)]' : 'text-[var(--text-muted)]'}`}>
                      {over ? <AlertCircle size={11} /> : <Clock size={11} />}
                      {formatDate(r.due_date)}
                    </span>
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {r.is_done && <Badge variant="booked">Done</Badge>}
                  {over && <Badge variant="rejected">Overdue</Badge>}
                  <button
                    className="btn-ghost h-7 w-12 p-0 flex items-center justify-center text-[var(--destructive)] opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setDeleteId(r.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ReminderForm open={addOpen} onClose={() => setAddOpen(false)} />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Reminder"
        description="Are you sure you want to delete this reminder?"
        loading={deleteReminder.isPending}
      />
    </div>
  )
}
