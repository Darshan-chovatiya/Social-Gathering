import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { 
  Clock, 
  Search, 
  CheckCircle, 
  XCircle,
  Eye,
  MapPin,
  Calendar,
  Users
} from 'lucide-react'
import { format } from 'date-fns'

const PendingEvents = () => {
  const { toast } = useToast()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(null)

  useEffect(() => {
    fetchPendingEvents()
  }, [page])

  const fetchPendingEvents = async () => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 10,
      }

      const response = await api.get('/admin/events/pending', { params })
      if (response.data.status === 200) {
        let filteredEvents = response.data.result.events || []
        
        if (searchTerm) {
          filteredEvents = filteredEvents.filter(event =>
            event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.organizer?.organizerId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }
        
        setEvents(filteredEvents)
        setPagination(response.data.result.pagination || { total: 0, pages: 1 })
      }
    } catch (error) {
      console.error('Error fetching pending events:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch pending events')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (eventId) => {
    try {
      setProcessing(eventId)
      const response = await api.put(`/admin/events/${eventId}/approve`)
      
      if (response.data.status === 200) {
        toast.success('Event approved successfully')
        fetchPendingEvents()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve event')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    const rejectEvent = async () => {
      try {
        setProcessing(selectedEvent._id)
        const response = await api.put(`/admin/events/${selectedEvent._id}/reject`, {
          reason: rejectReason,
        })
        
        if (response.data.status === 200) {
          toast.success('Event rejected successfully')
          setShowRejectModal(false)
          setRejectReason('')
          setSelectedEvent(null)
          fetchPendingEvents()
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to reject event')
      } finally {
        setProcessing(null)
      }
    }

    rejectEvent()
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">Pending Events</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base font-medium">Review and approve pending events</p>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search pending events..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              fetchPendingEvents()
            }}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <Loading />
      ) : events.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No pending events"
          message="All events have been reviewed. Great job!"
        />
      ) : (
        <>
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event._id} className="card">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h3>
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Pending Review
                        </span>
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      {event.venue && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{typeof event.venue === 'string' ? event.venue : event.venue.name}</span>
                        </div>
                      )}
                      {event.startDate && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(event.startDate), 'MMM dd, yyyy h:mm a')}</span>
                        </div>
                      )}
                      {event.organizer?.organizerId && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{event.organizer.organizerId.name} ({event.organizer.organizerId.email})</span>
                        </div>
                      )}
                      {event.createdAt && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>Submitted on {format(new Date(event.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:min-w-[200px]">
                    <button
                      onClick={() => {
                        setSelectedEvent(event)
                        setShowDetailsModal(true)
                      }}
                      className="btn-secondary flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleApprove(event._id)}
                      disabled={processing === event._id}
                      className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processing === event._id ? (
                        'Processing...'
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedEvent(event)
                        setShowRejectModal(true)
                      }}
                      disabled={processing === event._id}
                      className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, pagination.total)} of {pagination.total} events
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {/* Page Numbers */}
                {(() => {
                  const pages = []
                  const totalPages = pagination.pages
                  const currentPage = page
                  
                  // Show first page
                  if (totalPages > 0) {
                    pages.push(1)
                  }
                  
                  // Calculate range around current page
                  let startPage = Math.max(2, currentPage - 1)
                  let endPage = Math.min(totalPages - 1, currentPage + 1)
                  
                  // Adjust if near start or end
                  if (currentPage <= 3) {
                    endPage = Math.min(5, totalPages - 1)
                  }
                  if (currentPage >= totalPages - 2) {
                    startPage = Math.max(2, totalPages - 4)
                  }
                  
                  // Add ellipsis after first page if needed
                  if (startPage > 2) {
                    pages.push('...')
                  }
                  
                  // Add pages in range
                  for (let i = startPage; i <= endPage; i++) {
                    if (i > 1 && i < totalPages) {
                      pages.push(i)
                    }
                  }
                  
                  // Add ellipsis before last page if needed
                  if (endPage < totalPages - 1) {
                    pages.push('...')
                  }
                  
                  // Show last page if more than 1 page
                  if (totalPages > 1) {
                    pages.push(totalPages)
                  }
                  
                  return pages.map((pageNum, idx) => {
                    if (pageNum === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 py-2 text-gray-500">
                          ...
                        </span>
                      )
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          page === pageNum
                            ? 'bg-primary-500 text-gray-900 border border-primary-600'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })
                })()}
                
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Event Details Modal */}
      {showDetailsModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-200/60 animate-scale-in">
            {/* Sticky Header */}
            <div className="flex-shrink-0 flex items-start justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">{selectedEvent.title}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                <p className="text-gray-900">{selectedEvent.description || 'No description'}</p>
              </div>

              {selectedEvent.venue && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Venue</h3>
                  <p className="text-gray-900">{typeof selectedEvent.venue === 'string' ? selectedEvent.venue : selectedEvent.venue.name}</p>
                </div>
              )}

              {selectedEvent.startDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Start Date</h3>
                  <p className="text-gray-900">{format(new Date(selectedEvent.startDate), 'PPpp')}</p>
                </div>
              )}

              {selectedEvent.endDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">End Date</h3>
                  <p className="text-gray-900">{format(new Date(selectedEvent.endDate), 'PPpp')}</p>
                </div>
              )}

              {selectedEvent.organizer?.organizerId && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Organizer</h3>
                  <p className="text-gray-900">{selectedEvent.organizer.organizerId.name}</p>
                  <p className="text-sm text-gray-600">{selectedEvent.organizer.organizerId.email}</p>
                  {selectedEvent.organizer.organizerId.mobile && (
                    <p className="text-sm text-gray-600">{selectedEvent.organizer.organizerId.mobile}</p>
                  )}
                </div>
              )}

              {selectedEvent.categories && selectedEvent.categories.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.categories.map((cat, idx) => (
                      <span key={idx} className="px-2 py-1 bg-primary-100 text-primary-800 rounded text-sm">
                        {cat.name || cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 bg-white sticky bottom-0 z-10 rounded-b-2xl">
              <div className="flex items-center justify-end p-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm font-medium focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      <ConfirmDialog
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false)
          setRejectReason('')
        }}
        onConfirm={handleReject}
        title="Reject Event"
        message={
          <div className="space-y-3">
            <p>Please provide a reason for rejecting this event:</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="input-field min-h-[100px]"
              rows={4}
            />
          </div>
        }
        confirmText="Reject Event"
        variant="danger"
      />
    </div>
  )
}

export default PendingEvents
