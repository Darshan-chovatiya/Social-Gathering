import { useState } from 'react'
import { X, LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import ConfirmDialog from '../common/ConfirmDialog'
import {
  LayoutDashboard,
  Calendar,
  Tag,
  Ticket,
  Settings,
} from 'lucide-react'

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuthStore()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/categories', icon: Tag, label: 'Categories' },
    { path: '/offers', icon: Ticket, label: 'Offers' },
  ]

  return (
    <>
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900 to-gray-900 dark:from-gray-950 dark:to-gray-950 border-r border-gray-800/50 dark:border-gray-700/50 flex flex-col transform transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="h-16 px-4 sm:px-6 border-b border-gray-800/50 dark:border-gray-700/50 flex items-center justify-between bg-gray-900/50 dark:bg-gray-950/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/30">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div className='align-middle'>
              <div className="text-lg sm:text-xl font-bold text-white font-sans" style={{ lineHeight: '20px' }}>
                Easy Tickets
              </div>
              <div className="text-gray-400 dark:text-gray-500 text-xs font-medium">Customer Panel</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-800/50 dark:hover:bg-gray-700/50 transition-all duration-200 active:scale-95"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-300 dark:text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/events'}
                onClick={() => {
                  // Close sidebar on mobile when navigating
                  if (window.innerWidth < 1024) {
                    onClose()
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-sans group ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold shadow-lg shadow-primary-600/30 transform scale-[1.02]'
                      : 'text-gray-300 dark:text-gray-400 hover:bg-gray-800/50 dark:hover:bg-gray-800/50 hover:text-white hover:translate-x-1'
                  }`
                }
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'group-hover:scale-110' : ''}`} />
                <span className="text-sm sm:text-base">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-800/50 dark:border-gray-700/50 bg-gray-900/30 dark:bg-gray-950/30 space-y-1.5">
          <NavLink
            to="/settings"
            onClick={() => {
              if (window.innerWidth < 1024) {
                onClose()
              }
            }}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-sans group ${
                isActive
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold shadow-lg shadow-primary-600/30'
                  : 'text-gray-300 dark:text-gray-400 hover:bg-gray-800/50 dark:hover:bg-gray-800/50 hover:text-white hover:translate-x-1'
              }`
            }
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm sm:text-base">Settings</span>
          </NavLink>
          
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-sans group text-gray-300 dark:text-gray-400 hover:bg-[#f84464]/30 dark:hover:bg-[#f84464]/50 hover:text-[#fde4e6] dark:hover:text-[#fde4e6] hover:translate-x-1 active:scale-95"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm sm:text-base">Logout</span>
          </button>
        </div>
      </aside>

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
      />
    </>
  )
}

export default Sidebar

