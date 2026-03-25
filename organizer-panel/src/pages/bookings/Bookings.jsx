import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import EmptyState from '../../components/common/EmptyState'
import CustomDropdown from '../../components/common/CustomDropdown'
import Pagination from '../../components/common/Pagination'
import { Users, Search, Calendar, DollarSign, CheckCircle, Clock, Copy, Check } from 'lucide-react'
import { format } from 'date-fns'

const Bookings = () => {
  const { toast } = useToast()
  const [allBookings, setAllBookings] = useState([]) // Store all bookings from API
  const [bookings, setBookings] = useState([]) // Filtered bookings for display
  const [paginatedBookings, setPaginatedBookings] = useState([]) // Paginated bookings for display
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [selectedEventId])

  // Filter bookings when searchTerm or selectedEventId changes
  useEffect(() => {
    let filtered = allBookings

    // Filter by event if not "all"
    if (selectedEventId !== 'all') {
      filtered = filtered.filter(booking =>
        booking.eventId?._id === selectedEventId || booking.eventId === selectedEventId
      )
    }

    // Filter by search term
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(booking =>
        booking.bookingId?.toLowerCase().includes(lowerCaseSearchTerm) ||
        booking.userId?.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
        booking.userId?.email?.toLowerCase().includes(lowerCaseSearchTerm) ||
        booking.eventId?.title?.toLowerCase().includes(lowerCaseSearchTerm)
      )
    }

    setBookings(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [allBookings, selectedEventId, searchTerm])

  // Paginate bookings
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedBookings(bookings.slice(startIndex, endIndex))
  }, [bookings, currentPage, itemsPerPage])

  // Helper function to check if an event is past
  const isEventPast = (event) => {
    if (!event.slots || event.slots.length === 0) return true

    const now = new Date()

    // Check if all active slots are in the past
    const activeSlots = event.slots.filter(slot => slot.isActive !== false)
    if (activeSlots.length === 0) return true

    // An event is past if all active slots have dates in the past
    // We check the slot date + end time to see if it's completely over
    return activeSlots.every(slot => {
      if (!slot.date) return true
      const slotDate = new Date(slot.date)

      // If slot has end time, combine date and end time
      if (slot.endTime) {
        const [hours, minutes] = slot.endTime.split(':').map(Number)
        slotDate.setHours(hours, minutes, 0, 0)
      } else {
        // If no end time, consider the slot ends at end of day
        slotDate.setHours(23, 59, 59, 999)
      }

      return slotDate < now
    })
  }

  const fetchEvents = async () => {
    try {
      const response = await api.get('/organizer/events?limit=100')
      if (response.data.status === 200) {
        // Filter out past events
        const allEvents = response.data.result.events || []
        const upcomingEvents = allEvents.filter(event => !isEventPast(event))
        setEvents(upcomingEvents)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to fetch events')
    }
  }

  // Convert string to title case
  const toTitleCase = (str) => {
    if (!str) return 'N/A'
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
  }

  // Copy booking ID to clipboard
  const copyBookingId = async (bookingId) => {
    try {
      await navigator.clipboard.writeText(bookingId)
      setCopiedId(bookingId)
      toast.success('Booking ID copied to clipboard!')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      toast.error('Failed to copy booking ID')
    }
  }

  const fetchBookings = async () => {
    try {
      setLoading(true)
      let response

      if (selectedEventId === 'all') {
        // Fetch all bookings for all organizer's events
        response = await api.get('/organizer/bookings?limit=100')
      } else {
        // Fetch bookings for specific event
        response = await api.get(`/organizer/events/${selectedEventId}/bookings?limit=100`)
      }

      if (response.data.status === 200) {
        setAllBookings(response.data.result.bookings || [])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch bookings')
      setAllBookings([])
    } finally {
      setLoading(false)
    }
  }


  if (loading && bookings.length === 0) {
    return <Loading size="lg" text="Loading bookings..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Event Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage bookings for your events and track ticket sales performance</p>
      </div>

      {/* Filters */}
      <div className="rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Booking ID, Customer, or Event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="w-full sm:w-auto min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Event</label>
            <CustomDropdown
              value={selectedEventId}
              onChange={setSelectedEventId}
              options={[
                { value: 'all', label: 'All Events' },
                ...events.map((event) => ({
                  value: event._id,
                  label: event.title,
                })),
              ]}
              placeholder="All Events"
              className="w-full"
              truncateLength={20}
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      {bookings.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No bookings found"
          message="No bookings have been made for this event yet"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>

                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div
                          className="text-sm font-medium text-gray-900 cursor-help"
                          title={booking.eventId?.title || 'N/A'}
                        >
                          {booking.eventId?.title
                            ? (booking.eventId.title.length > 30
                              ? `${toTitleCase(booking.eventId.title.substring(0, 30))}...`
                              : toTitleCase(booking.eventId.title))
                            : 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs font-mono text-gray-500">
                            {booking.bookingId}
                          </span>
                          <button
                            onClick={() => copyBookingId(booking.bookingId)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors group"
                            title="Copy Booking ID"
                          >
                            {copiedId === booking.bookingId ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400 group-hover:text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{toTitleCase(booking.userId?.name || 'N/A')}</div>
                        <div className="text-xs text-gray-500 mt-1">{booking.userId?.email || booking.userId?.mobile || ''}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {format(new Date(booking.createdAt), 'MMM d, yyyy HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                        {/* <DollarSign className="w-4 h-4" /> */}
                        ₹{booking.totalAmount?.toLocaleString() || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${booking.status === 'confirmed' && booking.paymentStatus === 'success'
                        ? 'bg-emerald-100 text-emerald-800'
                        : booking.paymentStatus === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                        {booking.status === 'confirmed' && booking.paymentStatus === 'success' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {booking.status === 'confirmed' && booking.paymentStatus === 'success' ? 'Confirmed' : toTitleCase(booking.paymentStatus || 'N/A')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(bookings.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={bookings.length}
          />
        </div>
      )}
    </div>
  )
}

export default Bookings

