import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { 
  Tag, 
  Plus, 
  Edit, 
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  Upload,
  Image as ImageIcon,
  X,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'

const Categories = () => {
  const { toast } = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updating, setUpdating] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/categories')
      if (response.data.status === 200) {
        setCategories(response.data.result.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setFormData({ name: '', description: '' })
    setFormErrors({})
    setImageFile(null)
    setImagePreview(null)
    setShowAddModal(true)
  }

  const handleEdit = (category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name || '',
      description: category.description || '',
    })
    setFormErrors({})
    setImageFile(null)
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
    const apiBase = baseURL.replace('/api', '')
    setImagePreview(category.image ? `${apiBase}${category.image}` : null)
    setShowEditModal(true)
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

  const handleDelete = (category) => {
    setSelectedCategory(category)
    setShowDeleteModal(true)
  }

  const handleToggleStatus = async (categoryId, currentStatus) => {
    try {
      setUpdating(categoryId)
      const response = await api.put(`/admin/categories/${categoryId}`, {
        isActive: !currentStatus,
      })
      
      if (response.data.status === 200) {
        toast.success('Category status updated successfully')
        fetchCategories()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update category status')
    } finally {
      setUpdating(null)
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('description', formData.description || '')
      
      if (imageFile) {
        formDataToSend.append('image', imageFile)
      }

      const response = showEditModal
        ? await api.put(`/admin/categories/${selectedCategory._id}`, formDataToSend)
        : await api.post('/admin/categories', formDataToSend)

      if (response.data.status === 200 || response.data.status === 201) {
        toast.success(`Category ${showEditModal ? 'updated' : 'created'} successfully`)
        setShowAddModal(false)
        setShowEditModal(false)
        setFormData({ name: '', description: '' })
        setImageFile(null)
        setImagePreview(null)
        fetchCategories()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${showEditModal ? 'update' : 'create'} category`)
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    try {
      const response = await api.delete(`/admin/categories/${selectedCategory._id}`)
      if (response.data.status === 200) {
        toast.success('Category deleted successfully')
        setShowDeleteModal(false)
        fetchCategories()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category')
    }
  }

  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (statusFilter === 'all') return matchesSearch
    return matchesSearch && (statusFilter === 'active' ? cat.isActive === true : cat.isActive === false)
  })

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">Categories</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base font-medium">Manage event categories</p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
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

      {/* Categories Grid */}
      {loading ? (
        <Loading />
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No categories found"
          message={searchTerm ? "No categories match your search." : "Get started by creating your first category."}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((category) => (
                  <tr key={category._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {category.image ? (
                          <img
                            src={`${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '')}${category.image}`}
                            alt={category.name}
                            className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border-2 border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-600 shadow-sm">
                            <Tag className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {category.description ? (
                        <p className="text-sm text-gray-600 line-clamp-2">{category.description}</p>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">
                        {category.createdAt && format(new Date(category.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {updating === category._id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(category._id, category.isActive)}
                          disabled={updating === category._id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all duration-150 hover:scale-105 active:scale-95 ${
                            category.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {category.isActive ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {category.isActive ? 'Active' : 'Inactive'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category)}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col border border-gray-200/60 animate-scale-in">
            {/* Sticky Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">
                {showEditModal ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
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
                id="category-form"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
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
                    className={`input-field ${formErrors.name ? 'border-red-500' : ''}`}
                  />
                  {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field min-h-[100px]"
                    rows={4}
                  />
                </div>

                {/* Image Upload - Improved UX */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Category Image <span className="text-gray-500 font-normal text-xs">(Optional)</span></label>
                  
                  {imagePreview ? (
                    <div className="space-y-3">
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-48 rounded-xl object-cover border-2 border-gray-200 shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null)
                            setImagePreview(null)
                          }}
                          className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 shadow-lg hover:scale-110"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => document.getElementById('category-image-input')?.click()}
                        className="w-full px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        Change Image
                      </button>
                      <input
                        id="category-image-input"
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
                          Click to upload image
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
                    setImageFile(null)
                    setImagePreview(null)
                  }}
                  className="btn-secondary flex-1"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="category-form"
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
        title="Delete Category"
        message={`Are you sure you want to delete "${selectedCategory?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  )
}

export default Categories
