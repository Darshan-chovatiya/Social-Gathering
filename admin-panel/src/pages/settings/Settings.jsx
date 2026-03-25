import { useState, useEffect } from 'react'
import api from '../../utils/api'
import axios from 'axios'
import { useToast } from '../../components/common/ToastContainer'
import { useAuthStore } from '../../store/authStore'
import { User, Mail, Phone, Lock, Save, Eye, EyeOff } from 'lucide-react'

const Settings = () => {
  const { toast } = useToast()
  const { user, setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    mobile: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
      })
    }
  }, [user])

  const validateProfile = () => {
    const errors = {}
    if (!profileData.name.trim()) errors.name = 'Name is required'
    if (!profileData.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) errors.email = 'Invalid email'
    if (!profileData.mobile.trim()) errors.mobile = 'Mobile is required'
    else if (!/^\d{10}$/.test(profileData.mobile)) errors.mobile = 'Invalid mobile number'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validatePasswordField = (field, value) => {
    const errors = { ...formErrors }
    
    if (field === 'currentPassword') {
      if (!value) {
        errors.currentPassword = 'Current password is required'
      } else {
        delete errors.currentPassword
      }
    }
    
    if (field === 'newPassword') {
      if (!value) {
        errors.newPassword = 'New password is required'
      } else if (value.length < 6) {
        errors.newPassword = 'Password must be at least 6 characters'
      } else {
        delete errors.newPassword
        // Also check confirm password if it's already filled
        if (passwordData.confirmPassword && value !== passwordData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match'
        } else if (passwordData.confirmPassword && value === passwordData.confirmPassword) {
          delete errors.confirmPassword
        }
      }
    }
    
    if (field === 'confirmPassword') {
      if (!value) {
        errors.confirmPassword = 'Please confirm your password'
      } else if (passwordData.newPassword && value !== passwordData.newPassword) {
        errors.confirmPassword = 'Passwords do not match'
      } else {
        delete errors.confirmPassword
      }
    }
    
    setFormErrors(errors)
  }

  const validatePassword = () => {
    const errors = {}
    if (!passwordData.currentPassword) errors.currentPassword = 'Current password is required'
    if (!passwordData.newPassword) errors.newPassword = 'New password is required'
    else if (passwordData.newPassword.length < 6) errors.newPassword = 'Password must be at least 6 characters'
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!validateProfile()) return

    setLoading(true)
    try {
      const response = await api.put(`/admin/users/${user.id}`, profileData)
      if (response.data.status === 200) {
        toast.success('Profile updated successfully')
        // Update auth store with new user data
        setAuth(response.data.result.user, user.token)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!validatePassword()) return

    setLoading(true)
    try {
      // Use axios directly to avoid the interceptor redirect
      const token = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token
      
      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/users/change-password`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )
      
      if (response.data.status === 200) {
        toast.success('Password changed successfully')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        setFormErrors({})
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to change password'
      toast.error(errorMessage)
      // Set error for current password if it's incorrect
      if (errorMessage.toLowerCase().includes('current password') || 
          errorMessage.toLowerCase().includes('incorrect') ||
          error.response?.status === 400) {
        setFormErrors({ ...formErrors, currentPassword: 'Current password is incorrect' })
      } else if (error.response?.status === 401) {
        // Handle authentication error without redirecting
        toast.error('Session expired. Please login again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent font-sans">Account Settings</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base font-medium font-sans">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setFormErrors({})
                }}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-md">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => {
                  setProfileData({ ...profileData, name: e.target.value })
                  if (formErrors.name && e.target.value.trim()) {
                    setFormErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.name
                      return newErrors
                    })
                  }
                }}
                onBlur={() => {
                  if (!profileData.name.trim()) {
                    setFormErrors(prev => ({ ...prev, name: 'Name is required' }))
                  }
                }}
                className={`input-field ${formErrors.name ? 'border-red-500' : ''}`}
                placeholder="Enter your full name"
              />
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 font-normal ml-2">(Read-only)</span>
              </label>
              <input
                type="email"
                value={profileData.email}
                readOnly
                className="input-field bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={profileData.mobile}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/\D/g, '')
                  setProfileData({ ...profileData, mobile: numericValue })
                  if (formErrors.mobile && numericValue.length === 10) {
                    setFormErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.mobile
                      return newErrors
                    })
                  }
                }}
                onBlur={() => {
                  if (!profileData.mobile.trim()) {
                    setFormErrors(prev => ({ ...prev, mobile: 'Mobile is required' }))
                  } else if (!/^\d{10}$/.test(profileData.mobile)) {
                    setFormErrors(prev => ({ ...prev, mobile: 'Invalid mobile number' }))
                  }
                }}
                maxLength={10}
                className={`input-field ${formErrors.mobile ? 'border-red-500' : ''}`}
                placeholder="Enter 10-digit mobile number"
              />
              {formErrors.mobile && <p className="text-red-500 text-xs mt-1">{formErrors.mobile}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    validatePasswordField('currentPassword', e.target.value)
                  }}
                  onBlur={() => {
                    validatePasswordField('currentPassword', passwordData.currentPassword)
                  }}
                  className={`input-field pr-10 ${formErrors.currentPassword ? 'border-red-500' : ''}`}
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.currentPassword && (
                <p className="text-red-500 text-xs mt-1">{formErrors.currentPassword}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                    validatePasswordField('newPassword', e.target.value)
                  }}
                  onBlur={() => {
                    validatePasswordField('newPassword', passwordData.newPassword)
                  }}
                  className={`input-field pr-10 ${formErrors.newPassword ? 'border-red-500' : ''}`}
                  placeholder="Enter new password (min 6 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.newPassword && (
                <p className="text-red-500 text-xs mt-1">{formErrors.newPassword}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    validatePasswordField('confirmPassword', e.target.value)
                  }}
                  onBlur={() => {
                    validatePasswordField('confirmPassword', passwordData.confirmPassword)
                  }}
                  className={`input-field pr-10 ${formErrors.confirmPassword ? 'border-red-500' : ''}`}
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 w-full sm:w-auto"
            >
              <Lock className="w-4 h-4" />
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default Settings
