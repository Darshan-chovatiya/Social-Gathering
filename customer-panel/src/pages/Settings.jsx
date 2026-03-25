import { useState, useEffect } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
// import { User, Mail, Phone, Save, Upload, X, Loader2, Home, ChevronRight } from 'lucide-react'
import { User, Mail, Phone, Save, X, Loader2, Pencil, ImageOff, Home, ChevronRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import api from '../utils/api'
import Loading from '../components/common/Loading'
import { useToast } from '../components/common/ToastContainer'

const Settings = () => {
  const navigate = useNavigate()
  const { user, setAuth } = useAuthStore()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    mobile: '',
  })
  
  const [profilePicture, setProfilePicture] = useState(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)
  const [profileImageError, setProfileImageError] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users/profile')
      if (response.data.status === 200) {
        const userData = response.data.result.user
        setProfileData({
          name: userData.name || '',
          email: userData.email || '',
          mobile: userData.mobile || '',
        })
        if (userData.profilePicture) {
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
          const baseUrl = API_BASE_URL.replace('/api', '')
          setProfilePicturePreview(`${baseUrl}${userData.profilePicture}`)
          setProfileImageError(false)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }
      setProfilePicture(file)
      setProfileImageError(false)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileImageError = () => {
    setProfileImageError(true)
  }

  const removeProfilePicture = () => {
    setProfilePicture(null)
    setProfilePicturePreview(null)
    setProfileImageError(false)
  }

  const validateProfile = () => {
    const newErrors = {}
    
    if (!profileData.name || profileData.name.trim() === '') {
      newErrors.name = 'Name is required'
    }
    
    if (profileData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateProfile()) {
      return
    }

    try {
      setSaving(true)
      const formData = new FormData()
      formData.append('name', profileData.name.trim())
      if (profileData.email) {
        formData.append('email', profileData.email.trim())
      }
      if (profilePicture) {
        formData.append('profilePicture', profilePicture)
      }

      const response = await api.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.status === 200) {
        const updatedUser = response.data.result.user
        setAuth(updatedUser, useAuthStore.getState().token)
        toast.success('Profile updated successfully')
        // Remove preview after successful upload
        if (profilePicture) {
          setProfilePicture(null)
        }
      } else {
        toast.error(response.data.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      const errorMessage = error.response?.data?.message || 'Failed to update profile'
      toast.error(errorMessage)
      
      // Set field-specific errors if available
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loading size="lg" text="Loading profile..." />
      </div>
    )
  }

  const needsProfileCompletion = !profileData.name || !profileData.email

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <NavLink
            to="/"
            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </NavLink>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <span className="text-gray-900 dark:text-white font-medium">Account Settings</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 lg:mb-2">
            Account Settings
          </h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
            {needsProfileCompletion 
              ? 'Complete your profile to get started'
              : 'Manage your account settings'
            }
          </p>
        </div>

        {/* Profile Update Section - Centered */}
        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-primary-600 dark:bg-primary-700 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Profile Information
                </h2>
                <p className="text-sm text-white/90">
                  Update your personal information
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Profile Picture
              </label>
              <div className="flex justify-center">
                <div className="relative group">
                  {profilePicturePreview && !profileImageError ? (
                    <div className="relative">
                      <img
                        src={profilePicturePreview}
                        alt="Profile"
                        className="w-28 h-28 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 shadow-md"
                        onError={handleProfileImageError}
                      />
                      <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <Pencil className="w-5 h-5 text-primary-600" />
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={removeProfilePicture}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative group">
                      <div className="w-28 h-28 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 shadow-md">
                        {profileImageError ? (
                          <ImageOff className="w-14 h-14 text-gray-400 dark:text-gray-500" />
                        ) : (
                          <User className="w-14 h-14 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                      <label className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <Pencil className="w-5 h-5 text-primary-600" />
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePictureChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                JPG, PNG or GIF. Max size 5MB
              </p>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name <span className="text-primary-600 dark:text-primary-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                    errors.name ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Email and Mobile - Side by side on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address <span className="text-primary-600 dark:text-primary-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Mobile (Read-only) */}
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={profileData.mobile}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    readOnly
                    disabled
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Mobile number cannot be changed
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Settings

