import { useState } from 'react'
import { X, LogOut } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import ConfirmDialog from '../common/ConfirmDialog'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  Tag,
  Ticket,
  Award,
  BarChart3,
  Settings,
  UserCheck,
} from 'lucide-react'

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
    if (window.innerWidth < 1024) {
      onClose()
    }
  }

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/users', icon: Users, label: 'Users' },
    { path: '/organizers', icon: UserCheck, label: 'Organizers' },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/events/pending', icon: Clock, label: 'Pending Events' },
    { path: '/categories', icon: Tag, label: 'Categories' },
    { path: '/offers', icon: Ticket, label: 'Offers' },
    { path: '/sponsors', icon: Award, label: 'Sponsors' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
  ]

  return (
    <>
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900 to-gray-900 border-r border-gray-800/50 flex flex-col transform transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="h-16 px-4 sm:px-6 border-b border-gray-800/50 flex items-center justify-between bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-500/30">
              <Ticket className="w-5 h-5 text-gray-900" />
            </div>
            <div className='align-middle'>
              <div className="text-lg sm:text-xl font-bold text-white font-sans" style={{ lineHeight: '20px' }}>
                Social Gathering
              </div>
              <div className="text-gray-400 text-xs font-medium">Admin Panel</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-800/50 transition-all duration-200 active:scale-95"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            // Use end prop for /events to prevent matching /events/pending
            const useEnd = item.path === '/events'
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={useEnd}
                onClick={() => {
                  // Close sidebar on mobile when navigating
                  if (window.innerWidth < 1024) {
                    onClose()
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-sans group ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-gray-900 font-semibold shadow-lg shadow-primary-500/30 transform scale-[1.02]'
                      : 'text-gray-300 hover:bg-gray-800/50 hover:text-white hover:translate-x-1'
                  }`
                }
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'group-hover:scale-110' : ''}`} />
                <span className="text-sm sm:text-base">{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-800/50 bg-gray-900/30 space-y-1.5">
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
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-gray-900 font-semibold shadow-lg shadow-primary-500/30'
                  : 'text-gray-300 hover:bg-gray-800/50 hover:text-white hover:translate-x-1'
              }`
            }
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm sm:text-base">Settings</span>
          </NavLink>
          
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-sans group text-gray-300 hover:bg-red-900/30 hover:text-red-300 hover:translate-x-1 active:scale-95"
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
        message="Are you sure you want to logout? You will need to login again to access the admin panel."
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  )
}

export default Sidebar

