import { useState } from 'react'
import { useCreateBooking, useUpdateBooking, useRooms, usePGs } from '../../hooks'
import { Modal, Button, Spinner } from '../ui'
import { toast } from 'sonner'

const STATUSES = [
  { value: 'booked', label: 'Booked' },
  { value: 'partially_confirmed', label: 'Partially Confirmed' },
  { value: 'vacated', label: 'Vacated' },
]

export default function BookingForm({ open, onClose, pgId, existing }) {
  const isEdit = !!existing
  const { data: pgs = [] } = usePGs()
  const createBooking = useCreateBooking()
  const updateBooking = useUpdateBooking()

  const [form, setForm] = useState(() => existing || {
    student_name: '',
    student_phone: '',
    student_email: '',
    pg_id: pgId || '',
    room_id: '',
    move_in_date: '',
    status: 'booked',
    booking_details: '',
    rent_payable_date: '',
    rent_paid: false,
    roommates_accepted: true,
  })

  const activePgId = form.pg_id || pgId
  const { data: rooms = [] } = useRooms(activePgId || null)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        pg_id: form.pg_id || pgId,
        room_id: form.room_id || null,
      }
      if (isEdit) {
        await updateBooking.mutateAsync({ id: existing.id, ...payload })
        toast.success('Booking updated')
      } else {
        await createBooking.mutateAsync(payload)
        toast.success('Booking added')
      }
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to save booking')
    }
  }

  const isPending = createBooking.isPending || updateBooking.isPending

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Booking' : 'Add Booking'}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Student Name *</label>
            <input className="input" placeholder="Full name" value={form.student_name} onChange={set('student_name')} required />
          </div>
          <div>
            <label className="label">Phone *</label>
            <input className="input" placeholder="10-digit number" value={form.student_phone} onChange={set('student_phone')} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" placeholder="student@email.com" value={form.student_email} onChange={set('student_email')} />
          </div>

          {/* PG selector — only when not pre-set */}
          {!pgId && (
            <div className="sm:col-span-2">
              <label className="label">PG *</label>
              <select className="select" value={form.pg_id} onChange={set('pg_id')} required>
                <option value="">Select PG</option>
                {pgs.map(pg => (
                  <option key={pg.id} value={pg.id}>{pg.name} — {pg.location}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">Room</label>
            <select className="select" value={form.room_id || ''} onChange={set('room_id')}
              disabled={!activePgId || rooms.length === 0}>
              <option value="">
                {!activePgId ? 'Select a PG first' : rooms.length === 0 ? 'No rooms added' : 'Select room'}
              </option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>
                  Room {r.room_number}{r.bhk_type ? ` (${r.bhk_type})` : ''} — {r.total_beds - r.occupied_beds} vacant
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Move-in Date</label>
            <input className="input" type="date" value={form.move_in_date || ''} onChange={set('move_in_date')} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Status</label>
            <select className="select" value={form.status} onChange={set('status')}>
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Booking Details / Notes</label>
            <textarea className="input" rows={3} placeholder="Any additional notes about this booking…"
              value={form.booking_details || ''} onChange={set('booking_details')} />
              <div>
  <label className="label">Rent Payable Date</label>
  <input className="input" type="date" value={form.rent_payable_date || ''} onChange={set('rent_payable_date')} />
</div>

<div>
  <label className="label">Rent Paid?</label>
  <select className="select" value={form.rent_paid ? 'true' : 'false'}
    onChange={e => setForm(f => ({ ...f, rent_paid: e.target.value === 'true' }))}>
    <option value="false">No</option>
    <option value="true">Yes</option>
  </select>
</div>

<div className="sm:col-span-2">
  <label className="label">Roommates Accepted?</label>
  <select className="select" value={form.roommates_accepted === false ? 'false' : 'true'}
    onChange={e => setForm(f => ({ ...f, roommates_accepted: e.target.value === 'true' }))}>
    <option value="true">Yes — other beds can be rented out</option>
    <option value="false">No — treat all beds in room as occupied</option>
  </select>
  <p className="text-xs text-[var(--text-muted)] mt-1">
    If No, vacant beds in this room will show as 0 regardless of actual count.
  </p>
</div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Spinner size={13} />}
            {isEdit ? 'Save Changes' : 'Add Booking'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
