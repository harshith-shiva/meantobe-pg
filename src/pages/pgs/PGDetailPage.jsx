import React,{ useState } from 'react'
import {useMemo} from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Building2, MapPin, Phone, Mail, BedDouble, IndianRupee, SquareArrowUpRight, Plus, Trash2,LogOut } from 'lucide-react'
import { usePG, useRooms, useNotes, useLeads, useBookings, useReminders, useCreateNote, useDeleteNote, useCreateRoom, useDeleteRoom, useUpdateRoom, useDeletePG,useUpdateBooking } from '../../hooks'
import { Button, Badge, Tabs, Skeleton, EmptyState, ConfirmDialog, Spinner, Modal } from '../../components/ui'
import { formatCurrency, formatDate, getLeadStatusBadge, getBookingStatusBadge, isOverdue } from '../../lib/utils'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import ReminderForm from '../../components/reminders/ReminderForm'
import BookingForm from '../../components/bookings/BookingForm'
import BulkRoomAddModal from '../../components/rooms/BulkRoomAddModal'
import { useTenants, useCreateTenant, useUpdateTenant, useDeleteTenant } from '../../hooks'
// ─── Notes Panel ──────────────────────────────────────────────────────────────
function NotesPanel({ pgId }) {
  const { user } = useAuth()
  const { data: notes = [], isLoading } = useNotes(pgId)
  const createNote = useCreateNote()
  const deleteNote = useDeleteNote()
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      await createNote.mutateAsync({ pg_id: pgId, content: content.trim(), created_by: user.id })
      setContent('')
      toast.success('Note added')
    } catch { toast.error('Failed to add note') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="surface p-4">
        <label className="label">Add a note</label>
        <textarea
          className="input mb-3"
          rows={3}
          placeholder="e.g. Owner wants rent increase next month, lift under maintenance…"
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
            {submitting ? <Spinner size={12} /> : <Plus size={12} />}
            Add Note
          </Button>
        </div>
      </form>

      {isLoading ? (
        <div className="space-y-2">{Array.from({length:2}).map((_,i)=><Skeleton key={i} className="h-16"/>)}</div>
      ) : notes.length === 0 ? (
        <EmptyState title="No notes yet" description="Add a note about this property" />
      ) : (
        <div className="space-y-2">
          {notes.map(note => (
            <div key={note.id} className="surface p-4 group">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-[var(--text-primary)] flex-1 whitespace-pre-wrap">{note.content}</p>
                <button
                  className="btn-ghost h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--destructive)] flex-shrink-0"
                  onClick={() => deleteNote.mutateAsync({ id: note.id, pg_id: pgId }).then(() => toast.success('Note deleted'))}
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-[var(--text-muted)]">
                <span>{note.profiles?.full_name || 'Unknown'}</span>
                <span>·</span>
                <span>{formatDate(note.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TenantExpandPanel({ roomId, pgId, totalBeds }) {
  const { data: tenants = [], isLoading: tenantsLoading } = useTenants(roomId)
  const { data: bookings = [], isLoading: bookingsLoading } = useBookings({
    room_id: roomId,
    status: 'booked',
  })

  const createTenant  = useCreateTenant()
  const updateTenant  = useUpdateTenant()
  const deleteTenant  = useDeleteTenant()
  const updateBooking = useUpdateBooking()

  const isLoading = tenantsLoading || bookingsLoading

  // ── Merge both sources into a unified list ──────────────────────────────────
  // Each item carries _source so we know which mutation to use when saving/removing.
  const mergedRows = useMemo(() => {
    const tenantRows = tenants.map(t => ({
      ...t,
      // canonical display fields
      name:              t.name,
      phone:             t.phone,
      email:             t.email,
      rent_payable_date: t.rent_payable_date,
      rent_paid:         t.rent_paid,
      _source:           'tenant',
    }))

    const bookingRows = bookings.map(b => ({
      id:                b.id,
      name:              b.student_name,
      phone:             b.student_phone,
      email:             b.student_email,
      rent_payable_date: b.rent_payable_date,
      rent_paid:         b.rent_paid ?? false,
      _source:           'booking',
    }))

    return [...tenantRows, ...bookingRows]
  }, [tenants, bookings])

  // ── Inline edit state: { [id]: { field: value } } ──────────────────────────
  const [edits, setEdits] = useState({})
  const [adding, setAdding] = useState(false)
  const [newTenant, setNewTenant] = useState({
    name: '', phone: '', email: '', rent_payable_date: '', rent_paid: false,
  })

  function setEdit(id, field, value) {
    setEdits(e => ({ ...e, [id]: { ...e[id], [field]: value } }))
  }

  async function saveEdit(row) {
    const changes = edits[row.id]
    if (!changes) return

    try {
      if (row._source === 'booking') {
        // Map display fields back to bookings column names
        const bookingChanges = {}
        if ('name'              in changes) bookingChanges.student_name    = changes.name
        if ('phone'             in changes) bookingChanges.student_phone   = changes.phone
        if ('email'             in changes) bookingChanges.student_email   = changes.email
        if ('rent_payable_date' in changes) bookingChanges.rent_payable_date = changes.rent_payable_date
        if ('rent_paid'         in changes) bookingChanges.rent_paid       = changes.rent_paid

        await updateBooking.mutateAsync({ id: row.id, ...bookingChanges })
      } else {
        await updateTenant.mutateAsync({ id: row.id, room_id: roomId, ...changes })
      }

      setEdits(e => { const n = { ...e }; delete n[row.id]; return n })
      toast.success('Saved')
    } catch {
      toast.error('Failed to save')
    }
  }

  // Vacate a booking-sourced row (no hard delete — tell user to use bookings page)
  async function handleVacate(row) {
    try {
      await updateBooking.mutateAsync({ id: row.id, status: 'vacated' })
      toast.success('Booking marked as vacated')
    } catch {
      toast.error('Failed to vacate')
    }
  }

  async function handleDeleteTenant(tenant) {
    try {
      await deleteTenant.mutateAsync({ id: tenant.id, room_id: roomId })
      toast.success('Tenant removed')
    } catch {
      toast.error('Failed to remove tenant')
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    try {
      await createTenant.mutateAsync({ ...newTenant, room_id: roomId, pg_id: pgId })
      setNewTenant({ name: '', phone: '', email: '', rent_payable_date: '', rent_paid: false })
      setAdding(false)
      toast.success('Tenant added')
    } catch {
      toast.error('Failed to add tenant')
    }
  }

  return (
    <div className="p-4 space-y-3 border-t border-[var(--border)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
          Tenants ({mergedRows.length}/{totalBeds} beds)
        </span>
        {mergedRows.length < totalBeds && (
          <Button size="sm" variant="secondary" onClick={() => setAdding(a => !a)}>
            <Plus size={11} />Add Tenant
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-16" />
      ) : mergedRows.length === 0 && !adding ? (
        <p className="text-xs text-[var(--text-muted)] py-2">
          No tenants recorded. Click "Add Tenant" to add one.
        </p>
      ) : (
        <div className="space-y-2">
          {mergedRows.map(row => {
            const e    = edits[row.id] || {}
            const val  = (field) => e[field] !== undefined ? e[field] : row[field]
            const dirty = !!edits[row.id]
            const isBooking = row._source === 'booking'

            return (
              <div
                key={`${row._source}-${row.id}`}
                className="surface p-3 space-y-2"
              >
                {/* ── Row header: badge for booking-sourced rows ── */}
                {isBooking && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide
                      bg-blue-50 text-blue-600 border border-blue-200 rounded px-1.5 py-0.5
                      dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                      From Booking
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      To fully remove, delete from the Bookings page
                    </span>
                  </div>
                )}

                {/* ── Editable fields ── */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center text-xs">
                  <input
                    className="input h-7 text-xs"
                    value={val('name') || ''}
                    placeholder="Name"
                    onChange={ev => setEdit(row.id, 'name', ev.target.value)}
                  />
                  <input
                    className="input h-7 text-xs"
                    value={val('phone') || ''}
                    placeholder="Phone"
                    onChange={ev => setEdit(row.id, 'phone', ev.target.value)}
                  />
                  <input
                    className="input h-7 text-xs"
                    value={val('email') || ''}
                    placeholder="Email"
                    onChange={ev => setEdit(row.id, 'email', ev.target.value)}
                  />
                  <input
                    className="input h-7 text-xs"
                    type="date"
                    value={val('rent_payable_date') || ''}
                    onChange={ev => setEdit(row.id, 'rent_payable_date', ev.target.value)}
                  />

                  {/* ── Actions ── */}
                  <div className="flex items-center gap-2">
                    {/* Rent paid toggle */}
                    <button
                      className={`h-7 px-2 rounded text-xs font-medium border transition-colors ${
                        val('rent_paid')
                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400'
                      }`}
                      onClick={() => setEdit(row.id, 'rent_paid', !val('rent_paid'))}
                    >
                      {val('rent_paid') ? 'Paid' : 'Unpaid'}
                    </button>

                    {dirty && (
                      <button
                        className="btn-primary h-7 px-2 text-xs"
                        onClick={() => saveEdit(row)}
                      >
                        Save
                      </button>
                    )}

                    {/* Vacate (booking rows) or Delete (tenant rows) */}
                    {isBooking ? (
                      <button
                        className="btn-ghost h-7 w-7 p-0 text-orange-500 dark:text-orange-400"
                        title="Mark as vacated (to fully delete, use the Bookings page)"
                        onClick={() => handleVacate(row)}
                      >
                        <LogOut size={11} />
                      </button>
                    ) : (
                      <button
                        className="btn-ghost h-7 w-7 p-0 text-[var(--destructive)]"
                        title="Remove tenant"
                        onClick={() => handleDeleteTenant(row)}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add tenant inline form (manual tenants only) ── */}
      {adding && (
        <form
          onSubmit={handleAdd}
          className="surface p-3 grid grid-cols-2 sm:grid-cols-5 gap-2 items-center border-dashed"
        >
          <input
            className="input h-7 text-xs" placeholder="Name *" required
            value={newTenant.name}
            onChange={e => setNewTenant(n => ({ ...n, name: e.target.value }))}
          />
          <input
            className="input h-7 text-xs" placeholder="Phone"
            value={newTenant.phone}
            onChange={e => setNewTenant(n => ({ ...n, phone: e.target.value }))}
          />
          <input
            className="input h-7 text-xs" placeholder="Email" type="email"
            value={newTenant.email}
            onChange={e => setNewTenant(n => ({ ...n, email: e.target.value }))}
          />
          <input
            className="input h-7 text-xs" type="date"
            value={newTenant.rent_payable_date}
            onChange={e => setNewTenant(n => ({ ...n, rent_payable_date: e.target.value }))}
          />
          <div className="flex gap-1">
            <button type="submit" className="btn-primary h-7 px-2 text-xs flex-1">Add</button>
            <button
              type="button" className="btn-secondary h-7 px-2 text-xs"
              onClick={() => setAdding(false)}
            >✕</button>
          </div>
        </form>
      )}
    </div>
  )
}

function RoomsPanel({ pgId }) {
  const { data: rooms = [], isLoading } = useRooms(pgId)
  const createRoom = useCreateRoom()
  const deleteRoom = useDeleteRoom()
  const updateRoom = useUpdateRoom()
  const createTenant = useCreateTenant()

  // Fetch booked bookings for this PG to derive roommates_accepted overrides
  const { data: bookings = [] } = useBookings({ pg_id: pgId, status: 'booked' })

  // Set of room IDs where at least one booking has roommates_accepted = false
  // For those rooms, vacant count is displayed as 0 (don't touch DB)
  const roomsWithRoommatesNotAccepted = useMemo(() => {
    const s = new Set()
    bookings.forEach(b => {
      if (b.roommates_accepted === false && b.room_id) s.add(b.room_id)
    })
    return s
  }, [bookings])

  const [bulkOpen, setBulkOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editRoom, setEditRoom] = useState(null)
  const [expandedRoom, setExpandedRoom] = useState(null)

  // Single-room add form
  const [form, setForm] = useState({
    room_number: '', bhk_type: '', total_beds: '', occupied_beds: '', floor: ''
  })

  // Tenant rows pre-filled when occupied_beds > 0 in the add modal
  // Array of { name, phone, email, rent_payable_date }
  const [tenantForms, setTenantForms] = useState([])

  // Keep tenantForms in sync whenever occupied_beds changes in the add modal
  function handleOccupiedBedsChange(value) {
    setForm(f => ({ ...f, occupied_beds: value }))
    const count = Math.max(0, Math.min(parseInt(value) || 0, parseInt(form.total_beds) || 999))
    setTenantForms(prev => {
      const blank = { name: '', phone: '', email: '', rent_payable_date: '' }
      if (count > prev.length) {
        return [...prev, ...Array.from({ length: count - prev.length }, () => ({ ...blank }))]
      }
      return prev.slice(0, count)
    })
  }

  // Also clamp tenantForms if total_beds shrinks below occupied
  function handleTotalBedsChange(value) {
    setForm(f => ({ ...f, total_beds: value }))
    const total = parseInt(value) || 0
    const occupied = parseInt(form.occupied_beds) || 0
    if (occupied > total) {
      setForm(f => ({ ...f, total_beds: value, occupied_beds: String(total) }))
      setTenantForms(prev => prev.slice(0, total))
    }
  }

  function setTenantField(index, field, value) {
    setTenantForms(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t))
  }

  async function handleAdd(e) {
    e.preventDefault()
    try {
      const room = await createRoom.mutateAsync({
        ...form,
        pg_id: pgId,
        total_beds: +form.total_beds,
        occupied_beds: +form.occupied_beds || 0,
        floor: +form.floor || 0,
      })

      // Save tenant rows if any
      if (tenantForms.length > 0 && room?.id) {
        await Promise.all(
          tenantForms
            .filter(t => t.name.trim()) // skip blanks
            .map(t => createTenant.mutateAsync({
              ...t,
              room_id: room.id,
              pg_id: pgId,
            }))
        )
      }

      toast.success('Room added')
      setAddOpen(false)
      setForm({ room_number: '', bhk_type: '', total_beds: '', occupied_beds: '', floor: '' })
      setTenantForms([])
    } catch { toast.error('Failed to add room') }
  }

  function handleAddModalClose() {
    setAddOpen(false)
    setForm({ room_number: '', bhk_type: '', total_beds: '', occupied_beds: '', floor: '' })
    setTenantForms([])
  }

  async function handleOccupiedChange(room, value) {
    const v = Math.max(0, Math.min(parseInt(value) || 0, room.total_beds))
    try {
      await updateRoom.mutateAsync({ id: room.id, pg_id: pgId, occupied_beds: v })
      toast.success('Updated')
    } catch { toast.error('Failed to update') }
    setEditRoom(null)
  }

  // Summary: for roommates_accepted=false rooms, treat vacant as 0
  const totalBeds = rooms.reduce((s, r) => s + (r.total_beds || 0), 0)
  const occupiedBeds = rooms.reduce((s, r) => {
    if (roomsWithRoommatesNotAccepted.has(r.id)) return s + (r.total_beds || 0)
    return s + (r.occupied_beds || 0)
  }, 0)

  const occupiedBedsCount = +form.occupied_beds || 0
  const showTenantSection = occupiedBedsCount > 0

  return (
    <div>
      {/* Occupancy summary */}
      {rooms.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="surface p-3 text-center">
            <div className="text-xl font-semibold text-[var(--text-primary)]">{totalBeds}</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">Total Beds</div>
          </div>
          <div className="surface p-3 text-center">
            <div className="text-xl font-semibold text-orange-600 dark:text-orange-400">{occupiedBeds}</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">Occupied</div>
          </div>
          <div className="surface p-3 text-center">
            <div className="text-xl font-semibold text-green-600 dark:text-green-400">{totalBeds - occupiedBeds}</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">Vacant</div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-[var(--text-muted)]">{rooms.length} room{rooms.length !== 1 ? 's' : ''}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>
            <Plus size={12} />Add Room
          </Button>
          <Button size="sm" onClick={() => setBulkOpen(true)}>
            <Plus size={12} />Bulk Add
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="No rooms added yet"
          description="Add a single room or use bulk add to create multiple rooms at once"
          action={
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>
                <Plus size={12} />Add Room
              </Button>
              <Button size="sm" onClick={() => setBulkOpen(true)}>
                <Plus size={12} />Bulk Add
              </Button>
            </div>
          }
        />
      ) : (
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Floor</th>
                  <th>Type</th>
                  <th>Total Beds</th>
                  <th>Occupied</th>
                  <th>Vacant</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => {
                  // If any booking for this room has roommates_accepted=false,
                  // show vacant as 0 (display only — DB is untouched)
                  const displayVacant = roomsWithRoommatesNotAccepted.has(room.id)
                    ? 0
                    : room.total_beds - room.occupied_beds

                  return (
                     <React.Fragment key={room.id}>
                      <tr
                        key={room.id}
                        className="cursor-pointer"
                        onClick={() => setExpandedRoom(expandedRoom === room.id ? null : room.id)}
                      >
                        <td className="font-medium">{room.room_number}</td>
                        <td className="text-[var(--text-muted)]">{room.floor ?? '—'}</td>
                        <td>{room.bhk_type || '—'}</td>
                        <td>{room.total_beds}</td>
                        <td onClick={e => e.stopPropagation()}>
                          {editRoom === room.id ? (
                            <input
                              className="input h-7 w-16 text-xs px-2"
                              type="number"
                              min="0"
                              max={room.total_beds}
                              defaultValue={room.occupied_beds}
                              autoFocus
                              onBlur={e => handleOccupiedChange(room, e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleOccupiedChange(room, e.target.value)
                                if (e.key === 'Escape') setEditRoom(null)
                              }}
                            />
                          ) : (
                            <button
                              className={`text-sm px-1.5 py-0.5 rounded hover:bg-[var(--bg-hover)] transition-colors ${room.occupied_beds > 0 ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-[var(--text-muted)]'}`}
                              onClick={() => setEditRoom(room.id)}
                              title="Click to edit"
                            >
                              {room.occupied_beds}
                            </button>
                          )}
                        </td>
                        <td>
                          <span className={`font-medium ${displayVacant > 0 ? 'text-green-600 dark:text-green-400' : 'text-[var(--text-muted)]'}`}>
                            {displayVacant}
                          </span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <button
                            className="btn-ghost h-6 w-13 p-0 flex items-center justify-center text-[var(--destructive)]"
                            onClick={() => deleteRoom.mutateAsync({ id: room.id, pg_id: pgId }).then(() => toast.success('Room deleted'))}
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>

                      {expandedRoom === room.id && (
                        <tr key={`${room.id}-expand`}>
                          <td colSpan={7} className="bg-[var(--bg-hover)] p-0">
                            <TenantExpandPanel
                              roomId={room.id}
                              pgId={pgId}
                              totalBeds={room.total_beds}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
            Tip: click a row to view tenants · click any occupied count to edit it inline
          </div>
        </div>
      )}

      {/* ── Single Room Modal ───────────────────────────────────────────── */}
      <Modal open={addOpen} onClose={handleAddModalClose} title="Add Room">
        <form onSubmit={handleAdd} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Room Number *</label>
              <input
                className="input"
                placeholder="e.g. 101"
                value={form.room_number}
                onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                className="select"
                value={form.bhk_type}
                onChange={e => setForm(f => ({ ...f, bhk_type: e.target.value }))}
              >
                <option value="">Select</option>
                {['1BHK', '2BHK', '3BHK', 'Studio', 'Dormitory'].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Floor</label>
              <input
                className="input"
                type="number"
                placeholder="0"
                value={form.floor}
                onChange={e => setForm(f => ({ ...f, floor: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Total Beds *</label>
              <input
                className="input"
                type="number"
                min="1"
                placeholder="e.g. 2"
                value={form.total_beds}
                onChange={e => handleTotalBedsChange(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Occupied Beds</label>
              <input
                className="input"
                type="number"
                min="0"
                max={form.total_beds || undefined}
                placeholder="0"
                value={form.occupied_beds}
                onChange={e => handleOccupiedBedsChange(e.target.value)}
              />
            </div>
          </div>

          {/* ── Tenant details section — expands when occupied_beds > 0 ── */}
          {showTenantSection && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-[var(--border)]" />
                <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                  Tenant Details ({occupiedBedsCount} bed{occupiedBedsCount !== 1 ? 's' : ''})
                </span>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>
              <p className="text-xs text-[var(--text-muted)] -mt-1">
                Optional — fill in details for each occupied bed. Only name is required if you want to save a tenant.
              </p>

              {tenantForms.map((tenant, i) => (
                <div key={i} className="surface p-3 space-y-2">
                  <div className="text-xs font-medium text-[var(--text-muted)] mb-1">
                    Bed {i + 1}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label text-xs">Name</label>
                      <input
                        className="input h-7 text-xs"
                        placeholder="Tenant name"
                        value={tenant.name}
                        onChange={e => setTenantField(i, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Phone</label>
                      <input
                        className="input h-7 text-xs"
                        placeholder="Phone"
                        value={tenant.phone}
                        onChange={e => setTenantField(i, 'phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Email</label>
                      <input
                        className="input h-7 text-xs"
                        type="email"
                        placeholder="Email"
                        value={tenant.email}
                        onChange={e => setTenantField(i, 'email', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label text-xs">Rent Payable Date</label>
                      <input
                        className="input h-7 text-xs"
                        type="date"
                        value={tenant.rent_payable_date}
                        onChange={e => setTenantField(i, 'rent_payable_date', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={handleAddModalClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRoom.isPending}>
              {createRoom.isPending ? <Spinner size={12} /> : <Plus size={12} />}
              Add Room
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Add Modal — unchanged, no tenant section here */}
      <BulkRoomAddModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        pgId={pgId}
      />
    </div>
  )
}

// ─── Leads Panel ─────────────────────────────────────────────────────────────
function LeadsPanel({ pgId }) {
  const { data: leads = [], isLoading } = useLeads({ pg_id: pgId })
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-[var(--text-muted)]">{leads.length} lead{leads.length !== 1 ? 's' : ''}</span>
        <Link to={`/leads?pg=${pgId}`}><Button size="sm" variant="secondary"><SquareArrowUpRight size={12}/>View in Leads</Button></Link>
      </div>
      {isLoading ? <Skeleton className="h-32" /> : leads.length === 0 ? (
        <EmptyState title="No leads for this PG" />
      ) : (
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Student</th><th>Phone</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {leads.map(l => (
                  <tr key={l.id}>
                    <td className="font-medium">{l.student_name}</td>
                    <td className="text-[var(--text-muted)]">{l.phone}</td>
                    <td><Badge variant={l.status}>{l.status}</Badge></td>
                    <td className="text-[var(--text-muted)]">{formatDate(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Bookings Panel ───────────────────────────────────────────────────────────
function BookingsPanel({ pgId }) {
  const { data: bookings = [], isLoading } = useBookings({ pg_id: pgId })
  const [addOpen, setAddOpen] = useState(false)
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-[var(--text-muted)]">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</span>
        <Button size="sm" onClick={() => setAddOpen(true)}><Plus size={12}/>Add Booking</Button>
      </div>
      {isLoading ? <Skeleton className="h-32" /> : bookings.length === 0 ? (
        <EmptyState title="No bookings yet" description="Add a booking to track student move-ins" />
      ) : (
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Student</th><th>Phone</th><th>Room</th><th>Move In</th><th>Status</th></tr></thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td><div className="font-medium">{b.student_name}</div><div className="text-xs text-[var(--text-muted)]">{b.student_email}</div></td>
                    <td className="text-[var(--text-muted)]">{b.student_phone}</td>
                    <td>{b.rooms?.room_number || '—'}</td>
                    <td className="text-[var(--text-muted)]">{formatDate(b.move_in_date)}</td>
                    <td><Badge variant={b.status}>{b.status === 'partially_confirmed' ? 'Partial' : b.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <BookingForm open={addOpen} onClose={() => setAddOpen(false)} pgId={pgId} />
    </div>
  )
}

// ─── Reminders Panel ──────────────────────────────────────────────────────────
function RemindersPanel({ pgId }) {
  const { data: reminders = [], isLoading } = useReminders({ pg_id: pgId })
  const [addOpen, setAddOpen] = useState(false)
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-[var(--text-muted)]">{reminders.filter(r=>!r.is_done).length} pending</span>
        <Button size="sm" onClick={() => setAddOpen(true)}><Plus size={12}/>Add Reminder</Button>
      </div>
      {isLoading ? <Skeleton className="h-32" /> : reminders.length === 0 ? (
        <EmptyState title="No reminders" description="Set follow-up reminders for this property" />
      ) : (
        <div className="space-y-2">
          {reminders.map(r => (
            <div key={r.id} className={`surface p-3 flex items-start gap-3 ${r.is_done ? 'opacity-50' : ''}`}>
              <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${isOverdue(r.due_date) && !r.is_done ? 'bg-[var(--destructive)]' : 'bg-[var(--accent)]'}`}/>
              <div className="flex-1">
                <p className={`text-sm ${r.is_done ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>{r.title}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatDate(r.due_date)}</p>
              </div>
              {r.is_done && <Badge variant="booked">Done</Badge>}
              {!r.is_done && isOverdue(r.due_date) && <Badge variant="rejected">Overdue</Badge>}
            </div>
          ))}
        </div>
      )}
      <ReminderForm open={addOpen} onClose={() => setAddOpen(false)} pgId={pgId} />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PGDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: pg, isLoading } = usePG(id)
  const deletePG = useDeletePG()
  const [activeTab, setActiveTab] = useState('rooms')
  const [deleteOpen, setDeleteOpen] = useState(false)

  const TABS = [
    { id: 'rooms',     label: 'Rooms' },
    { id: 'leads',     label: 'Leads' },
    { id: 'bookings',  label: 'Bookings' },
    { id: 'notes',     label: 'Notes' },
    { id: 'reminders', label: 'Reminders' },
  ]

  async function handleDelete() {
    try {
      await deletePG.mutateAsync(id)
      toast.success('PG deleted')
      navigate('/pgs')
    } catch { toast.error('Failed to delete') }
  }

  if (isLoading) {
    return (
      <div className="page-container space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (!pg) return (
    <div className="page-container">
      <EmptyState icon={Building2} title="PG not found" action={<Link to="/pgs"><Button variant="secondary"><ArrowLeft size={14}/>Back to PGs</Button></Link>} />
    </div>
  )

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button className="btn-ghost h-8 w-8 p-0" onClick={() => navigate('/pgs')}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="page-title">{pg.name}</h1>
              <Badge variant={pg.status}>{pg.status}</Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mt-0.5">
              <MapPin size={11} />{pg.location}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/pgs/${id}/edit`}>
            <Button variant="secondary" size="sm"><Pencil size={12}/>Edit</Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 size={12} className="text-[var(--destructive)]"/>
          </Button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="surface p-3">
          <div className="text-xs text-[var(--text-muted)] mb-1">Rent</div>
          <div className="text-sm font-semibold flex items-center gap-1"><IndianRupee size={12}/>{formatCurrency(pg.rent).replace('₹','')}/mo</div>
          {pg.deposit && <div className="text-xs text-[var(--text-muted)]">Dep: {formatCurrency(pg.deposit)}</div>}
        </div>
        <div className="surface p-3">
          <div className="text-xs text-[var(--text-muted)] mb-1">Type</div>
          <div className="text-sm font-semibold">{pg.bhk_type || '—'}</div>
          {pg.area_sqft && <div className="text-xs text-[var(--text-muted)]">{pg.area_sqft} sqft</div>}
        </div>
        <div className="surface p-3">
          <div className="text-xs text-[var(--text-muted)] mb-1">Owner</div>
          <div className="text-sm font-semibold truncate">{pg.owner_name}</div>
          <a href={`tel:${pg.owner_phone}`} className="text-xs text-[var(--accent)] flex items-center gap-1 hover:underline mt-0.5">
            <Phone size={10}/>{pg.owner_phone}
          </a>
        </div>
        <div className="surface p-3">
          <div className="text-xs text-[var(--text-muted)] mb-1">Rooms Available</div>
          <div className="text-sm font-semibold">{pg.rooms_available ?? '—'}</div>
          {pg.owner_email && (
            <a href={`mailto:${pg.owner_email}`} className="text-xs text-[var(--accent)] flex items-center gap-1 hover:underline mt-0.5 truncate">
              <Mail size={10}/>{pg.owner_email}
            </a>
          )}
        </div>
      </div>

      {/* Amenities */}
      {pg.amenities?.length > 0 && (
        <div className="surface p-3 mb-4">
          <div className="text-xs text-[var(--text-muted)] mb-2">Amenities</div>
          <div className="flex flex-wrap gap-1.5">
            {pg.amenities.map((a, i) => (
              <span key={i} className="badge badge-new">{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="surface overflow-hidden">
        <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
        <div className="p-4">
          {activeTab === 'rooms'     && <RoomsPanel pgId={id} />}
          {activeTab === 'leads'     && <LeadsPanel pgId={id} />}
          {activeTab === 'bookings'  && <BookingsPanel pgId={id} />}
          {activeTab === 'notes'     && <NotesPanel pgId={id} />}
          {activeTab === 'reminders' && <RemindersPanel pgId={id} />}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete PG"
        description={`Delete "${pg.name}" permanently? All rooms, notes, and reminders will be removed.`}
        loading={deletePG.isPending}
      />
    </div>
  )
}
