import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  Mic2,
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Mail,
  Phone,
  Building2,
  MapPin,
} from 'lucide-react'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'

const initialForm = {
  fullName: '',
  email: '',
  countryCode: '+91',
  phone: '',
  organizationName: '',
  city: '',
  status: 'new',
}

const COUNTRY_OPTIONS = [
  { code: 'IN', dial: '+91', label: 'IN (+91)' },
  { code: 'US', dial: '+1', label: 'US (+1)' },
  { code: 'GB', dial: '+44', label: 'GB (+44)' },
  { code: 'AE', dial: '+971', label: 'AE (+971)' },
  { code: 'AU', dial: '+61', label: 'AU (+61)' },
]

const ArtistInquiries = () => {
  const { toast } = useToast()
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [formData, setFormData] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchInquiries()
  }, [])

  const fetchInquiries = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/artist-inquiries')
      if (response.data.status === 200) {
        setInquiries(response.data.result.inquiries || [])
      }
    } catch (error) {
      console.error('Error fetching artist inquiries:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch artist inquiries')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setFormData(initialForm)
    setFormErrors({})
    setShowAddModal(true)
  }

  const handleEdit = (inquiry) => {
    setSelectedInquiry(inquiry)
    setFormData({
      fullName: inquiry.fullName || '',
      email: inquiry.email || '',
      countryCode: inquiry.countryCode || '+91',
      phone: inquiry.phone || '',
      organizationName: inquiry.organizationName || '',
      city: inquiry.city || '',
      status: inquiry.status || 'new',
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  const handleDelete = (inquiry) => {
    setSelectedInquiry(inquiry)
    setShowDeleteModal(true)
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errors.email = 'Please enter a valid email'
    if (!formData.phone.trim()) errors.phone = 'Phone number is required'
    else if (!/^[0-9]{7,15}$/.test(formData.phone.trim())) errors.phone = 'Phone number must be 7-15 digits'
    if (!formData.organizationName.trim()) errors.organizationName = 'Organisation name is required'
    if (!/^\+?[1-9]\d{0,3}$/.test(formData.countryCode.trim())) errors.countryCode = 'Invalid country code'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        countryCode: formData.countryCode.trim(),
        phone: formData.phone.trim(),
        organizationName: formData.organizationName.trim(),
        city: formData.city.trim(),
        status: formData.status,
      }

      const response = showEditModal
        ? await api.put(`/admin/artist-inquiries/${selectedInquiry._id}`, payload)
        : await api.post('/admin/artist-inquiries', payload)

      if (response.data.status === 200 || response.data.status === 201) {
        toast.success(`Artist inquiry ${showEditModal ? 'updated' : 'created'} successfully`)
        setShowAddModal(false)
        setShowEditModal(false)
        setFormData(initialForm)
        if (!showEditModal) {
          setSearchTerm('')
          setStatusFilter('all')
        }
        fetchInquiries()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${showEditModal ? 'update' : 'create'} artist inquiry`)
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    try {
      const response = await api.delete(`/admin/artist-inquiries/${selectedInquiry._id}`)
      if (response.data.status === 200) {
        toast.success('Artist inquiry deleted successfully')
        setShowDeleteModal(false)
        fetchInquiries()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete artist inquiry')
    }
  }

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      inquiry.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.city?.toLowerCase().includes(searchTerm.toLowerCase())

    if (statusFilter === 'all') return matchesSearch
    return matchesSearch && inquiry.status === statusFilter
  })

  const getStatusClass = (status) => {
    if (status === 'new') return 'bg-blue-100 text-blue-800'
    if (status === 'read') return 'bg-emerald-100 text-emerald-800'
    return 'bg-gray-200 text-gray-700'
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            Artist Inquiries
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base font-medium">Manage artist inquiries from customers</p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Add Inquiry
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search inquiries..."
              autoComplete="off"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field sm:w-44">
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : filteredInquiries.length === 0 ? (
        <EmptyState
          icon={Mic2}
          title="No artist inquiries found"
          message={searchTerm ? 'No inquiries match your search.' : 'Artist inquiries submitted by users will appear here.'}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Artist</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Organisation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Submitted</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInquiries.map((inquiry) => (
                  <tr key={inquiry._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{inquiry.fullName}</p>
                        {inquiry.city && (
                          <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {inquiry.city}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-700 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {inquiry.email}
                        </p>
                        <p className="text-sm text-gray-700 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {`${inquiry.countryCode || ''} ${inquiry.phone || ''}`.trim()}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        {inquiry.organizationName || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusClass(inquiry.status)}`}>
                        {inquiry.status || 'new'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {inquiry.createdAt ? format(new Date(inquiry.createdAt), 'MMM dd, yyyy') : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(inquiry)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(inquiry)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-200/60 animate-scale-in">
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">
                {showEditModal ? 'Edit Artist Inquiry' : 'Add New Artist Inquiry'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                  setFormErrors({})
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="artist-inquiry-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className={`input-field ${formErrors.fullName ? 'border-red-500' : ''}`}
                    />
                    {formErrors.fullName && <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`input-field ${formErrors.email ? 'border-red-500' : ''}`}
                    />
                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country Code *</label>
                    <select
                      value={formData.countryCode}
                      onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                      className={`input-field ${formErrors.countryCode ? 'border-red-500' : ''}`}
                    >
                      {COUNTRY_OPTIONS.map((country) => (
                        <option key={country.code} value={country.dial}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.countryCode && <p className="text-red-500 text-xs mt-1">{formErrors.countryCode}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 15) })}
                      className={`input-field ${formErrors.phone ? 'border-red-500' : ''}`}
                    />
                    {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organisation Name *</label>
                    <input
                      type="text"
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      className={`input-field ${formErrors.organizationName ? 'border-red-500' : ''}`}
                    />
                    {formErrors.organizationName && <p className="text-red-500 text-xs mt-1">{formErrors.organizationName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="flex-shrink-0 border-t border-gray-200 bg-white sticky bottom-0 z-10 rounded-b-2xl">
              <div className="flex gap-3 p-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                    setFormErrors({})
                  }}
                  className="btn-secondary flex-1"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" form="artist-inquiry-form" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : showEditModal ? (
                    'Update'
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Artist Inquiry"
        message={`Are you sure you want to delete inquiry from "${selectedInquiry?.fullName}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  )
}

export default ArtistInquiries
