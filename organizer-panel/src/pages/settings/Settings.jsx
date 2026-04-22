import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import { Settings as SettingsIcon, User, Mail, Phone, Save, Lock, Eye, EyeOff, X, Image as ImageIcon, Pencil, CreditCard } from 'lucide-react'

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
  const [paymentConfig, setPaymentConfig] = useState({
    gateway: 'razorpay',
    razorpay: {
      keyId: '',
      keySecret: '',
    },
    cashfree: {
      appId: '',
      secretKey: '',
    },
    ccavenue: {
      merchantId: '',
      accessCode: '',
      workingKey: '',
    }
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
      
      // Set existing payment config
      if (user.paymentConfig) {
        setPaymentConfig({
          gateway: user.paymentConfig.gateway || 'razorpay',
          razorpay: {
            keyId: user.paymentConfig.razorpay?.keyId || '',
            keySecret: user.paymentConfig.razorpay?.keySecret || '',
          },
          cashfree: {
            appId: user.paymentConfig.cashfree?.appId || '',
            secretKey: user.paymentConfig.cashfree?.secretKey || '',
          },
          ccavenue: {
            merchantId: user.paymentConfig.ccavenue?.merchantId || '',
            accessCode: user.paymentConfig.ccavenue?.accessCode || '',
            workingKey: user.paymentConfig.ccavenue?.workingKey || '',
          }
        })
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

      // Add payment config - only send the selected gateway's config
      const paymentConfigToSend = {
        gateway: paymentConfig.gateway,
        [paymentConfig.gateway]: paymentConfig[paymentConfig.gateway]
      }
      formDataToSend.append('paymentConfig', JSON.stringify(paymentConfigToSend))

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
            className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'profile'
                ? 'border-primary-600 text-primary-600 bg-primary-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </div>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'password'
                ? 'border-primary-600 text-primary-600 bg-primary-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              Change Password
            </div>
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`px-8 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === 'payment'
                ? 'border-primary-600 text-primary-600 bg-primary-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Settings
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

          {/* Payment Settings Tab */}
          {activeTab === 'payment' && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary-50 p-3 rounded-xl">
                  <CreditCard className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Default Payment Configuration</h2>
                  <p className="text-xs text-gray-500">Set your default payment credentials for all events</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Gateway Selection</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['razorpay', 'cashfree', 'ccavenue'].map((gw) => (
                      <label 
                        key={gw}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          paymentConfig.gateway === gw 
                            ? 'border-primary-600 bg-white ring-4 ring-primary-50' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="gateway"
                            value={gw}
                            checked={paymentConfig.gateway === gw}
                            onChange={(e) => setPaymentConfig({ 
                              gateway: e.target.value,
                              razorpay: { keyId: '', keySecret: '' },
                              cashfree: { appId: '', secretKey: '' },
                              ccavenue: { merchantId: '', accessCode: '', workingKey: '' }
                            })}
                            className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="text-sm font-bold text-gray-900 capitalize">{gw}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {paymentConfig.gateway === 'razorpay' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <img src="https://razorpay.com/favicon.png" alt="" className="w-4 h-4" />
                      Razorpay Credentials
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Key ID</label>
                        <input
                          type="text"
                          value={paymentConfig.razorpay.keyId}
                          onChange={(e) => setPaymentConfig({
                            ...paymentConfig,
                            razorpay: { ...paymentConfig.razorpay, keyId: e.target.value }
                          })}
                          placeholder="rzp_test_..."
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Key Secret</label>
                        <input
                          type="password"
                          value={paymentConfig.razorpay.keySecret}
                          onChange={(e) => setPaymentConfig({
                            ...paymentConfig,
                            razorpay: { ...paymentConfig.razorpay, keySecret: e.target.value }
                          })}
                          placeholder="••••••••••••"
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentConfig.gateway === 'cashfree' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      Cashfree Credentials
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">App ID</label>
                        <input
                          type="text"
                          value={paymentConfig.cashfree.appId}
                          onChange={(e) => setPaymentConfig({
                            ...paymentConfig,
                            cashfree: { ...paymentConfig.cashfree, appId: e.target.value }
                          })}
                          placeholder="App ID"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Secret Key</label>
                        <input
                          type="password"
                          value={paymentConfig.cashfree.secretKey}
                          onChange={(e) => setPaymentConfig({
                            ...paymentConfig,
                            cashfree: { ...paymentConfig.cashfree, secretKey: e.target.value }
                          })}
                          placeholder="••••••••••••"
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentConfig.gateway === 'ccavenue' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      CCAvenue Credentials
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Merchant ID</label>
                        <input
                          type="text"
                          value={paymentConfig.ccavenue.merchantId}
                          onChange={(e) => setPaymentConfig({
                            ...paymentConfig,
                            ccavenue: { ...paymentConfig.ccavenue, merchantId: e.target.value }
                          })}
                          placeholder="Merchant ID"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Access Code</label>
                        <input
                          type="text"
                          value={paymentConfig.ccavenue.accessCode}
                          onChange={(e) => setPaymentConfig({
                            ...paymentConfig,
                            ccavenue: { ...paymentConfig.ccavenue, accessCode: e.target.value }
                          })}
                          placeholder="Access Code"
                          className="input-field"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Working Key</label>
                        <input
                          type="password"
                          value={paymentConfig.ccavenue.workingKey}
                          onChange={(e) => setPaymentConfig({
                            ...paymentConfig,
                            ccavenue: { ...paymentConfig.ccavenue, workingKey: e.target.value }
                          })}
                          placeholder="••••••••••••"
                          className="input-field"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Default Payment Config'}
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

