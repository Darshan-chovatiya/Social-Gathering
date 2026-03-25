import { useState, useEffect, useRef } from 'react'
import { Menu, LogOut, User, Settings, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import ConfirmDialog from '../common/ConfirmDialog'
import { useNavigate } from 'react-router-dom'
const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuthStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [imageError, setImageError] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  const apiBase = baseURL.replace('/api', '')
  const profilePictureUrl = user?.profilePicture ? `${apiBase}${user.profilePicture}` : null

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    setShowLogoutConfirm(false)
    navigate('/login', { replace: true })
  }

  const handleAccountSettings = () => {
   navigate('/settings')
    setDropdownOpen(false)
  }

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false)
  }, [user?.profilePicture])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 px-4 sm:px-6 h-16 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 active:scale-95"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-50/50 hover:from-gray-100 hover:to-gray-100/50 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-2 shadow-sm hover:shadow-md active:scale-95"
                aria-label="Profile menu"
              >
                <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                  {profilePictureUrl && !imageError ? (
                    <img
                      src={profilePictureUrl}
                      alt={user?.name || 'Profile'}
                      className="w-9 h-9 rounded-full object-cover shadow-md shadow-primary-500/20 ring-2 ring-white"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md shadow-primary-500/20 ring-2 ring-white">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900 font-sans">
                      {user?.name || 'Organizer'}
                    </p>
                    <p className="text-xs text-gray-500 font-sans">
                      {user?.email || user?.mobile || 'organizer@example.com'}
                    </p>
                  </div>
                </div>
                <div className="sm:hidden">
                  {profilePictureUrl && !imageError ? (
                    <img
                      src={profilePictureUrl}
                      alt={user?.name || 'Profile'}
                      className="w-9 h-9 rounded-full object-cover shadow-md shadow-primary-500/20 ring-2 ring-white"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md shadow-primary-500/20 ring-2 ring-white">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                    dropdownOpen ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200/60 py-2 z-50 animate-fade-in backdrop-blur-sm bg-white/95">
                  <div className="px-4 py-3 border-b border-gray-200/60 sm:hidden bg-gradient-to-r from-gray-50 to-transparent">
                    <p className="text-sm font-semibold text-gray-900 font-sans">
                      {user?.name || 'Organizer'}
                    </p>
                    <p className="text-xs text-gray-500 font-sans mt-0.5">
                      {user?.email || user?.mobile || 'organizer@example.com'}
                    </p>
                  </div>
                  
                  <button
                    onClick={handleAccountSettings}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all duration-150 font-sans text-left rounded-lg mx-1"
                  >
                    <Settings className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span>Account Settings</span>
                  </button>
                  
                  <div className="border-t border-gray-200/60 my-1"></div>
                  
                  <button
                    onClick={() => {
                      setShowLogoutConfirm(true)
                      setDropdownOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-all duration-150 font-sans text-left rounded-lg mx-1"
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Dialog - Rendered outside header for proper centering */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to login again to access the organizer panel."
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  )
}

export default Header

