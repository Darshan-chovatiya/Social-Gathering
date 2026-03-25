import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import { Settings as SettingsIcon, User, Mail, Phone, Save, Lock, Eye, EyeOff, X, Image as ImageIcon, Pencil } from 'lucide-react'

const Settings = () => {
  const { user, setAuth } = useAuthStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
  })
  const [profilePicture, setProfilePicture] = useState(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)
  const [profilePictureError, setProfilePictureError] = useState(false)
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
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
      })
      // Set existing profile picture preview
      if (user.profilePicture) {
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
        const apiBase = baseURL.replace('/api', '')
        setProfilePicturePreview(`${apiBase}${user.profilePicture}`)
        setProfilePictureError(false)
      }
    }
  }, [user])

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.')
        return
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }

      setProfilePicture(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result)
        setProfilePictureError(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeProfilePicture = () => {
    setProfilePicture(null)
    setProfilePicturePreview(null)
    setProfilePictureError(false)
    // Reset file input
    const fileInput = document.getElementById('profilePictureInput')
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('email', formData.email)
      
      // Add profile picture if selected
      if (profilePicture) {
        formDataToSend.append('profilePicture', profilePicture)
      }

      const response = await api.put('/users/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      if (response.data.status === 200) {
        toast.success('Profile updated successfully')
        // Update auth store with new user data
        if (response.data.result?.user) {
          const { token } = useAuthStore.getState()
          setAuth(response.data.result.user, token)
          // Update preview if profile picture was uploaded
          if (response.data.result.user.profilePicture) {
            const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
            const apiBase = baseURL.replace('/api', '')
            setProfilePicturePreview(`${apiBase}${response.data.result.user.profilePicture}`)
            setProfilePictureError(false)
          }
          setProfilePicture(null) // Clear the file input
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    // Validate password length
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setSavingPassword(true)
    
    try {
      const response = await api.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      })
      if (response.data.status === 200) {
        toast.success('Password changed successfully')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) {
    return <Loading size="lg" text="Loading settings..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account settings</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'profile'
                ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </div>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'password'
                ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              Change Password
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary-50 p-3 rounded-xl">
                  <SettingsIcon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                  <p className="text-xs text-gray-500">Update your personal information</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <ImageIcon className="w-4 h-4 inline mr-2" />
                    Profile Picture
                  </label>
                  <div className="relative group inline-block">
                    {profilePictureError || !profilePicturePreview ? (
                      <div 
                        className="w-24 h-24 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors relative group"
                        onClick={() => document.getElementById('profilePictureInput')?.click()}
                      >
                        <User className="w-12 h-12 text-gray-400" />
                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Pencil className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <img
                          src={profilePicturePreview}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-2 border-gray-200 cursor-pointer"
                          onClick={() => document.getElementById('profilePictureInput')?.click()}
                          onError={() => setProfilePictureError(true)}
                        />
                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => document.getElementById('profilePictureInput')?.click()}>
                          <Pencil className="w-6 h-6 text-white" />
                        </div>
                      </>
                    )}
                    <input
                      id="profilePictureInput"
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleProfilePictureChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="input-field"
                    required
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Mobile number cannot be changed</p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary-50 p-3 rounded-xl">
                  <Lock className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
                  <p className="text-xs text-gray-500">Update your account password</p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="input-field pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="input-field pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 6 characters long
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="input-field pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {savingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings

