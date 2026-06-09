import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save } from 'lucide-react'
import { usePG, useCreatePG, useUpdatePG } from '../../hooks'
import { Button, Spinner } from '../../components/ui'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  owner_name: z.string().min(1, 'Owner name is required'),
  owner_phone: z.string().min(10, 'Valid phone required'),
  owner_email: z.string().email('Valid email required').or(z.literal('')).optional(),
  location: z.string().min(1, 'Location is required'),
  area_sqft: z.coerce.number().min(1).optional().or(z.literal('')),
  bhk_type: z.string().optional(),
  rooms_available: z.coerce.number().min(0).optional().or(z.literal('')),
  rent: z.coerce.number().min(1, 'Rent is required'),
  deposit: z.coerce.number().min(0).optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']),
  amenities: z.string().optional(),
})

const BHK_OPTIONS = ['1BHK', '2BHK', '3BHK', '4BHK', 'Studio', 'Dormitory']

export default function PGFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()

  const { data: existing, isLoading: loadingPG } = usePG(id)
  const createPG = useCreatePG()
  const updatePG = useUpdatePG()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active' }
  })

  useEffect(() => {
    if (existing && isEdit) {
      reset({
        ...existing,
        amenities: Array.isArray(existing.amenities) ? existing.amenities.join(', ') : existing.amenities || '',
      })
    }
  }, [existing, isEdit, reset])

  async function onSubmit(values) {
    try {
      const payload = {
        ...values,
        amenities: values.amenities ? values.amenities.split(',').map(a => a.trim()).filter(Boolean) : [],
      }
      if (isEdit) {
        await updatePG.mutateAsync({ id, ...payload })
        toast.success('PG updated successfully')
      } else {
        const result = await createPG.mutateAsync(payload)
        toast.success('PG added successfully')
        navigate(`/pgs/${result.id}`)
        return
      }
      navigate(`/pgs/${id}`)
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
    }
  }

  if (isEdit && loadingPG) {
    return (
      <div className="page-container flex items-center justify-center py-20">
        <Spinner size={20} />
      </div>
    )
  }

  return (
    <div className="page-container max-w-2xl">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button className="btn-ghost h-8 w-8 p-0" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1 className="page-title">{isEdit ? 'Edit PG' : 'Add New PG'}</h1>
            <p className="page-subtitle">{isEdit ? existing?.name : 'Fill in the property details below'}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Basic Info */}
        <div className="surface p-5 mb-4">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-4">Property Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">PG Name *</label>
              <input className={`input ${errors.name ? 'border-[var(--destructive)]' : ''}`} placeholder="e.g. Sai Krupa PG" {...register('name')} />
              {errors.name && <p className="text-xs text-[var(--destructive)] mt-1">{errors.name.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="label">Location / Address *</label>
              <input className={`input ${errors.location ? 'border-[var(--destructive)]' : ''}`} placeholder="e.g. Madurai, Anna Nagar" {...register('location')} />
              {errors.location && <p className="text-xs text-[var(--destructive)] mt-1">{errors.location.message}</p>}
            </div>

            <div>
              <label className="label">BHK Type</label>
              <select className="select" {...register('bhk_type')}>
                <option value="">Select type</option>
                {BHK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Area (sqft)</label>
              <input className="input" type="number" placeholder="e.g. 800" {...register('area_sqft')} />
            </div>

            <div>
              <label className="label">Rooms Available</label>
              <input className="input" type="number" placeholder="e.g. 5" {...register('rooms_available')} />
            </div>

            <div>
              <label className="label">Status</label>
              <select className="select" {...register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Owner Info */}
        <div className="surface p-5 mb-4">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-4">Owner Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Owner Name *</label>
              <input className={`input ${errors.owner_name ? 'border-[var(--destructive)]' : ''}`} placeholder="Full name" {...register('owner_name')} />
              {errors.owner_name && <p className="text-xs text-[var(--destructive)] mt-1">{errors.owner_name.message}</p>}
            </div>

            <div>
              <label className="label">Owner Phone *</label>
              <input className={`input ${errors.owner_phone ? 'border-[var(--destructive)]' : ''}`} placeholder="10-digit number" {...register('owner_phone')} />
              {errors.owner_phone && <p className="text-xs text-[var(--destructive)] mt-1">{errors.owner_phone.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="label">Owner Email</label>
              <input className="input" type="email" placeholder="owner@email.com" {...register('owner_email')} />
            </div>
          </div>
        </div>

        {/* Financials */}
        <div className="surface p-5 mb-4">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-4">Financials</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Rent (₹/month) *</label>
              <input className={`input ${errors.rent ? 'border-[var(--destructive)]' : ''}`} type="number" placeholder="e.g. 8000" {...register('rent')} />
              {errors.rent && <p className="text-xs text-[var(--destructive)] mt-1">{errors.rent.message}</p>}
            </div>

            <div>
              <label className="label">Deposit (₹)</label>
              <input className="input" type="number" placeholder="e.g. 16000" {...register('deposit')} />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="surface p-5 mb-6">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-4">Amenities</h2>
          <div>
            <label className="label">Amenities (comma-separated)</label>
            <input
              className="input"
              placeholder="WiFi, AC, Parking, Food, Laundry, Gym"
              {...register('amenities')}
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">Enter amenities separated by commas</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner size={14} /> : <Save size={14} />}
            {isEdit ? 'Save Changes' : 'Add PG'}
          </Button>
        </div>
      </form>
    </div>
  )
}
