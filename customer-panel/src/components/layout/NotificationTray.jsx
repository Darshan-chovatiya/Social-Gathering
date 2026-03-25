import { useState, useEffect, useRef } from 'react'
import { Bell, Check, Trash2, Clock, MessageSquare, Info, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { useAuthStore } from '../../store/authStore'

const NotificationTray = () => {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (user) {
      fetchNotifications()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications/my')
      if (response.data.status === 200) {
        const fetchedNotifications = response.data.result.notifications || []
        setNotifications(fetchedNotifications)
        setUnreadCount(fetchedNotifications.filter(n => !n.isRead).length)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all focus:outline-none"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed sm:absolute right-4 sm:right-0 mt-2 w-[calc(100vw-32px)] sm:w-96 max-h-[500px] overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[400px]">
            {notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                <Bell className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className={`p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${!notif.isRead ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                    onClick={() => !notif.isRead && markAsRead(notif._id)}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        !notif.isRead ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                      }`}>
                        {notif.type === 'event' ? <Calendar className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-semibold ${!notif.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="h-2 w-2 rounded-full bg-primary-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                          <Clock className="w-3 h-3" />
                          {format(new Date(notif.createdAt), 'MMM d, hh:mm a')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30 text-center">
            <Link 
              to="/notifications" 
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              View all history
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationTray
