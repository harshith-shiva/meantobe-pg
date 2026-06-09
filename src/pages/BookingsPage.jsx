import { useState } from 'react'
import { BookOpen, Plus, Pencil, Trash2, Phone } from 'lucide-react'
import { useBookings, useDeleteBooking, usePGs } from '../hooks'
import { Button, Badge, EmptyState, SearchInput, Skeleton, ConfirmDialog } from '../components/ui'
import { formatDate, getBookingStatusBadge } from '../lib/utils'
import { toast } from 'sonner'
import BookingForm from '../components/bookings/BookingForm'

const STATUSES = ['booked', 'partially_confirmed', 'vacated']
const STATUS_LABELS = { booked: 'Booked', partially_confirmed: 'Partial', vacated: 'Vacated' }

export default function BookingsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editBooking, setEditBooking] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const { data: bookings = [], isLoading } = useBookings({
    search,
    status: statusFilter || undefined,
  })
  const { data: pgs = [] } = usePGs()
  const deleteBooking = useDeleteBooking()

  async function handleDelete() {
    try {
      await deleteBooking.mutateAsync(deleteId)
      toast.success('Booking deleted')
      setDeleteId(null)
    } catch {
      toast.error('Failed to delete')
    }
  }

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = bookings.filter(b => b.status === s).length
    return acc
  }, {})

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bookings</h1>
          <p className="page-subtitle">{bookings.length} total bookings</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus size={14} />Add Booking</Button>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          className={`badge cursor-pointer ${!statusFilter ? 'badge-booked' : 'badge-new'}`}
          onClick={() => setStatusFilter('')}
        >
          All ({bookings.length})
        </button>
        {STATUSES.map(s => (
          <button
            key={s}
            className={`badge cursor-pointer ${statusFilter === s ? getBookingStatusBadge(s) : 'badge-new'}`}
            onClick={() => setStatusFilter(f => f === s ? '' : s)}
          >
            {STATUS_LABELS[s]} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <SearchInput value={search} onChange={setSearch} placeholder="Search by student name or phone…" className="mb-3" />

      {/* Table */}
      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th className="hidden sm:table-cell">Phone</th>
                <th className="hidden md:table-cell">PG</th>
                <th className="hidden lg:table-cell">Room</th>
                <th className="hidden md:table-cell">Move In</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}><Skeleton className="h-4" /></td>
                    ))}
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={BookOpen}
                      title="No bookings found"
                      description="Add a booking to track student move-ins"
                      action={<Button onClick={() => setAddOpen(true)}><Plus size={14} />Add Booking</Button>}
                    />
                  </td>
                </tr>
              ) : (
                bookings.map(b => (
                  <tr key={b.id} className="group">
                    <td>
                      <div className="font-medium text-[var(--text-primary)]">{b.student_name}</div>
                      {b.student_email && (
                        <div className="text-xs text-[var(--text-muted)] truncate max-w-[160px]">{b.student_email}</div>
                      )}
                    </td>
                    <td className="hidden sm:table-cell">
                      <a
                        href={`tel:${b.student_phone}`}
                        className="text-[var(--accent)] hover:underline flex items-center gap-1 text-sm"
                        onClick={e => e.stopPropagation()}
                      >
                        <Phone size={11} />{b.student_phone}
                      </a>
                    </td>
                    <td className="hidden md:table-cell text-[var(--text-muted)]">
                      <div>{b.pgs?.name || '—'}</div>
                      {b.pgs?.location && (
                        <div className="text-xs">{b.pgs.location}</div>
                      )}
                    </td>
                    <td className="hidden lg:table-cell text-[var(--text-muted)]">
                      {b.rooms?.room_number ? `Room ${b.rooms.room_number}` : '—'}
                    </td>
                    <td className="hidden md:table-cell text-[var(--text-muted)]">
                      {formatDate(b.move_in_date)}
                    </td>
                    <td>
                      <Badge variant={b.status}>
                        {STATUS_LABELS[b.status] || b.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="btn-ghost h-7 w-12 p-0 flex items-center justify-center"
                          onClick={() => setEditBooking(b)}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="btn-ghost h-7 w-12 p-0 flex items-center justify-center text-[var(--destructive)]"
                          onClick={() => setDeleteId(b.id)}
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

      {/* Add booking — no pgId needed from top level, user picks from form */}
      {addOpen && (
        <BookingForm
          open={addOpen}
          onClose={() => setAddOpen(false)}
          pgId={null}
        />
      )}
      {editBooking && (
        <BookingForm
          open={!!editBooking}
          onClose={() => setEditBooking(null)}
          existing={editBooking}
          pgId={editBooking.pg_id}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Booking"
        description="Are you sure you want to delete this booking?"
        loading={deleteBooking.isPending}
      />
    </div>
  )
}
