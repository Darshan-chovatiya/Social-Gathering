import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Search,
  MapPin,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Ticket,
  Home,
  Globe,
  Info,
  FileText,
  Settings as SettingsIcon,
  History,
  Link2,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import ConfirmDialog from '../common/ConfirmDialog'
import logoIcon from '../../assets/Logo Icon.png'
import NotificationTray from './NotificationTray'

const Header = () => {
  // Temporary variable to hide navigation menu
  const SHOW_NAVIGATION_MENU = true
  // Temporary variable to hide search and location sections
  const SHOW_SEARCH_AND_LOCATION = false

  const { user, logout, isAuthenticated } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('Surat')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const dropdownRef = useRef(null)
  const locationRef = useRef(null)
  const servicesRef = useRef(null)

  const locations = ['Surat', 'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Ahmedabad']

  const handleLogout = () => {
    logout()
    navigate('/')
    setDropdownOpen(false)
    setShowLogoutConfirm(false)
  }

  const handleAccountSettings = () => {
    navigate('/settings')
    setDropdownOpen(false)
  }

  const getAvatarUrl = (profilePicture) => {
    if (!profilePicture) return null
    if (profilePicture.startsWith('http')) return profilePicture
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
    const baseUrl = API_BASE_URL.replace('/api', '')
    return `${baseUrl}${profilePicture}`
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const trimmedQuery = searchQuery.trim()
    if (trimmedQuery) {
      navigate(`/events?search=${encodeURIComponent(trimmedQuery)}`)
      setSearchQuery('') // Clear search after navigation
    }
  }

  // Ensure theme is applied when component mounts or theme changes
  useEffect(() => {
    const root = document.documentElement

    // Force remove dark class first
    root.classList.remove('dark')

    if (theme === 'dark') {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
      root.setAttribute('data-theme', 'dark')
    } else {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
      root.setAttribute('data-theme', 'light')
    }

    // Force a reflow to ensure styles are applied
    void root.offsetHeight
  }, [theme])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setLocationDropdownOpen(false)
      }
      if (servicesRef.current && !servicesRef.current.contains(event.target)) {
        setServicesDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <>
      <header className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 shadow-sm">
        {/* Top Row */}
        <div className="w-full bg-white dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <div className="flex items-center justify-between h-16 gap-4">
              {/* Logo */}
              <NavLink to="/" className="flex items-center gap-3 flex-shrink-0 group">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 ${logoError ? 'bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700' : 'overflow-hidden'}`}>
                  {logoError ? (
                    <Ticket className="w-6 h-6 text-white" />
                  ) : (
                    <img
                      src={logoIcon}
                      alt="Social Gathering Logo"
                      className="w-full h-full object-contain"
                      onError={() => setLogoError(true)}
                    />
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-2xl font-extrabold text-primary-600 dark:text-primary-400 tracking-tight">Social</span>
                    <span className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Gathering</span>
                  </div>
                  <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 -mt-0.5 tracking-wide">Social Gathering</span>
                </div>
              </NavLink>

              {/* Right Side Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Desktop/Tablet Navigation - Right aligned with actions */}
                <nav className="hidden md:flex items-center gap-2 mr-1">
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-md text-sm font-semibold transition-all ${isActive
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`
                    }
                  >
                    Home
                  </NavLink>

                  <NavLink
                    to="/events"
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-md text-sm font-semibold transition-all ${isActive
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`
                    }
                  >
                    Events
                  </NavLink>
                </nav>

                {/* Location Selector - Desktop - BookMyShow Style */}
                {SHOW_SEARCH_AND_LOCATION && (
                  <div className="hidden md:block relative" ref={locationRef}>
                    <button
                      onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                    >
                      <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <span>{selectedLocation}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${locationDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {locationDropdownOpen && (
                      <div className="absolute top-full right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-fade-in">
                        {locations.map((location) => (
                          <button
                            key={location}
                            onClick={() => {
                              setSelectedLocation(location)
                              setLocationDropdownOpen(false)
                            }}
                            className={`w-full px-4 py-2.5 text-sm text-left transition-all ${selectedLocation === location
                              ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 font-medium'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                          >
                            {location}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Theme Toggle Button - Keep in header only for mobile */}
                {/* <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    toggleTheme()
                  }}
                  className="p-2 rounded-lg md:hidden bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-200 hover:scale-105 active:scale-95"
                  aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                  type="button"
                  title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                >
                  {theme === 'light' ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                </button> */}

                {/* Notifications */}
                {isAuthenticated && <NotificationTray />}

                {/* Sign In / User Profile */}
                {isAuthenticated ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                      aria-label="Profile menu"
                    >
                      {(() => {
                        const avatarUrl = user?.profilePicture ? getAvatarUrl(user.profilePicture) : null

                        return avatarUrl && !avatarError ? (
                          <img
                            src={avatarUrl}
                            alt="User Avatar"
                            className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                            onError={() => setAvatarError(true)}
                          />
                        ) : user?.name ? (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )
                      })()}
                      <div className="hidden lg:block text-left">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                          {user?.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                          {user?.email || user?.mobile || 'user@primetickets.com'}
                        </p>
                      </div>
                      <ChevronDown className={`hidden lg:block w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-fade-in">
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {user?.name || 'User'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user?.email || user?.mobile || 'user@primetickets.com'}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            navigate('/dashboard')
                            setDropdownOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-left"
                        >
                          <Home className="w-4 h-4" />
                          <span>Dashboard</span>
                        </button>

                        <button
                          onClick={handleAccountSettings}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-left"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Account Settings</span>
                        </button>

                        <button
                          onClick={() => {
                            navigate('/bookings')
                            setDropdownOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-left"
                        >
                          <History className="w-4 h-4" />
                          <span>Booking History</span>
                        </button>

                        <button
                          onClick={() => {
                            navigate('/affiliate-links')
                            setDropdownOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-left"
                        >
                          <Link2 className="w-4 h-4" />
                          <span>Affiliate Links</span>
                        </button>

                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                        <button
                          onClick={() => {
                            setShowLogoutConfirm(true)
                            setDropdownOpen(false)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className="px-4 py-2 rounded-md bg-primary-500 hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600 text-gray-900 text-sm font-semibold transition-all shadow-md hover:shadow-md"
                  >
                    Sign in
                  </button>
                )}

                {/* Mobile Menu Button - Show always */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-700 dark:text-gray-300"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>



        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
            <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto animate-slide-in" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 space-y-4">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg ${logoError ? 'bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700' : 'overflow-hidden'}`}>
                      {logoError ? (
                        <Ticket className="w-6 h-6 text-white" />
                      ) : (
                        <img
                          src={logoIcon}
                          alt="Social Gathering Logo"
                          className="w-full h-full object-contain"
                          onError={() => setLogoError(true)}
                        />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-xl font-extrabold text-primary-600 dark:text-primary-400 tracking-tight">Social</span>
                        <span className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Gathering</span>
                      </div>
                      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 -mt-0.5 tracking-wide">Social Gathering</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>

                {/* User Profile Section (if authenticated) */}
                {isAuthenticated && user && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const avatarUrl = user?.profilePicture ? getAvatarUrl(user.profilePicture) : null
                        return avatarUrl && !avatarError ? (
                          <img
                            src={avatarUrl}
                            alt="User Avatar"
                            className="w-12 h-12 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                            onError={() => setAvatarError(true)}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-lg">
                              {user.name ? user.name.charAt(0).toUpperCase() : user.mobile ? user.mobile.charAt(0) : 'U'}
                            </span>
                          </div>
                        )
                      })()}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {user.name || 'User'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {user.mobile || user.email || 'Customer'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Mobile Search - BookMyShow Style */}
                {SHOW_SEARCH_AND_LOCATION && (
                  <form onSubmit={handleSearch} className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for Movies, Events, Plays, Sports..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:focus:border-primary-400"
                      />
                    </div>
                  </form>
                )}

                {/* Mobile Location */}
                {/* <div className="relative mb-4" ref={locationRef}>
                <button
                  onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 w-full border border-gray-200 dark:border-gray-700"
                >
                  <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <span>{selectedLocation}</span>
                  <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${locationDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {locationDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                    {locations.map((location) => (
                      <button
                        key={location}
                        onClick={() => {
                          setSelectedLocation(location)
                          setLocationDropdownOpen(false)
                        }}
                        className={`w-full px-4 py-2.5 text-sm text-left transition-all ${selectedLocation === location
                            ? 'bg-primary-50 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                )}
              </div> */}

                {/* Mobile Navigation Links */}
                <nav className="space-y-1">
                  <NavLink
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all ${isActive
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/40'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`
                    }
                  >
                    <Globe className="w-4 h-4" />
                    <span>Home</span>
                  </NavLink>

                  <NavLink
                    to="/events"
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all ${isActive
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/40'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`
                    }
                  >
                    <Ticket className="w-4 h-4" />
                    <span>Events</span>
                  </NavLink>

                </nav>

                {/* Theme Toggle */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleTheme()
                      setMobileMenuOpen(false)
                    }}
                    className="ml-auto p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all duration-200 hover:scale-105 active:scale-95"
                    aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                    type="button"
                    title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                  >
                    {theme === 'light' ? (
                      <Moon className="w-5 h-5" />
                    ) : (
                      <Sun className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {isAuthenticated && (
                  <>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    <button
                      onClick={() => {
                        navigate('/dashboard')
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all w-full text-left"
                    >
                      <Home className="w-4 h-4" />
                      <span>Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/settings')
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all w-full text-left"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      <span>Account Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/bookings')
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all w-full text-left"
                    >
                      <History className="w-4 h-4" />
                      <span>Booking History</span>
                    </button>
                    <button
                      onClick={() => {
                        navigate('/affiliate-links')
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all w-full text-left"
                    >
                      <Link2 className="w-4 h-4" />
                      <span>Affiliate Links</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowLogoutConfirm(true)
                        setMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </>
                )}

                {!isAuthenticated && (
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Fixed Theme Toggle - Desktop/Tablet only */}
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          toggleTheme()
        }}
        className="hidden md:flex fixed bottom-6 right-6 z-[70] p-3 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        type="button"
        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </button>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to login again to access the customer panel."
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
        showCloseButton={false}
      />
    </>
  )
}

export default Header
