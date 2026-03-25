import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import { 
  Users, 
  Search, 
  CheckCircle, 
  XCircle, 
  Mail, 
  Phone,
  Calendar,
  TrendingUp,
  Loader2,
  Plus,
  Edit,
  Trash2,
  X,
  Upload,
  Image as ImageIcon
} from 'lucide-react'

const Organizers = () => {
  const { toast } = useToast()
  const [organizers, setOrganizers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })
  const [updating, setUpdating] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedOrganizer, setSelectedOrganizer] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    fetchOrganizers()
  }, [page, searchTerm, statusFilter])

  const fetchOrganizers = async () => {
    try {
      setLoading(true)
      // Fetch all organizers when filtering by status (backend doesn't support isActive filter)
      const params = {
        role: 'organizer',
        page: statusFilter !== 'all' ? 1 : page,
        limit: statusFilter !== 'all' ? 1000 : 10, // Fetch all when filtering
      }
      
      if (searchTerm) {
        params.search = searchTerm
      }
      
      const response = await api.get('/admin/users', { params })
      if (response.data.status === 200) {
        let filteredOrganizers = response.data.result.users || []
        
        // Client-side filtering by status (backend doesn't support isActive filter)
      if (statusFilter !== 'all') {
          filteredOrganizers = filteredOrganizers.filter(organizer => 
            statusFilter === 'active' ? organizer.isActive === true : organizer.isActive === false
          )
        }
        
        // Apply pagination after filtering
        if (statusFilter !== 'all') {
          const limit = 10
          const startIndex = (page - 1) * limit
          const endIndex = startIndex + limit
          const paginatedOrganizers = filteredOrganizers.slice(startIndex, endIndex)
          
          setOrganizers(paginatedOrganizers)
          setPagination({
            page: parseInt(page),
            limit,
            total: filteredOrganizers.length,
            pages: Math.ceil(filteredOrganizers.length / limit),
          })
        } else {
          // Use backend pagination when no status filter
          setOrganizers(filteredOrganizers)
        setPagination(response.data.result.pagination || { total: 0, pages: 1 })
        }
      }
    } catch (error) {
      console.error('Error fetching organizers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (organizerId, currentStatus) => {
    try {
      setUpdating(organizerId)
      const response = await api.put(`/admin/users/${organizerId}/status`, {
        isActive: !currentStatus,
      })
      
      if (response.data.status === 200) {
        toast.success('Organizer status updated successfully')
        fetchOrganizers()
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error(error.response?.data?.message || 'Failed to update organizer status')
    } finally {
      setUpdating(null)
    }
  }

  const handleRoleChange = async (organizerId, newRole) => {
    try {
      setUpdating(organizerId)
      const response = await api.put(`/admin/users/${organizerId}/role`, {
        role: newRole,
      })
      
      if (response.data.status === 200) {
        fetchOrganizers()
      }
    } catch (error) {
      console.error('Error updating role:', error)
    } finally {
      setUpdating(null)
    }
  }

  const handleAdd = () => {
    setFormData({ name: '', email: '', mobile: '', password: '' })
    setFormErrors({})
    setImageFile(null)
    setImagePreview(null)
    setShowAddModal(true)
  }

  const handleEdit = (organizer) => {
    setSelectedOrganizer(organizer)
    setFormData({
      name: organizer.name || '',
      email: organizer.email || '',
      mobile: organizer.mobile || '',
      password: '',
    })
    setFormErrors({})
    setImageFile(null)
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
    const apiBase = baseURL.replace('/api', '')
    setImagePreview(organizer.profilePicture ? `${apiBase}${organizer.profilePicture}` : null)
    setShowEditModal(true)
  }

  const handleDelete = (organizer) => {
    setSelectedOrganizer(organizer)
    setShowDeleteModal(true)
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.mobile.trim()) {
      errors.mobile = 'Mobile number is required'
    } else if (!/^[0-9]{10}$/.test(formData.mobile)) {
      errors.mobile = 'Mobile must be 10 digits'
    }
    if (showAddModal && !formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setFormErrors({ ...formErrors, image: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)' })
        return
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors({ ...formErrors, image: 'Image size must be less than 5MB' })
        return
      }

      setImageFile(file)
      setFormErrors({ ...formErrors, image: null })
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setSubmitting(true)
      
      // Create FormData for file upload
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name.trim())
      formDataToSend.append('mobile', formData.mobile.trim())
      formDataToSend.append('role', 'organizer')
      formDataToSend.append('isActive', 'true')

      if (formData.email) formDataToSend.append('email', formData.email.trim())
      if (formData.password) formDataToSend.append('password', formData.password)
      if (imageFile) formDataToSend.append('profilePicture', imageFile)

      let response
      if (showAddModal) {
        response = await api.post('/admin/users', formDataToSend)
      } else {
        response = await api.put(`/admin/users/${selectedOrganizer._id}`, formDataToSend)
      }

      if (response.data.status === 200 || response.data.status === 201) {
        setShowAddModal(false)
        setShowEditModal(false)
        setFormData({ name: '', email: '', mobile: '', password: '' })
        setImageFile(null)
        setImagePreview(null)
        fetchOrganizers()
      }
    } catch (error) {
      if (error.response?.data?.message) {
        setFormErrors({ submit: error.response.data.message })
      } else {
        setFormErrors({ submit: 'Failed to save organizer' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      setUpdating(selectedOrganizer._id)
      const response = await api.delete(`/admin/users/${selectedOrganizer._id}`)
      
      if (response.data.status === 200) {
        setShowDeleteModal(false)
        setSelectedOrganizer(null)
        fetchOrganizers()
      }
    } catch (error) {
      if (error.response?.data?.message) {
        alert(error.response.data.message)
      } else {
        alert('Failed to delete organizer')
      }
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent font-sans">Organizers</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base font-medium font-sans">
            Manage all event organizers
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="btn-primary flex items-center gap-2 font-sans"
        >
          <Plus className="w-5 h-5" />
          <span>Add Organizer</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or mobile..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-sans"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-sans"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Organizers List */}
      {loading ? (
        <div className="card">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        </div>
      ) : organizers.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-sans">No organizers found</p>
          </div>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Organizer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Mobile</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {organizers.map((organizer) => (
                    <tr key={organizer._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {organizer.profilePicture ? (
                            <img
                              src={`${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '')}${organizer.profilePicture}`}
                              alt={organizer.name}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
                              <Users className="w-5 h-5 text-primary-600" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900 font-sans">{organizer.name}</h3>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {organizer.email ? (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 font-sans">{organizer.email}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500 font-sans">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 font-sans">{organizer.mobile}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900 font-sans">
                            {new Date(organizer.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {updating === organizer._id ? (
                          <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                        ) : (
                          <button
                            onClick={() => handleStatusToggle(organizer._id, organizer.isActive)}
                            disabled={updating === organizer._id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all duration-150 hover:scale-105 active:scale-95 ${
                              organizer.isActive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                        {organizer.isActive ? (
                              <CheckCircle className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {organizer.isActive ? 'Active' : 'Inactive'}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(organizer)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(organizer)}
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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 card">
              <p className="text-sm text-gray-600 font-sans">
                Showing {organizers.length} of {pagination.total} organizers
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                {(() => {
                  const pages = []
                  const totalPages = pagination.pages
                  const currentPage = page
                  
                  // Show first page
                  if (totalPages > 0) {
                    pages.push(1)
                  }
                  
                  // Calculate range around current page
                  let startPage = Math.max(2, currentPage - 1)
                  let endPage = Math.min(totalPages - 1, currentPage + 1)
                  
                  // Adjust if near start or end
                  if (currentPage <= 3) {
                    endPage = Math.min(5, totalPages - 1)
                  }
                  if (currentPage >= totalPages - 2) {
                    startPage = Math.max(2, totalPages - 4)
                  }
                  
                  // Add ellipsis after first page if needed
                  if (startPage > 2) {
                    pages.push('...')
                  }
                  
                  // Add pages in range
                  for (let i = startPage; i <= endPage; i++) {
                    if (i > 1 && i < totalPages) {
                      pages.push(i)
                    }
                  }
                  
                  // Add ellipsis before last page if needed
                  if (endPage < totalPages - 1) {
                    pages.push('...')
                  }
                  
                  // Show last page if more than 1 page
                  if (totalPages > 1) {
                    pages.push(totalPages)
                  }
                  
                  return pages.map((pageNum, idx) => {
                    if (pageNum === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 py-2 text-gray-500 font-sans">
                          ...
                </span>
                      )
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors font-sans ${
                          page === pageNum
                            ? 'bg-primary-500 text-gray-900 border border-primary-600'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })
                })()}
                
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}


      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col animate-scale-in border border-gray-200/60">
            {/* Sticky Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900 font-sans">
                {showAddModal ? 'Add Organizer' : 'Edit Organizer'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                  setFormData({ name: '', email: '', mobile: '', password: '' })
                  setFormErrors({})
                  setImageFile(null)
                  setImagePreview(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form
                id="organizer-form"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
              {formErrors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-sans">
                  {formErrors.submit}
                </div>
              )}

              {/* Image Upload - Improved UX */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 font-sans">
                  Profile Picture <span className="text-gray-500 font-normal text-xs">(Optional)</span>
                </label>
                
                {imagePreview ? (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null)
                            setImagePreview(null)
                          }}
                          className="absolute top-0 right-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 shadow-lg hover:scale-110"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => document.getElementById('organizer-image-input')?.click()}
                      className="w-full px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors font-sans"
                    >
                      Change Image
                    </button>
                    <input
                      id="organizer-image-input"
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                    />
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all duration-200 group">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200">
                        <Upload className="w-8 h-8 text-primary-600" />
                      </div>
                      <p className="mb-1 text-sm font-semibold text-gray-700 font-sans">
                        Click to upload profile picture
                      </p>
                      <p className="text-xs text-gray-500 font-sans mb-2">
                        or drag and drop here
                      </p>
                      <p className="text-xs text-gray-400 font-sans">
                        PNG, JPG, GIF, WEBP (MAX. 5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
                {formErrors.image && (
                  <p className="mt-2 text-sm text-red-600 font-sans flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    {formErrors.image}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    // Clear error when user starts typing
                    if (formErrors.name && e.target.value.trim()) {
                      setFormErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.name
                        return newErrors
                      })
                    }
                  }}
                  onBlur={() => {
                    // Validate on blur
                    if (!formData.name.trim()) {
                      setFormErrors(prev => ({
                        ...prev,
                        name: 'Name is required'
                      }))
                    }
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-sans ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter organizer name"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600 font-sans">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    // Clear error when user starts typing
                    if (formErrors.email && e.target.value.trim()) {
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                      if (emailRegex.test(e.target.value)) {
                        setFormErrors(prev => {
                          const newErrors = { ...prev }
                          delete newErrors.email
                          return newErrors
                        })
                      }
                    }
                  }}
                  onBlur={() => {
                    // Validate on blur
                    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                      setFormErrors(prev => ({
                        ...prev,
                        email: 'Invalid email format'
                      }))
                    }
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-sans ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email (optional)"
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600 font-sans">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                  Mobile <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/\D/g, '')
                    setFormData({ ...formData, mobile: numericValue })
                    // Clear error when user starts typing
                    if (formErrors.mobile && numericValue.length === 10) {
                      setFormErrors(prev => {
                        const newErrors = { ...prev }
                        delete newErrors.mobile
                        return newErrors
                      })
                    }
                  }}
                  onBlur={() => {
                    // Validate on blur
                    if (!formData.mobile.trim()) {
                      setFormErrors(prev => ({
                        ...prev,
                        mobile: 'Mobile number is required'
                      }))
                    } else if (!/^[0-9]{10}$/.test(formData.mobile)) {
                      setFormErrors(prev => ({
                        ...prev,
                        mobile: 'Mobile must be 10 digits'
                      }))
                    }
                  }}
                  maxLength={10}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-sans ${
                    formErrors.mobile ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter 10-digit mobile number"
                />
                {formErrors.mobile && (
                  <p className="mt-1 text-sm text-red-600 font-sans">{formErrors.mobile}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-sans">
                  Password {showAddModal && <span className="text-red-500">*</span>}
                  {showEditModal && <span className="text-gray-500 text-xs">(leave blank to keep current)</span>}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    // Clear error when user starts typing
                    if (formErrors.password) {
                      if (showEditModal || (e.target.value && e.target.value.length >= 6)) {
                        setFormErrors(prev => {
                          const newErrors = { ...prev }
                          delete newErrors.password
                          return newErrors
                        })
                      }
                    }
                  }}
                  onBlur={() => {
                    // Validate on blur
                    if (showAddModal && !formData.password) {
                      setFormErrors(prev => ({
                        ...prev,
                        password: 'Password is required'
                      }))
                    } else if (formData.password && formData.password.length < 6) {
                      setFormErrors(prev => ({
                        ...prev,
                        password: 'Password must be at least 6 characters'
                      }))
                    }
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-sans ${
                    formErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={showAddModal ? 'Enter password' : 'Enter new password (optional)'}
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600 font-sans">{formErrors.password}</p>
                )}
              </div>
              </form>
              </div>

            {/* Sticky Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white sticky bottom-0 z-10 rounded-b-2xl">
              <div className="flex items-center gap-3 p-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                    setFormData({ name: '', email: '', mobile: '', password: '' })
                    setFormErrors({})
                    setImageFile(null)
                    setImagePreview(null)
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-gray-700 font-sans"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="organizer-form"
                  disabled={submitting}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                >
                  {submitting ? 'Saving...' : showAddModal ? 'Create' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedOrganizer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in border border-gray-200/60">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 font-sans">Delete Organizer</h2>
                  <p className="text-sm text-gray-600 font-sans">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6 font-sans">
                Are you sure you want to delete <strong>{selectedOrganizer.name}</strong>? This will permanently remove the organizer from the system.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedOrganizer(null)
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold text-gray-700 font-sans"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={updating === selectedOrganizer._id}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                >
                  {updating === selectedOrganizer._id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Organizers

