import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// ─── PG HOOKS ─────────────────────────────────────────────────────────────────

export function usePGs(filters = {}) {
  return useQuery({
    queryKey: ['pgs', filters],
    queryFn: async () => {
      let query = supabase
        .from('pgs')
        .select('*')
        .order('created_at', { ascending: false })

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,location.ilike.%${filters.search}%,owner_name.ilike.%${filters.search}%`)
      }
      if (filters.location) query = query.ilike('location', `%${filters.location}%`)
      if (filters.bhk_type) query = query.eq('bhk_type', filters.bhk_type)
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.min_sqft) query = query.gte('area_sqft', filters.min_sqft)
      if (filters.max_sqft) query = query.lte('area_sqft', filters.max_sqft)
      if (filters.min_rent) query = query.gte('rent', filters.min_rent)
      if (filters.max_rent) query = query.lte('rent', filters.max_rent)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function usePG(id) {
  return useQuery({
    queryKey: ['pgs', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pgs')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreatePG() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase.from('pgs').insert(data).select().single()
      if (error) throw error
      return result
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pgs'] }),
  })
}

export function useUpdatePG() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const { data: result, error } = await supabase.from('pgs').update(data).eq('id', id).select().single()
      if (error) throw error
      return result
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['pgs'] })
      qc.invalidateQueries({ queryKey: ['pgs', vars.id] })
    },
  })
}

export function useDeletePG() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('pgs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pgs'] }),
  })
}

// ─── ROOM HOOKS ───────────────────────────────────────────────────────────────

export function useRooms(pgId) {
  return useQuery({
    queryKey: ['rooms', pgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('pg_id', pgId)
        .order('floor', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!pgId,
  })
}

export function useCreateRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase.from('rooms').insert(data).select().single()
      if (error) throw error
      return result
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['rooms', vars.pg_id] }),
  })
}

export function useUpdateRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, pg_id, ...data }) => {
      const { data: result, error } = await supabase.from('rooms').update(data).eq('id', id).select().single()
      if (error) throw error
      return { ...result, pg_id }
    },
    onSuccess: (result) => qc.invalidateQueries({ queryKey: ['rooms', result.pg_id] }),
  })
}

export function useDeleteRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, pg_id }) => {
      const { error } = await supabase.from('rooms').delete().eq('id', id)
      if (error) throw error
      return { pg_id }
    },
    onSuccess: (result) => qc.invalidateQueries({ queryKey: ['rooms', result.pg_id] }),
  })
}

// ─── BOOKING HOOKS ────────────────────────────────────────────────────────────

export function useBookings(filters = {}) {
  return useQuery({
    queryKey: ['bookings', filters],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`*, pgs(name, location), rooms(room_number)`)
        .order('created_at', { ascending: false })

      if (filters.pg_id) query = query.eq('pg_id', filters.pg_id)
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.search) query = query.or(`student_name.ilike.%${filters.search}%,student_phone.ilike.%${filters.search}%`)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useCreateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase.from('bookings').insert(data).select().single()
      if (error) throw error
      return result
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  })
}

export function useUpdateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const { data: result, error } = await supabase.from('bookings').update(data).eq('id', id).select().single()
      if (error) throw error
      return result
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  })
}

export function useDeleteBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('bookings').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  })
}

// ─── LEAD HOOKS ───────────────────────────────────────────────────────────────

export function useLeads(filters = {}) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select(`*, pgs(name, location), profiles(full_name)`)
        .order('created_at', { ascending: false })

      if (filters.pg_id) query = query.eq('pg_id', filters.pg_id)
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.search) query = query.or(`student_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase.from('leads').insert(data).select().single()
      if (error) throw error
      return result
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const { data: result, error } = await supabase.from('leads').update(data).eq('id', id).select().single()
      if (error) throw error
      return result
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

export function useDeleteLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('leads').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })
}

// ─── NOTES HOOKS ──────────────────────────────────────────────────────────────

export function useNotes(pgId) {
  return useQuery({
    queryKey: ['notes', pgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select(`*, profiles(full_name)`)
        .eq('pg_id', pgId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!pgId,
  })
}

export function useCreateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase.from('notes').insert(data).select().single()
      if (error) throw error
      return result
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['notes', vars.pg_id] }),
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, pg_id }) => {
      const { error } = await supabase.from('notes').delete().eq('id', id)
      if (error) throw error
      return { pg_id }
    },
    onSuccess: (result) => qc.invalidateQueries({ queryKey: ['notes', result.pg_id] }),
  })
}

// ─── REMINDER HOOKS ───────────────────────────────────────────────────────────

export function useReminders(filters = {}) {
  return useQuery({
    queryKey: ['reminders', filters],
    queryFn: async () => {
      let query = supabase
        .from('reminders')
        .select(`*, pgs(name), leads(student_name)`)
        .order('due_date', { ascending: true })

      if (filters.pg_id) query = query.eq('pg_id', filters.pg_id)
      if (filters.is_done !== undefined) query = query.eq('is_done', filters.is_done)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useCreateReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase.from('reminders').insert(data).select().single()
      if (error) throw error
      return result
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  })
}

export function useUpdateReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const { data: result, error } = await supabase.from('reminders').update(data).eq('id', id).select().single()
      if (error) throw error
      return result
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  })
}

export function useDeleteReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('reminders').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  })
}

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [pgsRes, roomsRes, leadsRes, bookingsRes, remindersRes] = await Promise.all([
        supabase.from('pgs').select('id, status', { count: 'exact' }),
        supabase.from('rooms').select('total_beds, occupied_beds'),
        supabase.from('leads').select('id, status', { count: 'exact' }),
        supabase.from('bookings').select('id, status', { count: 'exact' }),
        supabase.from('reminders').select('id, is_done, due_date').eq('is_done', false),
      ])

      const pgs = pgsRes.data || []
      const rooms = roomsRes.data || []
      const leads = leadsRes.data || []
      const bookings = bookingsRes.data || []
      const reminders = remindersRes.data || []

      const totalBeds = rooms.reduce((s, r) => s + (r.total_beds || 0), 0)
      const occupiedBeds = rooms.reduce((s, r) => s + (r.occupied_beds || 0), 0)
      const now = new Date()
      const overdueReminders = reminders.filter(r => new Date(r.due_date) < now)

      return {
        totalPGs: pgs.length,
        activePGs: pgs.filter(p => p.status === 'active').length,
        totalBeds,
        occupiedBeds,
        vacantBeds: totalBeds - occupiedBeds,
        occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
        totalLeads: leads.length,
        newLeads: leads.filter(l => l.status === 'new').length,
        totalBookings: bookings.length,
        activeBookings: bookings.filter(b => b.status === 'booked' || b.status === 'partially_confirmed').length,
        pendingReminders: reminders.length,
        overdueReminders: overdueReminders.length,
      }
    },
  })
}

// ─── PROFILES HOOKS ───────────────────────────────────────────────────────────

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at')
      if (error) throw error
      return data
    },
  })
}
