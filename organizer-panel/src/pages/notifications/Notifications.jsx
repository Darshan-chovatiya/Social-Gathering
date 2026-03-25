import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import EmptyState from '../../components/common/EmptyState'
import CustomDropdown from '../../components/common/CustomDropdown'
import RichTextEditor from '../../components/common/RichTextEditor'
import { Bell, Send, Users, Calendar, MessageSquare, Info } from 'lucide-react'
import { format } from 'date-fns'

const Notifications = () => {
  const { toast } = useToast()
  const [events, setEvents] = useState([])
  const [customers, setCustomers] = useState([])
  const [allCustomers, setAllCustomers] = useState([])
  const [sentNotifications, setSentNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // Form state
  const [selectedEventId, setSelectedEventId] = useState('all')
  const [selectedCustomerId, setSelectedCustomerId] = useState('all')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedEventId !== 'all' && selectedEventId !== 'general') {
      fetchEventCustomers(selectedEventId)
    } else {
      setCustomers([])
      setSelectedCustomerId('all')
    }
  }, [selectedEventId])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      const [eventsRes, sentRes, allCustRes] = await Promise.all([
        api.get('/organizer/events?limit=100'),
        api.get('/notifications/sent'),
        api.get('/notifications/customers')
      ])

      if (eventsRes.data.status === 200) {
        setEvents(eventsRes.data.result.events || [])
      }

      if (sentRes.data.status === 200) {
        setSentNotifications(sentRes.data.result.notifications || [])
      }

      if (allCustRes.data.status === 200) {
        setAllCustomers(allCustRes.data.result.customers || [])
      }
    } catch (error) {
      console.error('Error fetching initial data:', error)
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const fetchEventCustomers = async (eventId) => {
    try {
      const response = await api.get(`/organizer/events/${eventId}/bookings?limit=500`)
      if (response.data.status === 200) {
        const bookings = response.data.result.bookings || []
        // Extract unique users
        const uniqueUsers = []
        const userIds = new Set()

        bookings.forEach(booking => {
          if (booking.userId && !userIds.has(booking.userId._id)) {
            userIds.add(booking.userId._id)
            uniqueUsers.push(booking.userId)
          }
        })

        setCustomers(uniqueUsers)
      }
    } catch (error) {
      console.error('Error fetching event customers:', error)
      toast.error('Failed to fetch customers')
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()

    if (!title.trim() || !message.trim()) {
      toast.error('Please fill in title and message')
      return
    }

    if (selectedEventId === 'all') {
      toast.error('Please select an event or General category')
      return
    }

    try {
      setSending(true)
      let response

      if (selectedEventId === 'general') {
        // Broadcast to all organizer's customers
        response = await api.post('/notifications/send-to-all', {
          title,
          message
        })
      } else if (selectedCustomerId === 'all') {
        if (customers.length === 0) {
          // Fallback: Broadcast to all my customers because event has no bookings
          response = await api.post('/notifications/send-to-all', {
            title,
            message,
            metadata: { eventId: selectedEventId }
          })
        } else {
          // Normal: Send to all customers of the event
          response = await api.post('/notifications/send-to-event', {
            eventId: selectedEventId,
            title,
            message
          })
        }
      } else {
        // Specific customer selected (from event list or fallback list)
        response = await api.post('/notifications/send-to-user', {
          userId: selectedCustomerId,
          title,
          message,
          metadata: { eventId: selectedEventId }
        })
      }

      toast.success(response.data.message || 'Notification sent successfully')

      // Reset form
      setTitle('')
      setMessage('')

      // Refresh sent notifications
      const sentRes = await api.get('/notifications/sent')
      if (sentRes.data.status === 200) {
        setSentNotifications(sentRes.data.result.notifications || [])
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error(error.response?.data?.message || 'Failed to send notification')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <Loading size="lg" text="Loading notifications..." />
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">Send real-time updates and promotional messages to your customers and track their engagement</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Notification Form */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-fit">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <Send className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900">Send New Notification</h2>
          </div>

          <form onSubmit={handleSend} className="p-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                Select Event
              </label>
              <CustomDropdown
                value={selectedEventId}
                onChange={setSelectedEventId}
                options={[
                  { value: 'all', label: 'Choose Category...' },
                  { value: 'general', label: 'General Message (Broadcast)' },
                  ...events.map(event => ({ value: event._id, label: event.title }))
                ]}
                placeholder="Choose Event or General"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                Target Customer
              </label>
              <CustomDropdown
                value={selectedCustomerId}
                onChange={setSelectedCustomerId}
                options={
                  selectedEventId === 'general'
                    ? [{ value: 'all', label: 'All My Customers' }]
                    : (customers.length > 0
                      ? [
                        { value: 'all', label: 'All Event Customers' },
                        ...customers.map(cust => ({
                          value: cust._id,
                          label: cust.name || cust.mobile || 'Unknown'
                        }))
                      ]
                      : [
                        { value: 'all', label: 'All My Customers (Fallback)' },
                        ...allCustomers.map(cust => ({
                          value: cust._id,
                          label: cust.name || cust.mobile || 'Unknown'
                        }))
                      ]
                    )
                }
                disabled={selectedEventId === 'all'}
                placeholder={
                  selectedEventId === 'all'
                    ? "Select category first"
                    : selectedEventId === 'general'
                      ? "All My Customers"
                      : (customers.length > 0 ? "All Event Customers" : "All My Customers (Fallback)")
                }
                className="w-full"
              />
              {selectedEventId !== 'all' && selectedEventId !== 'general' && customers.length === 0 && (
                <p className="mt-1 text-xs text-amber-600 animate-pulse">
                  No customers found for this event. Showing all your customers instead.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notification Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Event Starting Soon!"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Message Content</label>
              <RichTextEditor
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message here..."
                rows={4}
              />
            </div>

            <button
              type="submit"
              disabled={sending || selectedEventId === 'all'}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all transform active:scale-95 shadow-lg ${sending || selectedEventId === 'all'
                  ? 'bg-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-primary-600/20 hover:shadow-primary-600/30'
                }`}
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Notification
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sent Notifications History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                <h2 className="font-semibold text-gray-900">Recent Notifications Sent</h2>
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                Total: {sentNotifications.length}
              </span>
            </div>

            {sentNotifications.length === 0 ? (
              <div className="flex-1">
                <EmptyState
                  icon={Bell}
                  title="No notifications sent"
                  message="Sent notifications will appear here once you start messaging your customers"
                />
              </div>
            ) : (
              <div className="divide-y divide-gray-100 overflow-y-auto max-h-[600px]">
                {sentNotifications.map((notif) => (
                  <div key={notif._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${notif.type === 'event'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                            }`}>
                            {notif.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{notif.message}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(notif.createdAt), 'MMM d, yyyy • hh:mm a')}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Info className="w-3.5 h-3.5" />
                            Target: {notif.type === 'broadcast' ? 'All Customers' : (notif.eventId?.title || 'General Message')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications
