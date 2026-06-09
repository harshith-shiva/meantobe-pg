import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Building2, MapPin, Phone, Mail, BedDouble, IndianRupee, SquareArrowUpRight, Plus, Trash2 } from 'lucide-react'
import { usePG, useRooms, useNotes, useLeads, useBookings, useReminders, useCreateNote, useDeleteNote, useCreateRoom, useDeleteRoom, useUpdateRoom, useDeletePG } from '../../hooks'
import { Button, Badge, Tabs, Skeleton, EmptyState, ConfirmDialog, Spinner, Modal } from '../../components/ui'
import { formatCurrency, formatDate, getLeadStatusBadge, getBookingStatusBadge, isOverdue } from '../../lib/utils'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import ReminderForm from '../../components/reminders/ReminderForm'
import BookingForm from '../../components/bookings/BookingForm'
import BulkRoomAddModal from '../../components/rooms/BulkRoomAddModal'

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

function RoomsPanel({ pgId }) {
  const { data: rooms = [], isLoading } = useRooms(pgId)
  const createRoom = useCreateRoom()
  const deleteRoom = useDeleteRoom()
  const updateRoom = useUpdateRoom()
  const [bulkOpen, setBulkOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editRoom, setEditRoom] = useState(null)
  const [form, setForm] = useState({ room_number: '', bhk_type: '', total_beds: '', occupied_beds: '', floor: '' })

  const totalBeds = rooms.reduce((s, r) => s + (r.total_beds || 0), 0)
  const occupiedBeds = rooms.reduce((s, r) => s + (r.occupied_beds || 0), 0)

  async function handleAdd(e) {
    e.preventDefault()
    try {
      await createRoom.mutateAsync({
        ...form,
        pg_id: pgId,
        total_beds: +form.total_beds,
        occupied_beds: +form.occupied_beds || 0,
        floor: +form.floor || 0,
      })
      toast.success('Room added')
      setAddOpen(false)
      setForm({ room_number: '', bhk_type: '', total_beds: '', occupied_beds: '', floor: '' })
    } catch { toast.error('Failed to add room') }
  }

  async function handleOccupiedChange(room, value) {
    const v = Math.max(0, Math.min(parseInt(value) || 0, room.total_beds))
    try {
      await updateRoom.mutateAsync({ id: room.id, pg_id: pgId, occupied_beds: v })
      toast.success('Updated')
    } catch { toast.error('Failed to update') }
    setEditRoom(null)
  }

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
                  const vacant = room.total_beds - room.occupied_beds
                  return (
                    <tr key={room.id}>
                      <td className="font-medium">{room.room_number}</td>
                      <td className="text-[var(--text-muted)]">{room.floor ?? '—'}</td>
                      <td>{room.bhk_type || '—'}</td>
                      <td>{room.total_beds}</td>
                      <td>
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
                        <span className={`font-medium ${vacant > 0 ? 'text-green-600 dark:text-green-400' : 'text-[var(--text-muted)]'}`}>
                          {vacant}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-ghost h-6 w-13 p-0 flex items-center justify-center text-[var(--destructive)]"
                          onClick={() => deleteRoom.mutateAsync({ id: room.id, pg_id: pgId }).then(() => toast.success('Room deleted'))}
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
            Tip: click any occupied count to edit it inline
          </div>
        </div>
      )}

      {/* Single Room Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Room">
        <form onSubmit={handleAdd} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Room Number *</label>
              <input className="input" placeholder="e.g. 101" value={form.room_number} onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="select" value={form.bhk_type} onChange={e => setForm(f => ({ ...f, bhk_type: e.target.value }))}>
                <option value="">Select</option>
                {['1BHK', '2BHK', '3BHK', 'Studio', 'Dormitory'].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Floor</label>
              <input className="input" type="number" placeholder="0" value={form.floor} onChange={e => setForm(f => ({ ...f, floor: e.target.value }))} />
            </div>
            <div>
              <label className="label">Total Beds *</label>
              <input className="input" type="number" min="1" placeholder="e.g. 2" value={form.total_beds} onChange={e => setForm(f => ({ ...f, total_beds: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Occupied Beds</label>
              <input className="input" type="number" min="0" placeholder="0" value={form.occupied_beds} onChange={e => setForm(f => ({ ...f, occupied_beds: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createRoom.isPending}>
              {createRoom.isPending ? <Spinner size={12} /> : <Plus size={12} />}Add Room
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk Add Modal */}
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
