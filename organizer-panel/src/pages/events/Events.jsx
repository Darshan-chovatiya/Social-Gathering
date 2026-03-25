import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import EmptyState from '../../components/common/EmptyState'
import ViewEventModal from '../../components/events/ViewEventModal'
import AddPhysicalTicketsModal from '../../components/events/AddPhysicalTicketsModal'
import CustomDropdown from '../../components/common/CustomDropdown'
import Pagination from '../../components/common/Pagination'
import { Calendar, Search, Plus, Edit, Trash2, Eye, CheckCircle, Clock, XCircle, Ticket } from 'lucide-react'
import { format } from 'date-fns'

const Events = () => {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [allEvents, setAllEvents] = useState([]) // Store all fetched events
  const [events, setEvents] = useState([]) // Filtered events for display
  const [paginatedEvents, setPaginatedEvents] = useState([]) // Paginated events for display
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('upcoming') // 'upcoming' or 'past'
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [physicalTicketsModalOpen, setPhysicalTicketsModalOpen] = useState(false)
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [imageErrors, setImageErrors] = useState({}) // Track image load errors

  useEffect(() => {
    fetchEvents()
  }, [statusFilter])

  // Filter events when searchTerm or timeFilter changes
  useEffect(() => {
    filterEvents()
  }, [searchTerm, allEvents, statusFilter, timeFilter])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = { limit: 100 }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }

      const response = await api.get('/organizer/events', { params })
      if (response.data.status === 200) {
        const fetchedEvents = response.data.result.events || []
        setAllEvents(fetchedEvents)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch events')
    } finally {
      setLoading(false)
    }
  }

  const isEventUpcoming = (event) => {
    if (!event.slots || event.slots.length === 0) return false

    const now = new Date()

    // Get the latest slot date for the event
    const latestSlotDate = event.slots
      .map((slot) => {
        if (typeof slot.date === "string") {
          return new Date(slot.date)
        }
        return slot.date ? new Date(slot.date) : null
      })
      .filter((date) => date && !isNaN(date.getTime()))
      .sort((a, b) => b - a)[0]

    if (!latestSlotDate) return false

    // Combine date with end time if available
    const latestSlot = event.slots.find((slot) => {
      const slotDate =
        typeof slot.date === "string"
          ? new Date(slot.date)
          : slot.date
            ? new Date(slot.date)
            : null
      return slotDate && slotDate.getTime() === latestSlotDate.getTime()
    })

    let eventEndDateTime = new Date(latestSlotDate)
    if (latestSlot?.endTime) {
      const [hours, minutes] = latestSlot.endTime.split(":")
      eventEndDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }

    return eventEndDateTime >= now
  }

  const filterEvents = () => {
    let filtered = [...allEvents]

    // Filter by time (upcoming/past)
    filtered = filtered.filter((event) => {
      const isUpcoming = isEventUpcoming(event)
      return timeFilter === "upcoming" ? isUpcoming : !isUpcoming
    })

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.address?.state?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setEvents(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Paginate events
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedEvents(events.slice(startIndex, endIndex))
  }, [events, currentPage, itemsPerPage])

  // Convert string to title case
  const toTitleCase = (str) => {
    if (!str) return 'N/A'
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const getStatusBadge = (status) => {
    const badges = {
      approved: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800', label: 'Approved' },
      pending: { icon: Clock, color: 'bg-amber-100 text-amber-800', label: 'Pending' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejected' },
    }
    const badge = badges[status] || badges.pending
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    )
  }

  const getEarliestSlotDate = (slots) => {
    if (!slots || slots.length === 0) return null

    const dates = slots
      .map(slot => new Date(slot.date))
      .filter(date => !isNaN(date.getTime()))

    if (dates.length === 0) return null

    return new Date(Math.min(...dates))
  }

  const handleViewEvent = (eventId) => {
    setSelectedEventId(eventId)
    setViewModalOpen(true)
  }

  const handleEditEvent = (eventId) => {
    const event = allEvents.find(e => e._id === eventId)
    if (event && !isEventUpcoming(event)) {
      toast.error('Cannot edit past events')
      return
    }
    navigate(`/events/edit/${eventId}`)
  }

  const handleCreateEvent = () => {
    navigate('/events/create')
  }

  const handleModalSuccess = () => {
    fetchEvents() // Refresh events list
  }

  const handleAddPhysicalTickets = (eventId) => {
    setSelectedEventId(eventId)
    setPhysicalTicketsModalOpen(true)
  }

  if (loading) {
    return <Loading size="lg" text="Loading events..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Events</h1>
          <p className="text-sm text-gray-500 mt-1">Create, manage, and track your events and ticket sales performance</p>
        </div>
        <button
          onClick={handleCreateEvent}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
        >
          <Plus className="w-5 h-5" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTimeFilter('upcoming')}
          className={`px-6 py-3 font-semibold text-sm transition-all duration-200 border-b-2 ${timeFilter === 'upcoming'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
        >
          Upcoming Events
        </button>
        <button
          onClick={() => setTimeFilter('past')}
          className={`px-6 py-3 font-semibold text-sm transition-all duration-200 border-b-2 ${timeFilter === 'past'
              ? 'border-primary-600 text-primary-600 bg-primary-50/50'
              : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            }`}
        >
          Past Events
        </button>
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
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="w-full sm:w-auto min-w-[140px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <CustomDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'approved', label: 'Approved' },
                { value: 'pending', label: 'Pending' },
                { value: 'rejected', label: 'Rejected' },
              ]}
              placeholder="All Status"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Events Table */}
      {events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={`No ${timeFilter === 'upcoming' ? 'upcoming' : 'past'} events found`}
          message={
            searchTerm || statusFilter !== 'all'
              ? 'No events match your search or filter criteria.'
              : timeFilter === 'upcoming'
                ? 'There are no upcoming events at the moment.'
                : 'There are no past events.'
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedEvents.map((event) => (
                  <tr key={event._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {imageErrors[event._id] || (!event.eventDetailImage && (!event.banners || event.banners.length === 0)) ? (
                        <div className="w-12 h-16 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-6 h-6 text-primary-600" />
                        </div>
                      ) : event.eventDetailImage ? (
                        <img
                          src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${event.eventDetailImage}`}
                          alt={event.title}
                          className="w-12 h-16 rounded-lg object-cover flex-shrink-0"
                          onError={() => setImageErrors(prev => ({ ...prev, [event._id]: true }))}
                        />
                      ) : event.banners && event.banners.length > 0 ? (
                        <img
                          src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${event.banners[0]}`}
                          alt={event.title}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                          onError={() => setImageErrors(prev => ({ ...prev, [event._id]: true }))}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-6 h-6 text-primary-600" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div
                          className="text-sm font-medium text-gray-900 cursor-help"
                          title={event.title || 'N/A'}
                        >
                          {event.title
                            ? (event.title.length > 30
                              ? `${toTitleCase(event.title.substring(0, 30))}...`
                              : toTitleCase(event.title))
                            : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{toTitleCase(event.address?.city || 'N/A')}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {(() => {
                          const earliestDate = getEarliestSlotDate(event.slots)
                          return earliestDate ? format(earliestDate, 'MMM d, yyyy') : 'N/A'
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(event.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewEvent(event._id)}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditEvent(event._id)}
                          disabled={!isEventUpcoming(event)}
                          className={`p-2 rounded-lg transition-colors ${isEventUpcoming(event)
                              ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                              : 'text-gray-300 cursor-not-allowed opacity-50'
                            }`}
                          title={isEventUpcoming(event) ? 'Edit' : 'Cannot edit past events'}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAddPhysicalTickets(event._id)}
                          disabled={!isEventUpcoming(event)}
                          className={`p-2 rounded-lg transition-colors ${isEventUpcoming(event)
                              ? 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                              : 'text-gray-300 cursor-not-allowed opacity-50'
                            }`}
                          title={isEventUpcoming(event) ? 'Add Physical Tickets' : 'Cannot add physical tickets to past events'}
                        >
                          <Ticket className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <ViewEventModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false)
          setSelectedEventId(null)
        }}
        eventId={selectedEventId}
      />

      <AddPhysicalTicketsModal
        isOpen={physicalTicketsModalOpen}
        onClose={() => {
          setPhysicalTicketsModalOpen(false)
          setSelectedEventId(null)
        }}
        eventId={selectedEventId}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}

export default Events

