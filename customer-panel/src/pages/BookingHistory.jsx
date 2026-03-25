import { useState, useEffect } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { Calendar, MapPin, Clock, Ticket, ArrowRight, Loader2, Link2, CreditCard, X, CheckCircle, AlertCircle, Copy, Download, Eye, Home, ChevronRight, CalendarIcon } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import api from '../utils/api'
import Loading from '../components/common/Loading'
import EmptyState from '../components/common/EmptyState'

const BookingHistory = () => {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [paymentDetails, setPaymentDetails] = useState(null)
  const [loadingPayment, setLoadingPayment] = useState(false)
  const [paymentDetailsError, setPaymentDetailsError] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [imageErrors, setImageErrors] = useState(new Set())
  const [showTicketPreviewModal, setShowTicketPreviewModal] = useState(false)
  const [previewBooking, setPreviewBooking] = useState(null)
  const [previewEvent, setPreviewEvent] = useState(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/users/bookings?limit=50')
      
      if (response.data.status === 200) {
        setBookings(response.data.result.bookings || [])
      } else {
        setError(response.data.message || 'Failed to fetch bookings')
      }
    } catch (err) {
      console.error('Error fetching bookings:', err)
      setError(err.response?.data?.message || 'Failed to load booking history')
    } finally {
      setLoading(false)
    }
  }

  const getImageUrl = (path) => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
    const baseUrl = API_BASE_URL.replace('/api', '')
    return `${baseUrl}${path}`
  }

  const getFarmhouseImage = (fh) => {
    if (fh?.banners && fh.banners.length > 0) {
      return getImageUrl(fh.banners[0])
    }
    return null
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (time) => {
    if (!time) return 'N/A'
    if (time.includes(':')) {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      if (hour === 0) return `12:${minutes} AM`
      if (hour < 12) return `${hour}:${minutes} AM`
      if (hour === 12) return `12:${minutes} PM`
      return `${hour - 12}:${minutes} PM`
    }
    return time
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getEventImage = (event) => {
    if (!event) return ''
    if (event?.eventDetailImage) {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const baseUrl = API_BASE_URL.replace('/api', '')
      return event.eventDetailImage.startsWith('http') ? event.eventDetailImage : `${baseUrl}${event.eventDetailImage}`
    }
    if (event?.banners && event.banners.length > 0) {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const baseUrl = API_BASE_URL.replace('/api', '')
      return event.banners[0].startsWith('http') ? event.banners[0] : `${baseUrl}${event.banners[0]}`
    }
    return null
  }

  const cleanTicketType = (ticketType) => {
    if (!ticketType) return ''
    return ticketType.replace(/\s*Category\s*/gi, '').trim()
  }

  const fetchPaymentDetails = async (booking) => {
    try {
      setLoadingPayment(true)
      setSelectedBooking(booking)
      setShowPaymentModal(true)
      const bookingId = booking.bookingId || booking._id
      const response = await api.get(`/users/payments/booking/${bookingId}`)
      if (response.data.status === 200) setPaymentDetails(response.data.result.payment)
    } catch (e) {
      setPaymentDetailsError('Failed to load payment details')
    } finally {
      setLoadingPayment(false)
    }
  }

  const getPaymentMethodLabel = (method) => {
    if (!method) return 'N/A'
    const methodMap = {
      'razorpay': 'Razorpay',
      'card': 'Credit/Debit Card',
      'netbanking': 'Net Banking',
      'wallet': 'Wallet',
      'upi': 'UPI',
      'cash': 'Cash',
      'other': 'Other'
    }
    return methodMap[method.toLowerCase()] || method
  }

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'successful':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'failed':
      case 'failure':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const formatDateTime = (date) => {
    if (!date) return 'N/A'
    const dateObj = new Date(date)
    return dateObj.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatTimeForTicket = (time) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    if (hour === 0) return `12:${minutes} AM`
    if (hour < 12) return `${hour}:${minutes} AM`
    if (hour === 12) return `12:${minutes} PM`
    return `${hour - 12}:${minutes} PM`
  }

  const formatShortDate = (date) => {
    if (!date) return 'N/A'
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return 'N/A'
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]}`
  }

  const handleShowTicketPreview = (booking) => {
    setPreviewBooking(booking)
    setPreviewEvent(booking.eventId)
    setShowTicketPreviewModal(true)
  }

  const handleDownloadTicket = async (bookingData, eventData) => {
    if (!bookingData) return

    let iframe = null
    try {
      const processedTickets = bookingData.tickets?.map(t => ({
        ...t,
        cleanTitle: cleanTicketType(t.ticketTypeTitle || '')
      })) || []
      
      const eventImage = getEventImage(eventData)
      const venue = eventData?.venues?.[0]?.fullAddress || eventData?.address?.fullAddress || eventData?.address?.city || 'TBA'
      const totalTickets = processedTickets.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0)
      
      const slotDate = bookingData.slotDate || bookingData.selectedDate
      const slotTime = bookingData.slotStartTime || bookingData.selectedTime
      
      iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.left = '-9999px'
      iframe.style.top = '0'
      iframe.style.width = '400px'
      iframe.style.height = '600px'
      iframe.style.border = 'none'
      iframe.style.backgroundColor = '#ffffff'
      document.body.appendChild(iframe)
      
      await new Promise((resolve) => {
        iframe.onload = resolve
        iframe.src = 'about:blank'
      })
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; background-color: rgb(243, 244, 246); padding: 32px 24px; }
            </style>
          </head>
          <body>
            <div style="max-width: 384px; margin: 0 auto;">
              <div style="background-color: rgb(255, 255, 255); border-radius: 8px; border: 1px solid rgb(229, 231, 235); box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1); overflow: hidden; position: relative;">
                <!-- Upper Section - Event Details -->
                <div style="padding: 16px; position: relative;">
                  <div style="display: flex; gap: 12px; position: relative;">
                    <!-- Event Image -->
                    <div style="flex-shrink: 0;">
                      ${eventImage ? `
                        <img src="${eventImage}" style="width: 64px; height: 96px; object-fit: cover; border-radius: 4px; background-color: rgb(243, 244, 246);" />
                      ` : `
                        <div style="width: 64px; height: 96px; background: linear-gradient(135deg, rgb(239, 246, 255) 0%, rgb(219, 234, 254) 100%); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: rgb(99, 102, 241); font-size: 24px;">🎫</div>
                      `}
                    </div>
                    
                    <!-- Event Info -->
                    <div style="flex: 1; min-width: 0;">
                      <h2 style="font-size: 16px; font-weight: bold; color: rgb(17, 24, 39); margin-bottom: 4px; line-height: 1.3;">
                        ${eventData?.title || 'Event Ticket'}${eventData?.category ? `<span style="font-size: 14px; font-weight: normal; color: rgb(107, 114, 128);"> (${eventData.category})</span>` : ''}
                      </h2>
                      <p style="font-size: 12px; color: rgb(107, 114, 128); margin-bottom: 4px;">
                        ${formatShortDate(slotDate)} | ${formatTimeForTicket(slotTime)}
                      </p>
                      <p style="font-size: 12px; color: rgb(107, 114, 128);">
                        ${venue}
                      </p>
                    </div>
                  </div>
                </div>
                
                <!-- Lower Section - QR Code and Details -->
                <div style="padding: 16px; padding-top: 24px;">
                  <div style="display: flex; gap: 16px;">
                    <!-- QR Code -->
                    ${bookingData?.qrCode ? `
                      <div style="flex-shrink: 0;">
                        <div style="background-color: rgb(255, 255, 255); padding: 8px; border-radius: 4px;">
                          <img src="${bookingData.qrCode}" style="width: 128px; height: 128px; object-fit: contain;" />
                        </div>
                      </div>
                    ` : ''}
                    
                    <!-- Ticket Details -->
                    <div style="flex: 1; min-width: 0;">
                      <p style="font-size: 14px; font-weight: 600; color: rgb(17, 24, 39); margin-bottom: 4px;">
                        ${totalTickets} Ticket${totalTickets > 1 ? 's' : ''}
                      </p>
                      
                      ${processedTickets.map(t => `
                        <p style="font-size: 12px; color: rgb(107, 114, 128); margin-bottom: 4px;">
                          ${t.cleanTitle || 'Ticket'} - ${t.quantity}x
                        </p>
                      `).join('')}
                      
                      <p style="font-size: 12px; color: rgb(107, 114, 128); margin-top: 8px;">
                        BOOKING ID: <span style="font-family: monospace; font-weight: 600; color: rgb(17, 24, 39);">${bookingData?.bookingId || 'N/A'}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div style="text-align: center; margin-top: 16px;">
                    <p style="font-size: 12px; color: rgb(107, 114, 128); background-color: rgb(249, 250, 251); padding: 8px 12px; border-radius: 4px;">
                      This is your official ticket. Please bring this ticket to the venue.
                    </p>
                  </div>
                </div>
                
                <div style="padding: 12px 16px; background-color: rgb(249, 250, 251); border-top: 1px solid rgb(229, 231, 235); display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; font-weight: 600; color: rgb(17, 24, 39); text-transform: uppercase;">Total Amount</span>
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <span style="font-size: 16px; font-weight: bold; color: rgb(17, 24, 39);">
                      ₹${bookingData?.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </span>
                    <svg style="width: 16px; height: 16px; color: rgb(107, 114, 128);" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `)
      iframeDoc.close()
      await new Promise((resolve) => setTimeout(resolve, 800))
      const iframeBody = iframeDoc.body
      const canvas = await html2canvas(iframeBody, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', windowWidth: 400, windowHeight: iframeBody.scrollHeight })
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const pdf = new jsPDF('p', 'mm', 'a4')
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`Ticket-${bookingData?.bookingId || 'ticket'}.pdf`)
      document.body.removeChild(iframe)
    } catch (error) {
      console.error('Error generating PDF:', error)
      if (iframe && iframe.parentNode) document.body.removeChild(iframe)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <NavLink to="/" className="flex items-center gap-1 text-gray-500 hover:text-primary-600">
            <Home className="w-4 h-4" /> <span>Home</span>
          </NavLink>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 dark:text-white font-medium">Booking History</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Bookings</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and view all your event and farmhouse bookings</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loading size="lg" /></div>
        ) : bookings.length === 0 ? (
          <EmptyState icon={Ticket} title="No Bookings Yet" message="Start exploring to make your first booking!" />
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                {(booking.farmhouseId || booking.farmerhouseId) ? (
                  /* Farmhouse Booking */
                  <div className="flex flex-col">
                    {/* Mobile View */}
                    <div className="md:hidden">
                      <div className="p-4 flex gap-4">
                        <div className="w-20 h-20 shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <img src={getFarmhouseImage(booking.farmhouseId || booking.farmerhouseId)} alt="farmhouse" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase truncate">{(booking.farmhouseId || booking.farmerhouseId)?.title}</h3>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusColor(booking.status)}`}>{booking.status}</span>
                          </div>
                          <p className="text-xs text-secondary-600 font-medium mt-0.5">{(booking.farmhouseId || booking.farmerhouseId)?.ownerName || 'Prime Tickets'}</p>
                          <div className="flex flex-col gap-0.5 mt-1">
                            <div className="flex items-center gap-1 text-[11px] text-gray-500">
                              <MapPin className="w-3 h-3" /> <span>{(booking.farmhouseId || booking.farmerhouseId)?.address?.city}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-gray-500">
                              <Calendar className="w-3 h-3" /> <span>{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-sm font-bold text-primary-600">₹{((booking.totalAmount || 0) + (booking.depositAmount || 0))?.toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Regular Stay</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex gap-2">
                          <button onClick={() => fetchPaymentDetails(booking)} className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xs hover:bg-primary-50 transition-colors">
                            <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                          <NavLink to={`/farmhouses/bookings/${booking.bookingId || booking._id}/confirmation`} className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xs hover:bg-primary-50 transition-colors">
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                          </NavLink>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium">Booking ID: <span className="font-mono uppercase">{booking.bookingId || booking._id}</span></p>
                      </div>
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:flex items-center p-6 gap-6">
                      <div className="w-32 h-32 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                        <img src={getFarmhouseImage(booking.farmhouseId || booking.farmerhouseId)} alt="farmhouse" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase truncate">{(booking.farmhouseId || booking.farmerhouseId)?.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{(booking.farmhouseId || booking.farmerhouseId)?.ownerName || 'Prime Tickets'}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" /> <span>{(booking.farmhouseId || booking.farmerhouseId)?.address?.city}</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(booking.status)}`}>{booking.status}</span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 space-y-1">
                          <p>Stay Dates: <span className="text-gray-900 dark:text-gray-200 font-medium">{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</span></p>
                          <p>Booking ID: <span className="text-gray-900 dark:text-gray-200 font-mono uppercase font-medium">{booking.bookingId || booking._id}</span></p>
                          <p>Booking Date: <span className="text-gray-900 dark:text-gray-200 font-medium">{formatDate(booking.createdAt)}</span></p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3 self-stretch justify-between">
                        <div className="text-right">
                          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Amount</p>
                          <p className="text-2xl font-bold text-[#ff4d6d]">₹{((booking.totalAmount || 0) + (booking.depositAmount || 0))?.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => fetchPaymentDetails(booking)} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 transition-colors">
                            <CreditCard className="w-4 h-4 text-gray-600" />
                          </button>
                          <NavLink to={`/farmhouses/bookings/${booking.bookingId || booking._id}/confirmation`} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 transition-colors">
                            <Eye className="w-4 h-4 text-gray-600" />
                          </NavLink>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Event Booking */
                  <div className="flex flex-col">
                    {/* Mobile View */}
                    <div className="md:hidden">
                      <div className="p-4 flex gap-4">
                        <div className="w-20 h-28 shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <img src={getEventImage(booking.eventId)} alt="event" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2">{booking.eventId?.title}</h3>
                            <div className="flex gap-1 shrink-0">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getStatusColor(booking.status)}`}>{booking.status}</span>
                              {booking.isAttended && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                  Attended
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-secondary-600 font-medium mt-0.5">{booking.eventId?.organizerName || 'Dr. Vivek Bindra'}</p>
                          <div className="flex items-center flex-wrap gap-3 text-[11px] text-gray-500 mt-1">
                            <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {booking.eventId?.address?.city || 'Surat'}</div>
                            <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(booking.selectedDate)}</div>
                            <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(booking.selectedTime)}</div>
                          </div>
                          <div className="mt-3">
                            <p className="text-base font-bold text-primary-600">₹{booking.totalAmount?.toLocaleString()}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {booking.tickets?.map((t, i) => (
                                <span key={i} className="text-[10px] font-bold text-primary-500 uppercase">
                                  {cleanTicketType(t.ticketTypeTitle)} × {t.quantity}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex gap-2">
                          <button onClick={() => fetchPaymentDetails(booking)} className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xs hover:bg-primary-50 transition-colors">
                            <CreditCard className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                          <NavLink to={`/events/${booking.eventId?._id}`} className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xs hover:bg-primary-50 transition-colors">
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                          </NavLink>
                          <button onClick={() => handleShowTicketPreview(booking)} className="p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xs hover:bg-primary-50 transition-colors">
                            <Download className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium">Booking ID: <span className="font-mono uppercase">{booking.bookingId || booking._id}</span></p>
                      </div>
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:flex items-center p-6 gap-6">
                      <div className="w-36 h-36 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                        <img src={getEventImage(booking.eventId)} alt="event" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">{booking.eventId?.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{booking.eventId?.organizerName || 'Dr. Vivek Bindra'}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" /> <span>{booking.eventId?.address?.city || 'Surat'}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusColor(booking.status)}`}>{booking.status}</span>
                            {booking.isAttended && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                Attended
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {booking.tickets?.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 bg-pink-50 dark:bg-pink-900/20 text-pink-600 text-[10px] font-extrabold rounded uppercase">
                              {cleanTicketType(t.ticketTypeTitle)} × {t.quantity}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 text-[11px] text-gray-500 space-y-0.5">
                          <p>Booking ID: <span className="text-gray-900 dark:text-gray-200 font-mono uppercase font-semibold">{booking.bookingId || booking._id}</span></p>
                          <p>Booking Date: <span className="text-gray-900 dark:text-gray-200 font-semibold">{formatDate(booking.createdAt)}</span></p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3 self-stretch justify-between">
                        <div className="text-right">
                          <p className="text-xs text-gray-400 uppercase font-extrabold tracking-wider">Total Amount</p>
                          <p className="text-2xl font-black text-[#ff4d6d]">₹{booking.totalAmount?.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => fetchPaymentDetails(booking)} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 transition-colors">
                            <CreditCard className="w-4.5 h-4.5 text-gray-400" />
                          </button>
                          <NavLink to={`/events/${booking.eventId?._id}`} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 transition-colors">
                            <Eye className="w-4.5 h-4.5 text-gray-400" />
                          </NavLink>
                          <button onClick={() => handleShowTicketPreview(booking)} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 transition-colors">
                            <Download className="w-4.5 h-4.5 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setShowPaymentModal(false)} 
          />
          
          {/* Modal Container */}
          <div className="relative bg-white dark:bg-gray-800 w-full md:max-w-lg md:rounded-3xl rounded-t-[2.5rem] shadow-2xl overflow-hidden animate-slide-up md:animate-fade-in flex flex-col max-h-[95vh] md:max-h-[90vh]">
            
            {/* Mobile Drag Handle */}
            <div className="md:hidden flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 py-4 md:py-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Payment Details</h2>
                {selectedBooking && (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-[11px] md:text-xs text-gray-500 font-medium uppercase tracking-wider">
                      Booking ID: <span className="text-gray-900 dark:text-gray-300 font-mono">{selectedBooking.bookingId || selectedBooking._id}</span>
                    </p>
                    <p className="text-[11px] md:text-xs text-gray-500 font-medium tracking-wide">
                      Booking Date: <span className="text-gray-900 dark:text-gray-300">{formatDate(selectedBooking.createdAt)}</span>
                    </p>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-700 mx-6" />

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {loadingPayment ? (
                <div className="py-12 flex justify-center items-center flex-col gap-3">
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                  <p className="text-sm text-gray-500 font-medium">Fetching details...</p>
                </div>
              ) : paymentDetails ? (
                <div className="space-y-4">
                  {/* Status and Amount Card */}
                  <div className="p-5 bg-gray-50/80 dark:bg-gray-900/50  border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center ${paymentDetails.paymentStatus === 'success' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                          {paymentDetails.paymentStatus === 'success' ? (
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                          ) : (
                            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Payment Status</p>
                          <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase mt-1 ${getPaymentStatusColor(paymentDetails.paymentStatus)}`}>
                            {paymentDetails.paymentStatus}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Amount Paid</p>
                        <p className="text-xl font-black text-[#ff4d6d] mt-0.5">₹{paymentDetails.amount}</p>
                      </div>
                    </div>
                  </div>

                  {/* Method and Currency Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50/80 dark:bg-gray-900/50  border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1.5">Payment Method</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{getPaymentMethodLabel(paymentDetails.paymentMethod)}</p>
                    </div>
                    <div className="p-4 bg-gray-50/80 dark:bg-gray-900/50  border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1.5">Currency</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{paymentDetails.currency || 'INR'}</p>
                    </div>
                  </div>

                  {/* Date Card */}
                  <div className="p-4 bg-gray-50/80 dark:bg-gray-900/50  border border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1.5">Payment Date</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white uppercase">{formatDateTime(paymentDetails.createdAt)}</p>
                  </div>

                  {/* Farmhouse Price Breakdown */}
                  {(selectedBooking?.farmhouseId || selectedBooking?.farmerhouseId) && (
                    <div className="mt-4 p-5 bg-primary-50/30 dark:bg-primary-900/10 border border-primary-100/50 dark:border-primary-900/20 rounded-2xl">
                       <h4 className="text-[10px] text-primary-600 dark:text-primary-400 uppercase font-black tracking-widest mb-3">Price Breakdown</h4>
                       <div className="space-y-2">
                         <div className="flex justify-between items-center text-xs">
                           <span className="text-gray-500 font-medium">Accommodation Fare</span>
                           <span className="font-bold text-gray-900 dark:text-white">₹{selectedBooking.totalAmount?.toLocaleString()}</span>
                         </div>
                         <div className="flex justify-between items-center text-xs">
                           <span className="text-gray-500 font-medium">Security Deposit (Refundable)</span>
                           <span className="font-bold text-gray-900 dark:text-white">₹{(selectedBooking.depositAmount || 0).toLocaleString()}</span>
                         </div>
                         <div className="pt-2 mt-2 border-t border-primary-100 dark:border-primary-900/30 flex justify-between items-center">
                           <span className="text-xs font-black text-primary-600 uppercase">Total Transaction</span>
                           <span className="text-base font-black text-primary-600">₹{((selectedBooking.totalAmount || 0) + (selectedBooking.depositAmount || 0)).toLocaleString()}</span>
                         </div>
                       </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">No payment information found for this booking.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 md:pb-8">
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-2 bg-[#ff4d6d] hover:bg-[#ff3355] text-white text-base font-bold rounded-xl transition-all shadow-lg shadow-pink-500/20 active:scale-[0.98]"
              >
                Okay, Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {showTicketPreviewModal && previewBooking && previewEvent && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowTicketPreviewModal(false)} />
          
          {/* Modal Container */}
          <div className="relative bg-white dark:bg-gray-900 w-full md:max-w-lg md:rounded-[2rem] rounded-t-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-up md:animate-fade-in max-h-[95vh] md:max-h-[85vh]">
            
            {/* Mobile Drag Handle */}
            <div className="md:hidden flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 py-4 md:py-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ticket Preview</h3>
              <button onClick={() => setShowTicketPreviewModal(false)} className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Ticket Card Area */}
            <div className="p-4 pt-20 md:pt-20 md:p-8 bg-gray-50 dark:bg-gray-950 flex justify-center items-center overflow-y-auto custom-scrollbar">
              <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden relative border border-gray-100 dark:border-gray-800" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
                <div className="p-5">
                  <div className="flex gap-4">
                    <div className="w-20 h-28 shrink-0 rounded-xl overflow-hidden shadow-md">
                      {getEventImage(previewEvent) ? (
                        <img src={getEventImage(previewEvent)} alt="event" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
                          <Ticket className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                        {previewEvent?.title}
                        {previewEvent?.category && <span className="text-sm font-normal text-gray-600 dark:text-gray-400"> ({previewEvent.category})</span>}
                      </h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{previewEvent?.category || 'Event'}</p>
                      <div className="mt-2 space-y-0.5">
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-300">{formatShortDate(previewBooking.selectedDate || previewBooking.slotDate)}, {formatTimeForTicket(previewBooking.selectedTime || previewBooking.slotStartTime)}</p>
                        <p className="text-[10px] text-gray-500 line-clamp-1">
                          {previewEvent?.venues?.[0]?.fullAddress || previewEvent?.address?.fullAddress || previewEvent?.address?.city || 'Surat'}
                        </p>
                      </div>
                    </div>
                    {/* M-Ticket Label - Vertical */}
                    <div className="absolute right-4 top-5">
                      <div className="text-[10px] font-black text-[#ff4d6d] uppercase vertical-text tracking-[0.2em]" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                        M-Ticket
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-dashed border-gray-200 dark:border-gray-700 flex gap-6">
                    <div className="shrink-0 p-2 bg-white rounded-xl shadow-inner border border-gray-50">
                      {previewBooking.qrCode ? (
                        <img src={previewBooking.qrCode} alt="QR Code" className="w-24 h-24 md:w-28 md:h-28 object-contain" />
                      ) : (
                        <div className="w-24 h-24 md:w-28 md:h-28 flex items-center justify-center bg-gray-50 rounded-lg">
                          <Ticket className="w-10 h-10 text-gray-200" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-bold text-gray-900 dark:text-white">
                        {previewBooking.tickets?.reduce((s, t) => s + (t.quantity || 0), 0)} Ticket{(previewBooking.tickets?.reduce((s, t) => s + (t.quantity || 0), 0) > 1) ? 's' : ''}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase font-semibold">
                        {previewEvent?.venues?.[0]?.fullAddress || previewEvent?.address?.fullAddress || previewEvent?.address?.city || 'Surat'}
                      </p>
                      <div className="mt-3 space-y-1">
                        {previewBooking.tickets?.map((t, i) => (
                          <p key={i} className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{cleanTicketType(t.ticketTypeTitle)} - {t.quantity}x</p>
                        ))}
                      </div>
                      <div className="mt-4">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Booking ID:</p>
                        <p className="text-[11px] font-mono font-bold text-gray-900 dark:text-white uppercase">{previewBooking.bookingId || previewBooking._id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center">
                    <p className="text-[10px] text-gray-500 font-medium">This is your official ticket. Please bring this ticket to the venue.</p>
                  </div>
                </div>

                {/* Total Footer */}
                <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Total Amount</span>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-black text-gray-900 dark:text-white">₹{previewBooking.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="px-6 py-6 md:pb-8">
              <button 
                onClick={() => handleDownloadTicket(previewBooking, previewEvent)}
                className="w-full py-4 bg-[#ff4d6d] hover:bg-[#ff3355] text-white text-base font-bold rounded-2xl transition-all shadow-lg shadow-pink-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Ticket
              </button>
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
      `}} />
    </div>
  )
}

export default BookingHistory
