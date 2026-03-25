import { useState, useEffect } from 'react'
import { Bell, Clock, MessageSquare, Calendar, Check, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import api from '../utils/api'
import Loading from '../components/common/Loading'
import EmptyState from '../components/common/EmptyState'

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // 'all', 'unread', 'read'

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await api.get('/notifications/my')
      if (response.data.status === 200) {
        setNotifications(response.data.result.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      )
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          n.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || 
                          (filter === 'unread' && !n.isRead) || 
                          (filter === 'read' && n.isRead)
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Loading size="lg" text="Loading notifications..." />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary-600" />
            Notifications
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Keep track of your event updates and messages</p>
        </div>
        
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                api.patch('/notifications/read-all').then(() => {
                  setNotifications(prev => prev.map(n => ({...n, isRead: true})))
                })
              }}
              className="px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <EmptyState
            icon={Bell}
            title={searchTerm || filter !== 'all' ? "No matching notifications" : "No notifications yet"}
            message={searchTerm || filter !== 'all' ? "Try adjusting your filters or search" : "We'll notify you when there's an update for your bookings."}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notif) => (
            <div
              key={notif._id}
              onClick={() => !notif.isRead && markAsRead(notif._id)}
              className={`group relative bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl border transition-all hover:shadow-md cursor-pointer ${
                !notif.isRead 
                  ? 'border-primary-100 dark:border-primary-900/30 bg-primary-50/10' 
                  : 'border-gray-100 dark:border-gray-700'
              }`}
            >
              <div className="flex gap-4 sm:gap-6">
                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                  !notif.isRead 
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                }`}>
                  {notif.type === 'event' ? <Calendar className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <h3 className={`text-lg font-bold ${!notif.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {notif.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {format(new Date(notif.createdAt), 'MMM d, yyyy HH:mm')}
                    </div>
                  </div>
                  
                  <p className={`text-sm leading-relaxed mb-3 ${!notif.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>
                    {notif.message}
                  </p>
                  
                  {!notif.isRead && (
                    <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
                      New Notification
                    </div>
                  )}
                </div>
              </div>
              
              {notif.isRead && (
                <div className="absolute top-4 right-4 text-emerald-500">
                  <Check className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notifications
