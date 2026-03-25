import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { 
  Ticket, 
  Plus, 
  Edit, 
  Trash2,
  Search,
  Calendar,
  Percent,
  Tag,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'

const Offers = () => {
  const { toast } = useToast()
  const [offers, setOffers] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'percentage',
    value: '',
    minPurchaseAmount: '',
    eventId: '',
    categoryId: '',
    validFrom: '',
    validUntil: '',
    usageLimit: '',
    code: '',
    isActive: true,
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    fetchOffers()
    fetchCategories()
  }, [])

  const fetchOffers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/offers')
      if (response.data.status === 200) {
        setOffers(response.data.result.offers || [])
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch offers')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get('/admin/categories')
      if (response.data.status === 200) {
        setCategories(response.data.result.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleAdd = () => {
    setFormData({
      title: '',
      description: '',
      type: 'percentage',
      value: '',
      minPurchaseAmount: '',
      eventId: '',
      categoryId: '',
      validFrom: '',
      validUntil: '',
      usageLimit: '',
      code: '',
      isActive: true,
    })
    setFormErrors({})
    setShowAddModal(true)
  }

  const handleEdit = (offer) => {
    setSelectedOffer(offer)
    setFormData({
      title: offer.title || '',
      description: offer.description || '',
      type: offer.type || 'percentage',
      value: offer.value || '',
      minPurchaseAmount: offer.minPurchaseAmount || '',
      eventId: offer.eventId?._id || '',
      categoryId: offer.categoryId?._id || '',
      validFrom: offer.validFrom ? format(new Date(offer.validFrom), "yyyy-MM-dd'T'HH:mm") : '',
      validUntil: offer.validUntil ? format(new Date(offer.validUntil), "yyyy-MM-dd'T'HH:mm") : '',
      usageLimit: offer.usageLimit || '',
      code: offer.code || '',
      isActive: offer.isActive !== false,
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  const handleDelete = (offer) => {
    setSelectedOffer(offer)
    setShowDeleteModal(true)
  }

  const handleStatusToggle = async (offerId, currentStatus) => {
    try {
      setUpdating(offerId)
      const response = await api.put(`/admin/offers/${offerId}`, {
        isActive: !currentStatus,
      })
      
      if (response.data.status === 200) {
        toast.success('Offer status updated successfully')
        fetchOffers()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update offer status')
    } finally {
      setUpdating(null)
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.value) errors.value = 'Value is required'
    if (!formData.validFrom) errors.validFrom = 'Valid from date is required'
    if (!formData.validUntil) errors.validUntil = 'Valid until date is required'
    if (new Date(formData.validUntil) <= new Date(formData.validFrom)) {
      errors.validUntil = 'Valid until must be after valid from'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        value: parseFloat(formData.value),
        minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : 0,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        eventId: formData.eventId || null,
        categoryId: formData.categoryId || null,
      }

      const response = showEditModal
        ? await api.put(`/admin/offers/${selectedOffer._id}`, payload)
        : await api.post('/admin/offers', payload)

      if (response.data.status === 200 || response.data.status === 201) {
        toast.success(`Offer ${showEditModal ? 'updated' : 'created'} successfully`)
        setShowAddModal(false)
        setShowEditModal(false)
        fetchOffers()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${showEditModal ? 'update' : 'create'} offer`)
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    try {
      const response = await api.delete(`/admin/offers/${selectedOffer._id}`)
      if (response.data.status === 200) {
        toast.success('Offer deleted successfully')
        setShowDeleteModal(false)
        fetchOffers()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete offer')
    }
  }

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.code?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (statusFilter === 'all') return matchesSearch
    return matchesSearch && (statusFilter === 'active' ? offer.isActive === true : offer.isActive === false)
  })

  const getOfferTypeLabel = (type) => {
    return type === 'percentage' ? '% Off' : '₹ Off'
  }

  const getOfferDisplayValue = (offer) => {
    if (offer.type === 'percentage') {
      return `${offer.value}% Off${offer.maxDiscount ? ` (Max ₹${offer.maxDiscount})` : ''}`
    } else {
      return `₹${offer.value} Off`
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">Offers</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base font-medium">Manage platform offers and discounts</p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Add Offer
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search offers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field sm:w-40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Offers List */}
      {loading ? (
        <Loading />
      ) : filteredOffers.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No offers found"
          message={searchTerm ? "No offers match your search." : "Get started by creating your first offer."}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Offer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Discount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Valid Period</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOffers.map((offer) => (
                  <tr key={offer._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{offer.title}</h3>
                        {offer.code && (
                          <p className="text-sm text-primary-600 font-medium mt-1">Code: {offer.code}</p>
                        )}
                        {offer.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">{offer.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {getOfferDisplayValue(offer)}
                          </span>
                          {offer.minPurchaseAmount > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5">Min purchase: ₹{offer.minPurchaseAmount}</p>
                          )}
                          {offer.usageLimit && (
                            <p className="text-xs text-gray-500 mt-0.5">Limit: {offer.usageLimit} uses</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {offer.categoryId ? (
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{offer.categoryId.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">All Categories</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div className="text-sm text-gray-900">
                          <div>{format(new Date(offer.validFrom), 'MMM dd, yyyy')}</div>
                          <div className="text-xs text-gray-500">to {format(new Date(offer.validUntil), 'MMM dd, yyyy')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {updating === offer._id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                      ) : (
                        <button
                          onClick={() => handleStatusToggle(offer._id, offer.isActive)}
                          disabled={updating === offer._id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all duration-150 hover:scale-105 active:scale-95 ${
                            offer.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {offer.isActive ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {offer.isActive ? 'Active' : 'Inactive'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(offer)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(offer)}
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

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-200/60 animate-scale-in">
            {/* Sticky Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">
                {showEditModal ? 'Edit Offer' : 'Add New Offer'}
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

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form
                id="offer-form"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value })
                      // Clear error when user starts typing
                      if (formErrors.title && e.target.value.trim()) {
                        setFormErrors(prev => {
                          const newErrors = { ...prev }
                          delete newErrors.title
                          return newErrors
                        })
                      }
                    }}
                    onBlur={() => {
                      // Validate on blur
                      if (!formData.title.trim()) {
                        setFormErrors(prev => ({
                          ...prev,
                          title: 'Title is required'
                        }))
                      }
                    }}
                    className={`input-field ${formErrors.title ? 'border-red-500' : ''}`}
                  />
                  {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="input-field"
                    placeholder="DISCOUNT10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field min-h-[80px]"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input-field"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="flat">Flat Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => {
                      setFormData({ ...formData, value: e.target.value })
                      // Clear error when user starts typing
                      if (formErrors.value && e.target.value && parseFloat(e.target.value) > 0) {
                        setFormErrors(prev => {
                          const newErrors = { ...prev }
                          delete newErrors.value
                          return newErrors
                        })
                      }
                    }}
                    onBlur={() => {
                      // Validate on blur
                      if (!formData.value || parseFloat(formData.value) <= 0) {
                        setFormErrors(prev => ({
                          ...prev,
                          value: 'Value is required'
                        }))
                      }
                    }}
                    className={`input-field ${formErrors.value ? 'border-red-500' : ''}`}
                  />
                  {formErrors.value && <p className="text-red-500 text-xs mt-1">{formErrors.value}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid From *</label>
                  <input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => {
                      setFormData({ ...formData, validFrom: e.target.value })
                      // Clear error when user selects a date
                      if (formErrors.validFrom && e.target.value) {
                        setFormErrors(prev => {
                          const newErrors = { ...prev }
                          delete newErrors.validFrom
                          // Also check if validUntil is after validFrom
                          if (formData.validUntil && new Date(e.target.value) >= new Date(formData.validUntil)) {
                            newErrors.validUntil = 'Valid until must be after valid from'
                          } else {
                            delete newErrors.validUntil
                          }
                          return newErrors
                        })
                      }
                    }}
                    onBlur={() => {
                      // Validate on blur
                      if (!formData.validFrom) {
                        setFormErrors(prev => ({
                          ...prev,
                          validFrom: 'Valid from date is required'
                        }))
                      } else if (formData.validUntil && new Date(formData.validFrom) >= new Date(formData.validUntil)) {
                        setFormErrors(prev => ({
                          ...prev,
                          validUntil: 'Valid until must be after valid from'
                        }))
                      }
                    }}
                    className={`input-field ${formErrors.validFrom ? 'border-red-500' : ''}`}
                  />
                  {formErrors.validFrom && <p className="text-red-500 text-xs mt-1">{formErrors.validFrom}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
                  <input
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) => {
                      setFormData({ ...formData, validUntil: e.target.value })
                      // Clear error when user selects a date
                      if (formErrors.validUntil && e.target.value) {
                        if (formData.validFrom && new Date(e.target.value) > new Date(formData.validFrom)) {
                          setFormErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors.validUntil
                            return newErrors
                          })
                        }
                      }
                    }}
                    onBlur={() => {
                      // Validate on blur
                      if (!formData.validUntil) {
                        setFormErrors(prev => ({
                          ...prev,
                          validUntil: 'Valid until date is required'
                        }))
                      } else if (formData.validFrom && new Date(formData.validUntil) <= new Date(formData.validFrom)) {
                        setFormErrors(prev => ({
                          ...prev,
                          validUntil: 'Valid until must be after valid from'
                        }))
                      }
                    }}
                    className={`input-field ${formErrors.validUntil ? 'border-red-500' : ''}`}
                  />
                  {formErrors.validUntil && <p className="text-red-500 text-xs mt-1">{formErrors.validUntil}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Category (Optional)</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="input-field"
                    placeholder="Unlimited if empty"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Purchase Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minPurchaseAmount}
                  onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })}
                  className="input-field"
                />
              </div>
              </form>
            </div>

            {/* Sticky Footer */}
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
                <button
                  type="submit"
                  form="offer-form"
                  disabled={submitting}
                  className="btn-primary flex-1"
                >
                  {submitting ? 'Saving...' : showEditModal ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Offer"
        message={`Are you sure you want to delete "${selectedOffer?.title}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  )
}

export default Offers
