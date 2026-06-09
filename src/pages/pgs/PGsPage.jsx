import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Building2, Filter, X, ChevronRight, Pencil, Trash2, MapPin, BedDouble, IndianRupee } from 'lucide-react'
import { usePGs, useDeletePG } from '../../hooks'
import { Button, Badge, EmptyState, SearchInput, Skeleton, ConfirmDialog } from '../../components/ui'
import { formatCurrency, getPGStatusBadge, truncate } from '../../lib/utils'
import { toast } from 'sonner'

const BHK_OPTIONS = ['1BHK', '2BHK', '3BHK', '4BHK', 'Studio', 'Dormitory']
const STATUS_OPTIONS = ['active', 'inactive']

function FilterBar({ filters, onChange, onClear }) {
  const hasFilters = Object.values(filters).some(v => v !== '' && v !== undefined)
  return (
    <div className="surface p-3 mb-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <input
          className="input col-span-2 sm:col-span-1"
          placeholder="Location"
          value={filters.location || ''}
          onChange={e => onChange({ ...filters, location: e.target.value })}
        />
        <select className="select" value={filters.bhk_type || ''} onChange={e => onChange({ ...filters, bhk_type: e.target.value })}>
          <option value="">All BHK types</option>
          {BHK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="select" value={filters.status || ''} onChange={e => onChange({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <input
          className="input"
          placeholder="Min Rent ₹"
          type="number"
          value={filters.min_rent || ''}
          onChange={e => onChange({ ...filters, min_rent: e.target.value })}
        />
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Max Rent ₹"
            type="number"
            value={filters.max_rent || ''}
            onChange={e => onChange({ ...filters, max_rent: e.target.value })}
          />
          {hasFilters && (
            <button className="btn-ghost px-2" onClick={onClear} title="Clear filters">
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function PGRow({ pg, onDelete }) {
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deletePG = useDeletePG()

  async function handleDelete() {
    try {
      await deletePG.mutateAsync(pg.id)
      toast.success('PG deleted')
      setConfirmOpen(false)
    } catch {
      toast.error('Failed to delete PG')
    }
  }

  return (
    <>
      <tr className="group cursor-pointer" onClick={() => navigate(`/pgs/${pg.id}`)}>
        <td>
          <div className="font-medium text-[var(--text-primary)]">{pg.name}</div>
          <div className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
            <MapPin size={10} /> {truncate(pg.location, 30)}
          </div>
        </td>
        <td className="hidden sm:table-cell">
          <div className="text-sm">{pg.owner_name || '—'}</div>
          <div className="text-xs text-[var(--text-muted)]">{pg.owner_phone || ''}</div>
        </td>
        <td className="hidden md:table-cell">
          <span className="text-sm">{pg.bhk_type || '—'}</span>
        </td>
        <td className="hidden lg:table-cell">
          <div className="text-sm flex items-center gap-1">
            <IndianRupee size={11} className="text-[var(--text-muted)]" />
            {formatCurrency(pg.rent).replace('₹', '')}
          </div>
          {pg.deposit && <div className="text-xs text-[var(--text-muted)]">Dep: {formatCurrency(pg.deposit)}</div>}
        </td>
        <td className="hidden md:table-cell">
          <div className="flex items-center gap-1 text-sm">
            <BedDouble size={12} className="text-[var(--text-muted)]" />
            {pg.rooms_available ?? '—'}
          </div>
        </td>
        <td>
          <Badge variant={pg.status}>{pg.status}</Badge>
        </td>
        <td>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <Link to={`/pgs/${pg.id}/edit`} className="btn-ghost h-7 w-12 p-0 flex items-center justify-center">
              <Pencil size={13} />
            </Link>
            <button className="btn-ghost h-7 w-12 p-0 flex items-center justify-center text-[var(--destructive)]" onClick={() => setConfirmOpen(true)}>
              <Trash2 size={13} />
            </button>
            <ChevronRight size={13} className="text-[var(--text-muted)]" />
          </div>
        </td>
      </tr>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete PG"
        description={`Are you sure you want to delete "${pg.name}"? This will also remove all associated rooms, notes, and reminders.`}
        loading={deletePG.isPending}
      />
    </>
  )
}

export default function PGsPage() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [showFilters, setShowFilters] = useState(false)

  const { data: pgs = [], isLoading } = usePGs({ ...filters, search })

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">PGs</h1>
          <p className="page-subtitle">{pgs.length} properties listed</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowFilters(f => !f)}>
            <Filter size={13} />
            Filters
            {Object.values(filters).some(v => v) && (
              <span className="h-4 w-4 rounded-full bg-[var(--accent)] text-white text-[10px] flex items-center justify-center">
                {Object.values(filters).filter(v => v).length}
              </span>
            )}
          </Button>
          <Link to="/pgs/new">
            <Button>
              <Plus size={14} />
              Add PG
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search by name, location, owner…"
        className="mb-3"
      />

      {/* Filters */}
      {showFilters && (
        <FilterBar
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters({})}
        />
      )}

      {/* Table */}
      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>PG / Location</th>
                <th className="hidden sm:table-cell">Owner</th>
                <th className="hidden md:table-cell">Type</th>
                <th className="hidden lg:table-cell">Rent</th>
                <th className="hidden md:table-cell">Rooms</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j}><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : pgs.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={Building2}
                      title="No PGs found"
                      description={search || Object.values(filters).some(v=>v) ? "Try adjusting your filters" : "Add your first PG to get started"}
                      action={<Link to="/pgs/new"><Button><Plus size={14} />Add PG</Button></Link>}
                    />
                  </td>
                </tr>
              ) : (
                pgs.map(pg => <PGRow key={pg.id} pg={pg} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
