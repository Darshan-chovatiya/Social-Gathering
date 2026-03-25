import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { 
  Users as UsersIcon, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Mail,
  Phone,
  Calendar,
  MoreVertical
} from 'lucide-react'
import { format } from 'date-fns'

const Users = () => {
  const { toast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })
  const [actionMenu, setActionMenu] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    role: 'user',
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [page, searchTerm, roleFilter, statusFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 10,
      }
      
      if (searchTerm) {
        params.search = searchTerm
      }
      
      if (roleFilter !== 'all') {
        params.role = roleFilter
      }

      const response = await api.get('/admin/users', { params })
      if (response.data.status === 200) {
        let filteredUsers = response.data.result.users || []
        
        // Exclude admin users from the listing
        filteredUsers = filteredUsers.filter(user => user.role !== 'admin')
        
        if (statusFilter !== 'all') {
          filteredUsers = filteredUsers.filter(user => 
            statusFilter === 'active' ? user.isActive : !user.isActive
          )
        }
        
        setUsers(filteredUsers)
        // Adjust pagination total to exclude admin users
        const totalWithoutAdmins = response.data.result.pagination?.total 
          ? Math.max(0, response.data.result.pagination.total - (response.data.result.users?.filter(u => u.role === 'admin').length || 0))
          : filteredUsers.length
        setPagination({ 
          ...response.data.result.pagination, 
          total: totalWithoutAdmins 
        })
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      const response = await api.put(`/admin/users/${userId}/status`, {
        isActive: !currentStatus,
      })
      
      if (response.data.status === 200) {
        toast.success('User status updated successfully')
        fetchUsers()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user status')
    } finally {
      setActionMenu(null)
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await api.put(`/admin/users/${userId}/role`, {
        role: newRole,
      })
      
      if (response.data.status === 200) {
        toast.success('User role updated successfully')
        fetchUsers()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user role')
    } finally {
      setActionMenu(null)
    }
  }

  const handleAdd = () => {
    setFormData({ name: '', email: '', mobile: '', password: '', role: 'user' })
    setFormErrors({})
    setShowAddModal(true)
  }

  const handleEdit = (user) => {
    setSelectedUser(user)
    setFormData({
      name: user.name || '',
      email: user.email || '',
      mobile: user.mobile || '',
      password: '',
      role: user.role || 'user',
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  const handleDelete = (user) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email'
    if (!formData.mobile.trim()) errors.mobile = 'Mobile is required'
    else if (!/^\d{10}$/.test(formData.mobile)) errors.mobile = 'Invalid mobile number'
    if (!showEditModal && !formData.password) errors.password = 'Password is required'
    if (formData.password && formData.password.length < 6) errors.password = 'Password must be at least 6 characters'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const payload = { ...formData }
      if (showEditModal && !payload.password) {
        delete payload.password
      }

      const response = showEditModal
        ? await api.put(`/admin/users/${selectedUser._id}`, payload)
        : await api.post('/admin/users', payload)

      if (response.data.status === 200 || response.data.status === 201) {
        toast.success(`User ${showEditModal ? 'updated' : 'created'} successfully`)
        setShowAddModal(false)
        setShowEditModal(false)
        fetchUsers()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${showEditModal ? 'update' : 'create'} user`)
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    try {
      const response = await api.delete(`/admin/users/${selectedUser._id}`)
      if (response.data.status === 200) {
        toast.success('User deleted successfully')
        setShowDeleteModal(false)
        fetchUsers()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user')
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">Users</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base font-medium">Manage all platform users</p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="card bg-gradient-to-br from-white to-gray-50/50">
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
              className="input-field pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            className="input-field sm:w-40"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="organizer">Organizer</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="input-field sm:w-40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <Loading />
      ) : users.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No users found"
          message="There are no users matching your filters."
        />
      ) : (
        <>
          <div className="card overflow-x-auto">
            <div className="min-w-full">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left py-4 px-4 font-semibold text-gray-900 text-sm uppercase tracking-wider">User</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900 text-sm uppercase tracking-wider">Contact</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900 text-sm uppercase tracking-wider">Role</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900 text-sm uppercase tracking-wider">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-900 text-sm uppercase tracking-wider">Joined</th>
                    <th className="text-right py-4 px-4 font-semibold text-gray-900 text-sm uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="table-row">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center ring-2 ring-primary-50">
                            <UsersIcon className="w-5 h-5 text-primary-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.name && user.name.trim() ? user.name : 'N/A'}
                            </p>
                            {/* <p className="text-sm text-gray-500">{user.email}</p> */}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {user.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              {user.email}
                            </div>
                          )}
                          {user.mobile && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              {user.mobile}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'organizer' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleStatusToggle(user._id, user.isActive)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all duration-150 hover:scale-105 active:scale-95 ${
                            user.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {user.isActive ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {user.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : '-'}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 active:bg-primary-100 rounded-lg transition-all duration-150 active:scale-95"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-all duration-150 active:scale-95"
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, pagination.total)} of {pagination.total} users
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <span key={`ellipsis-${idx}`} className="px-2 py-2 text-gray-500">
                          ...
                        </span>
                      )
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
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
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col border border-gray-200/60 animate-scale-in">
            {/* Sticky Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">
              {showEditModal ? 'Edit User' : 'Add New User'}
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
                id="user-form"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
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
                      if (!formData.email.trim()) {
                        setFormErrors(prev => ({
                          ...prev,
                          email: 'Email is required'
                        }))
                      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                        setFormErrors(prev => ({
                          ...prev,
                          email: 'Invalid email'
                        }))
                      }
                    }}
                  className={`input-field ${formErrors.email ? 'border-red-500' : ''}`}
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                <input
                  type="tel"
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
                          mobile: 'Mobile is required'
                        }))
                      } else if (!/^\d{10}$/.test(formData.mobile)) {
                        setFormErrors(prev => ({
                          ...prev,
                          mobile: 'Invalid mobile number'
                        }))
                      }
                    }}
                    maxLength={10}
                  className={`input-field ${formErrors.mobile ? 'border-red-500' : ''}`}
                />
                {formErrors.mobile && <p className="text-red-500 text-xs mt-1">{formErrors.mobile}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {showEditModal ? '(leave empty to keep current)' : '*'}
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
                      if (!showEditModal && !formData.password) {
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
                  className={`input-field ${formErrors.password ? 'border-red-500' : ''}`}
                />
                {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-field"
                >
                  <option value="user">User</option>
                  <option value="organizer">Organizer</option>
                </select>
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
                  form="user-form"
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
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.name}? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  )
}

export default Users
