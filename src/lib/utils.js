import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

export function formatCurrency(amount) {
  if (!amount) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(amount)
}

export function getLeadStatusBadge(status) {
  const map = {
    new: 'badge-new',
    called: 'badge-called',
    visited: 'badge-visited',
    booked: 'badge-booked',
    rejected: 'badge-rejected',
  }
  return map[status] || 'badge-new'
}

export function getBookingStatusBadge(status) {
  const map = {
    booked: 'badge-booked',
    partially_confirmed: 'badge-partial',
    vacated: 'badge-vacated',
  }
  return map[status] || 'badge-new'
}

export function getPGStatusBadge(status) {
  return status === 'active' ? 'badge-active' : 'badge-inactive'
}

export function truncate(str, n = 40) {
  if (!str) return '—'
  return str.length > n ? str.slice(0, n) + '…' : str
}

export function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

export function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}
