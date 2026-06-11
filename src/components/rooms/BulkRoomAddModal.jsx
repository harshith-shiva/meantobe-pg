import { useState, useMemo } from 'react'
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import { Modal, Button, Spinner } from '../ui'
import { supabase } from '../../lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const BHK_OPTIONS = ['1BHK', '2BHK', '3BHK', '4BHK', 'Studio', 'Dormitory','Twin Sharing','Studio Twin Sharing']

const emptyGroup = () => ({
  id: crypto.randomUUID(),
  from: '',
  to: '',
  bhk_type: '2BHK',
  total_beds: 2,
  occupied_beds: 0,
})

function GroupRow({ group, onChange, onRemove, canRemove, error }) {
  const set = (field) => (e) => onChange({ ...group, [field]: e.target.value })

  const preview = useMemo(() => {
    const f = parseInt(group.from)
    const t = parseInt(group.to)
    if (!group.from || !group.to || isNaN(f) || isNaN(t)) return null
    if (t < f) return null
    return t - f + 1
  }, [group.from, group.to])  

  return (
    <div className={`rounded-md border ${error ? 'border-[var(--destructive)]' : 'border-[var(--border)]'} bg-[var(--bg-page)] p-3`}>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
        <div>
          <label className="label">From room</label>
          <input
            className="input"
            placeholder="101"
            value={group.from}
            onChange={set('from')}
          />
        </div>
        <div>
          <label className="label">To room</label>
          <input
            className="input"
            placeholder="108"
            value={group.to}
            onChange={set('to')}
          />
        </div>
        <div>
          <label className="label">BHK Type</label>
          <select className="select" value={group.bhk_type} onChange={set('bhk_type')}>
            {BHK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Beds / room</label>
          <input
            className="input"
            type="number"
            min="1"
            max="20"
            value={group.total_beds}
            onChange={set('total_beds')}
          />
        </div>
        <div>
          <label className="label">Occupied / room</label>
          <div className="flex gap-1.5">
            <input
              className="input flex-1"
              type="number"
              min="0"
              value={group.occupied_beds}
              onChange={set('occupied_beds')}
            />
            {canRemove && (
              <button
                type="button"
                className="btn-ghost h-9 w-9 p-0 flex items-center justify-center text-[var(--destructive)] flex-shrink-0"
                onClick={onRemove}
                title="Remove group"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2">
        {error ? (
          <span className="text-xs text-[var(--destructive)] flex items-center gap-1">
            <AlertCircle size={11} />{error}
          </span>
        ) : preview !== null ? (
          <span className="text-xs text-[var(--text-muted)]">
            → <strong className="text-[var(--text-primary)]">{preview}</strong> room{preview !== 1 ? 's' : ''} —
            {' '}{group.bhk_type}, {group.total_beds} bed{group.total_beds != 1 ? 's' : ''} each
            {group.occupied_beds > 0 ? `, ${group.occupied_beds} occupied` : ', all vacant'}
          </span>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">Enter a room range above</span>
        )}
      </div>
    </div>
  )
}

export default function BulkRoomAddModal({ open, onClose, pgId }) {
  const qc = useQueryClient()
  const [floor, setFloor] = useState('1')
  const [groups, setGroups] = useState([emptyGroup()])
  const [loading, setLoading] = useState(false)

  const validations = useMemo(() => {
    return groups.map(g => {
      if (!g.from || !g.to) return 'Enter both room numbers'
      const f = parseInt(g.from)
      const t = parseInt(g.to)
      if (isNaN(f) || isNaN(t)) return 'Room numbers must be numeric'
      if (t < f) return '"To" must be ≥ "From"'
      if (t - f > 99) return 'Max 100 rooms per group'
      const beds = parseInt(g.total_beds)
      const occ = parseInt(g.occupied_beds)
      if (isNaN(beds) || beds < 1) return 'At least 1 bed required'
      if (isNaN(occ) || occ < 0) return 'Occupied cannot be negative'
      if (occ > beds) return 'Occupied cannot exceed total beds'
      return null
    })
  }, [groups])

  const duplicateError = useMemo(() => {
    const allNums = []
    for (const g of groups) {
      const f = parseInt(g.from)
      const t = parseInt(g.to)
      if (isNaN(f) || isNaN(t) || t < f) continue
      for (let n = f; n <= t; n++) allNums.push(n)
    }
    const seen = new Set()
    for (const n of allNums) {
      if (seen.has(n)) return `Room ${n} appears in multiple groups`
      seen.add(n)
    }
    return null
  }, [groups])

  const totalRooms = useMemo(() => {
    return groups.reduce((sum, g) => {
      const f = parseInt(g.from)
      const t = parseInt(g.to)
      if (!isNaN(f) && !isNaN(t) && t >= f) return sum + (t - f + 1)
      return sum
    }, 0)
  }, [groups])

  const hasErrors = validations.some(v => v !== null)

  function reset() {
    setFloor('1')
    setGroups([emptyGroup()])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (hasErrors || duplicateError || totalRooms === 0) return

    setLoading(true)
    try {
      const roomsToInsert = []
      for (const g of groups) {
        const f = parseInt(g.from)
        const t = parseInt(g.to)
        for (let num = f; num <= t; num++) {
          roomsToInsert.push({
            pg_id: pgId,
            room_number: String(num),
            bhk_type: g.bhk_type,
            total_beds: parseInt(g.total_beds),
            occupied_beds: parseInt(g.occupied_beds) || 0,
            floor: parseInt(floor) || 0,
          })
        }
      }

      const { error } = await supabase.from('rooms').insert(roomsToInsert)
      if (error) throw error

      toast.success(`${roomsToInsert.length} room${roomsToInsert.length !== 1 ? 's' : ''} added to Floor ${floor}`)
      qc.invalidateQueries({ queryKey: ['rooms', pgId] })
      reset()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to add rooms')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Rooms" size="lg">
      <form onSubmit={handleSubmit} className="p-5 space-y-4">

        {/* Floor */}
        <div className="flex items-center gap-4 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 flex-shrink-0">
            <label className="label mb-0">Floor number</label>
            <input
              className="input w-20"
              type="number"
              min="0"
              placeholder="1"
              value={floor}
              onChange={e => setFloor(e.target.value)}
            />
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            All groups below will be added to this floor. Run again for a different floor.
          </p>
        </div>

        {/* Group rows */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              Room groups
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              One row per room type. Mix BHK/beds freely.
            </p>
          </div>

          {groups.map((g, i) => (
            <GroupRow
              key={g.id}
              group={g}
              onChange={(updated) => setGroups(gs => gs.map(x => x.id === g.id ? updated : x))}
              onRemove={() => setGroups(gs => gs.filter(x => x.id !== g.id))}
              canRemove={groups.length > 1}
              error={validations[i]}
            />
          ))}
        </div>

        {/* Add group */}
        <button
          type="button"
          className="btn-ghost w-full justify-center border border-dashed border-[var(--border)] h-9 text-xs"
          onClick={() => setGroups(gs => [...gs, emptyGroup()])}
        >
          <Plus size={13} />
          Add another room group
        </button>

        {/* Duplicate warning */}
        {duplicateError && (
          <div className="flex items-center gap-2 text-xs text-[var(--destructive)] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-3 py-2">
            <AlertCircle size={12} />{duplicateError}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
          <p className="text-sm text-[var(--text-muted)]">
            {totalRooms > 0 ? (
              <>
                <span className="font-semibold text-[var(--text-primary)]">{totalRooms}</span>
                {' '}room{totalRooms !== 1 ? 's' : ''} will be created on Floor {floor || '?'}
              </>
            ) : (
              'Enter room ranges above to preview'
            )}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" type="button" onClick={() => { reset(); onClose() }}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || hasErrors || !!duplicateError || totalRooms === 0}
            >
              {loading && <Spinner size={13} />}
              {totalRooms > 0 ? `Create ${totalRooms} Rooms` : 'Create Rooms'}
            </Button>
          </div>
        </div>

      </form>
    </Modal>
  )
}
