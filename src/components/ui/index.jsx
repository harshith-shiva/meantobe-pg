// ─── Button ─────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', className = '', disabled, onClick, type = 'button', ...props }) {
  const base = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    destructive: 'btn-destructive',
  }
  const sizes = {
    sm: 'h-7 px-3 text-xs',
    md: '',
    lg: 'h-10 px-5 text-sm',
  }
  return (
    <button
      type={type}
      className={`${base[variant]} ${size !== 'md' ? sizes[size] : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

// ─── Input ───────────────────────────────────────────────────────────────────
export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="label">{label}</label>}
      <input className={`input ${error ? 'border-[var(--destructive)]' : ''} ${className}`} {...props} />
      {error && <span className="text-xs text-[var(--destructive)]">{error}</span>}
    </div>
  )
}

// ─── Textarea ────────────────────────────────────────────────────────────────
export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="label">{label}</label>}
      <textarea className={`input ${error ? 'border-[var(--destructive)]' : ''} ${className}`} {...props} />
      {error && <span className="text-xs text-[var(--destructive)]">{error}</span>}
    </div>
  )
}

// ─── Select ──────────────────────────────────────────────────────────────────
export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="label">{label}</label>}
      <select className={`select ${error ? 'border-[var(--destructive)]' : ''} ${className}`} {...props}>
        {children}
      </select>
      {error && <span className="text-xs text-[var(--destructive)]">{error}</span>}
    </div>
  )
}

// ─── Badge ───────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'new', className = '' }) {
  const variants = {
    new: 'badge-new',
    called: 'badge-called',
    visited: 'badge-visited',
    booked: 'badge-booked',
    rejected: 'badge-rejected',
    partially_confirmed: 'badge-partial',
    vacated: 'badge-vacated',
    active: 'badge-active',
    inactive: 'badge-inactive',
  }
  return (
    <span className={`badge ${variants[variant] || 'badge-new'} ${className}`}>
      {children}
    </span>
  )
}

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', onClick }) {
  return (
    <div
      className={`surface p-4 ${onClick ? 'cursor-pointer hover:bg-[var(--bg-hover)] transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

// ─── Modal ───────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className={`relative w-full ${widths[size]} bg-[var(--bg-surface)] border border-[var(--border)] rounded-t-xl sm:rounded-xl shadow-2xl fade-in max-h-[90vh] flex flex-col`}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] flex-shrink-0">
            <h2 className="text-sm font-600 text-[var(--text-primary)] font-semibold">{title}</h2>
            <button className="btn-ghost h-7 w-7 p-0 flex items-center justify-center" onClick={onClose}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 16, className = '' }) {
  return (
    <svg
      className={`spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeOpacity="0.3"/>
      <path d="M12 2v4" stroke="currentColor"/>
    </svg>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-[var(--bg-hover)] rounded ${className}`} />
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={40} strokeWidth={1.5} />}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, description, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="p-5">
        <p className="text-sm text-[var(--text-muted)] mb-5">{description}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? <Spinner size={14} /> : null}
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, trend, color = 'accent' }) {
  return (
    <div className="surface p-4">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{label}</span>
        {Icon && (
          <div className="h-7 w-7 rounded-md bg-[var(--bg-hover)] flex items-center justify-center">
            <Icon size={14} className="text-[var(--text-muted)]" />
          </div>
        )}
      </div>
      <div className="text-2xl font-semibold text-[var(--text-primary)]">{value}</div>
      {trend && <div className="text-xs text-[var(--text-muted)] mt-1">{trend}</div>}
    </div>
  )
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex border-b border-[var(--border)] overflow-x-auto">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
            active === tab.id
              ? 'border-[var(--accent)] text-[var(--text-primary)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
              active === tab.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Search Input ─────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        className={`input pl-9`}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}
