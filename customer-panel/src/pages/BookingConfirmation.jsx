import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, NavLink } from 'react-router-dom'
import { Calendar, Clock, MapPin, Ticket, CheckCircle, Download, Home, CreditCard, Receipt, X, AlertCircle, Copy, ArrowLeft, ChevronRight } from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import api from '../utils/api'
import Loading from '../components/common/Loading'
import EmptyState from '../components/common/EmptyState'
import Header from '../components/layout/Header'

const BookingConfirmation = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [booking, setBooking] = useState(location.state?.booking || null)
  const [event, setEvent] = useState(location.state?.event || null)
  const [loading, setLoading] = useState(!booking || !event)
  const [error, setError] = useState(null)
  const [paymentDetails, setPaymentDetails] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [loadingPayment, setLoadingPayment] = useState(false)
  const [paymentDetailsError, setPaymentDetailsError] = useState(null)
  const [showTicketPreviewModal, setShowTicketPreviewModal] = useState(false)
  const [previewBooking, setPreviewBooking] = useState(null)
  const [previewEvent, setPreviewEvent] = useState(null)

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (booking && event) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch booking details
        const bookingResponse = await api.get(`/users/bookings/${bookingId}`)
        if (bookingResponse.data?.status === 200 && bookingResponse.data?.result?.booking) {
          const fetchedBooking = bookingResponse.data.result.booking
          setBooking(fetchedBooking)

          // If event not in state, try to get it from booking
          if (!event && fetchedBooking.eventId) {
            const eventId = typeof fetchedBooking.eventId === 'object'
              ? fetchedBooking.eventId._id
              : fetchedBooking.eventId

            try {
              const eventResponse = await api.get(`/users/events/${eventId}`)
              if (eventResponse.data?.status === 200 && eventResponse.data?.result?.event) {
                setEvent(eventResponse.data.result.event)
              }
            } catch (eventError) {
              console.error('Error fetching event:', eventError)
              // Continue without event details - booking details are more important
            }
          }

          // Fetch payment details
          try {
            const bookingIdForPayment = fetchedBooking.bookingId || fetchedBooking._id
            const paymentResponse = await api.get(`/users/payments/booking/${bookingIdForPayment}`)
            if (paymentResponse.data?.status === 200 && paymentResponse.data?.result?.payment) {
              setPaymentDetails(paymentResponse.data.result.payment)
            }
          } catch (paymentError) {
            console.error('Error fetching payment details:', paymentError)
            // Continue without payment details
          }
        } else {
          setError('Booking not found')
        }
      } catch (err) {
        console.error('Error fetching booking:', err)
        setError(err.response?.data?.message || 'Failed to load booking details')
      } finally {
        setLoading(false)
      }
    }

    fetchBookingDetails()
  }, [bookingId, booking, event])

  const formatDate = (date) => {
    if (!date) return 'N/A'
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return 'N/A'

    return dateObj.toLocaleDateString('en-US', {
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

  // Remove "Category" from ticket type names
  const cleanTicketType = (ticketType) => {
    if (!ticketType) return ''
    return ticketType.replace(/\s*Category\s*/gi, '').trim()
  }

  // Format date for ticket download
  const formatDateForTicket = (date) => {
    if (!date) return ''
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return ''

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const dayName = days[dateObj.getDay()]
    const day = dateObj.getDate()
    const month = months[dateObj.getMonth()]
    const year = dateObj.getFullYear()
    return `${dayName}, ${day} ${month} ${year}`
  }

  // Format time for ticket download
  const formatTimeForTicket = (time) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    if (hour === 0) return `12:${minutes} AM`
    if (hour < 12) return `${hour}:${minutes} AM`
    if (hour === 12) return `12:${minutes} PM`
    return `${hour - 12}:${minutes} PM`
  }

  // Format short date like "Fri, 06 Oct"
  const formatShortDate = (date) => {
    if (!date) return 'N/A'
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return 'N/A'
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]}`
  }

  // Get event image URL
  const getEventImage = (event) => {
    if (!event) return ''
    if (event?.eventDetailImage) {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const baseUrl = API_BASE_URL.replace('/api', '')
      const path = event.eventDetailImage.startsWith('http') ? event.eventDetailImage : `${baseUrl}${event.eventDetailImage}`
      return path
    }
    if (event?.eventDetailsImages && event.eventDetailsImages.length > 0) {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const baseUrl = API_BASE_URL.replace('/api', '')
      const path = event.eventDetailsImages[0].startsWith('http') ? event.eventDetailsImages[0] : `${baseUrl}${event.eventDetailsImages[0]}`
      return path
    }
    if (event?.eventImages && event.eventImages.length > 0) {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const baseUrl = API_BASE_URL.replace('/api', '')
      const path = event.eventImages[0].startsWith('http') ? event.eventImages[0] : `${baseUrl}${event.eventImages[0]}`
      return path
    }
    if (event?.banners && event.banners.length > 0) {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const baseUrl = API_BASE_URL.replace('/api', '')
      const path = event.banners[0].startsWith('http') ? event.banners[0] : `${baseUrl}${event.banners[0]}`
      return path
    }
    return ''
  }

  const handleShowTicketPreview = () => {
    if (booking && event) {
      setPreviewBooking(booking)
      setPreviewEvent(event)
      setShowTicketPreviewModal(true)
    }
  }

  const handleDownloadTicket = async (bookingToDownload, eventToDownload) => {
    // Use provided booking/event or fallback to state
    const bookingData = bookingToDownload || booking
    const eventData = eventToDownload || event

    if (!bookingData) {
      console.error('Booking data not available')
      return
    }

    let iframe = null

    try {
      // Process tickets to remove "Category" before using in template
      const processedTickets = bookingData.tickets?.map(t => ({
        ...t,
        cleanTitle: cleanTicketType(t.ticketTypeTitle || '')
      })) || []

      // Get event image
      const eventImage = getEventImage(eventData)
      const venue = eventData?.venues?.[0]?.fullAddress || eventData?.address?.fullAddress || eventData?.address?.city || 'TBA'
      const totalTickets = processedTickets.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0)

      const slotDate = bookingData.slotDate || bookingData.selectedDate
      const slotTime = bookingData.slotStartTime || bookingData.selectedTime

      // Create an iframe to completely isolate from parent page styles
      iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.left = '-9999px'
      iframe.style.top = '0'
      iframe.style.width = '400px'
      iframe.style.height = '600px'
      iframe.style.border = 'none'
      iframe.style.backgroundColor = '#ffffff'
      document.body.appendChild(iframe)

      // Wait for iframe to load
      await new Promise((resolve) => {
        iframe.onload = resolve
        iframe.src = 'about:blank'
      })

      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document

      // Write complete HTML document with no external dependencies - matching preview modal exactly
      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: Arial, sans-serif;
                background-color: rgb(243, 244, 246);
                padding: 32px 24px;
              }
            </style>
          </head>
          <body>
            <div style="max-width: 384px; margin: 0 auto;">
              <div style="background-color: rgb(255, 255, 255); border-radius: 8px; border: 1px solid rgb(229, 231, 235); box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1); overflow: hidden; position: relative;">
                <!-- Upper Section - Event Details -->
                <div style="padding: 16px; position: relative;">
                  <div style="display: flex; gap: 12px; position: relative;">
                    <!-- Event Image/Poster -->
                    <div style="flex-shrink: 0;">
                      ${eventImage ? `
                        <img src="${eventImage}" alt="${eventData?.title || 'Event'}" style="width: 64px; height: 96px; object-fit: cover; border-radius: 4px; background-color: rgb(243, 244, 246);" />
                      ` : `
                        <div style="width: 64px; height: 96px; background: linear-gradient(135deg, rgb(239, 246, 255) 0%, rgb(219, 234, 254) 100%); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: rgb(99, 102, 241); font-size: 24px;">🎫</div>
                      `}
                    </div>
                    
                    <!-- Event Info -->
                    <div style="flex: 1; min-width: 0;">
                      <h2 style="font-size: 16px; font-weight: bold; color: rgb(17, 24, 39); margin-bottom: 4px; line-height: 1.3;">
                        ${eventData?.title || 'Event Ticket'}${eventData?.category ? `<span style="font-size: 14px; font-weight: normal; color: rgb(107, 114, 128);"> (${eventData.category})</span>` : ''}
                      </h2>
                      ${eventData?.category ? `<p style="font-size: 12px; color: rgb(107, 114, 128); margin-bottom: 4px;">${eventData.category}</p>` : ''}
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
                          <img src="${bookingData.qrCode}" alt="QR Code" style="width: 128px; height: 128px; object-fit: contain;" />
                        </div>
                      </div>
                    ` : ''}
                    
                    <!-- Ticket Details -->
                    <div style="flex: 1; min-width: 0;">
                      <p style="font-size: 14px; font-weight: 600; color: rgb(17, 24, 39); margin-bottom: 4px;">
                        ${totalTickets} Ticket${totalTickets > 1 ? 's' : ''}
                      </p>
                      
                      ${(eventData?.venues?.[0]?.fullAddress || eventData?.address?.fullAddress) ? `
                        <p style="font-size: 12px; color: rgb(107, 114, 128); margin-bottom: 4px;">
                          ${eventData?.venues?.[0]?.fullAddress || eventData?.address?.fullAddress}
                        </p>
                      ` : ''}
                      
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
                  
                  <!-- Confirmation Message -->
                  <div style="text-align: center; margin-top: 16px;">
                    <p style="font-size: 12px; color: rgb(107, 114, 128); background-color: rgb(249, 250, 251); padding: 8px 12px; border-radius: 4px;">
                      This is your official ticket. Please bring this ticket to the venue.
                    </p>
                  </div>
                </div>
                
                <!-- Total Amount Footer -->
                <div style="padding: 12px 16px; background-color: rgb(249, 250, 251); border-top: 1px solid rgb(229, 231, 235); display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; font-weight: 600; color: rgb(17, 24, 39);">Total Amount</span>
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

      // Wait for images to load
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Get the body element from iframe
      const iframeBody = iframeDoc.body

      // Convert to canvas - iframe is isolated so no external styles
      const canvas = await html2canvas(iframeBody, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 400,
        windowHeight: iframeBody.scrollHeight
      })

      // Calculate PDF dimensions
      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight)

      // Save PDF
      pdf.save(`Ticket-${bookingData?.bookingId || 'ticket'}.pdf`)

      // Remove iframe
      document.body.removeChild(iframe)
    } catch (error) {
      console.error('Error generating PDF:', error)
      // Clean up on error
      if (iframe && iframe.parentNode) {
        document.body.removeChild(iframe)
      }
      alert('Failed to generate PDF. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" text="Loading booking details..." />
          </div>
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            icon={Ticket}
            title="Booking Not Found"
            message={error || "The booking you're looking for doesn't exist or has been removed."}
          />
        </div>
      </div>
    )
  }

  const eventTitle = event?.title || (typeof booking.eventId === 'object' ? booking.eventId?.title : 'Event')
  const venue = event?.venues?.[0]?.fullAddress || event?.address?.fullAddress || event?.address?.city || 'TBA'

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
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'failed':
      case 'failure':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'refunded':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const formatDateTime = (date) => {
    if (!date) return 'N/A'
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return 'N/A'

    return dateObj.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleViewPaymentDetails = async () => {
    if (!booking) return

    try {
      setLoadingPayment(true)
      setPaymentDetailsError(null)
      setShowPaymentModal(true)

      const bookingIdForPayment = booking.bookingId || booking._id
      const response = await api.get(`/users/payments/booking/${bookingIdForPayment}`)

      if (response.data.status === 200 && response.data.result?.payment) {
        setPaymentDetails(response.data.result.payment)
      } else {
        setPaymentDetailsError(response.data?.message || 'Payment details not found')
      }
    } catch (err) {
      console.error('Error fetching payment details:', err)
      setPaymentDetailsError(err.response?.data?.message || 'Failed to load payment details')
    } finally {
      setLoadingPayment(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header />
      <main className="w-full">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-4">
          <div className="max-w-3xl mx-auto px-4">
            {/* Back to Home Link */}
            <NavLink
              to="/"
              className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go to Home</span>
            </NavLink>
            {/* Success Header - Desktop */}
            <div className="hidden md:flex items-center justify-center mb-4">
              {/* Booking Confirmed Section - Centered */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Booking Confirmed!
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Your tickets have been booked successfully
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile: Booking Confirmed Section - Above Event Details */}
            <div className="md:hidden mb-4">
              <div className="flex items-center gap-3 rounded-lg p-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Booking Confirmed!
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Your tickets have been booked successfully
                  </p>
                </div>
              </div>
            </div>

            {/* Main Cards Layout - Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
              {/* Card 1: Event Details */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {eventTitle}
                </h2>

                {/* Event Details */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatDate(booking.slotDate || booking.selectedDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Time</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatTime(booking.slotStartTime || booking.selectedTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {venue}
                      </p>
                    </div>
                  </div>

                  {/* View Payment Details Button - Desktop Only */}
                  <div className="hidden md:block mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleViewPaymentDetails}
                      className="w-full px-3 py-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors border border-primary-200 dark:border-primary-800"
                    >
                      View Payment Details
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2: QR Code and Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                {/* QR Code */}
                {booking.qrCode ? (
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 text-center">
                      QR Code
                    </h3>
                    <div className="bg-white dark:bg-gray-700 p-2 rounded-lg shadow-inner flex justify-center items-center mb-2">
                      <img src={booking.qrCode} alt="QR Code" className="w-32 h-32 object-contain" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      Scan at venue
                    </p>
                  </div>
                ) : (
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 text-center">
                      QR Code
                    </h3>
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg flex justify-center items-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Not available</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={handleShowTicketPreview}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Ticket
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Booking, Payment, and Ticket Details Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Booking Details Section */}
                <div className="border-r border-gray-200 dark:border-gray-700 pr-4 last:border-r-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Receipt className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Booking Details</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Booking ID</p>
                      <p className="font-mono font-semibold text-gray-900 dark:text-white text-xs">
                        {booking.bookingId}
                      </p>
                    </div>
                    {booking.createdAt && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Booking Date</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatDate(booking.createdAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Details Section - Mobile Only */}
                <div className="md:hidden border-r border-gray-200 dark:border-gray-700 pr-4 last:border-r-0">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Payment Details</h3>
                  </div>
                  <div className="space-y-2">
                    {paymentDetails ? (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Payment Method</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {getPaymentMethodLabel(paymentDetails.paymentMethod)}
                          </p>
                        </div>
                        {paymentDetails.razorpayPaymentId && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Payment ID</p>
                            <p className="font-mono font-semibold text-gray-900 dark:text-white text-xs break-all">
                              {paymentDetails.razorpayPaymentId}
                            </p>
                          </div>
                        )}
                        {paymentDetails.razorpayOrderId && (
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Order ID</p>
                            <p className="font-mono font-semibold text-gray-900 dark:text-white text-xs break-all">
                              {paymentDetails.razorpayOrderId}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Status</p>
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            {paymentDetails.status === 'success' ? 'Successful' : paymentDetails.status?.toUpperCase() || 'PENDING'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={handleViewPaymentDetails}
                        className="w-full px-3 py-2 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors border border-primary-200 dark:border-primary-800"
                      >
                        View Payment Details
                      </button>
                    )}
                  </div>
                </div>

                {/* Ticket Details Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Ticket className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Ticket Details</h3>
                  </div>
                  <div className="space-y-2">
                    {booking.tickets?.map((ticket, index) => (
                      <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {cleanTicketType(ticket.ticketTypeTitle || 'Ticket')}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            ×{ticket.quantity}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Price</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            ₹{ticket.price?.toLocaleString('en-IN') || '0'}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Total Tickets</p>
                          <p className="text-sm font-bold text-primary-600 dark:text-primary-400">
                            {booking.tickets?.reduce((sum, t) => sum + (t.quantity || 0), 0) || 0}
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-semibold">
                          <CheckCircle className="w-3 h-3" />
                          Confirmed
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Footer: Amount Paid */}
              <div className="md:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end">
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Amount Paid</p>
                  <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    ₹{booking.totalAmount?.toLocaleString('en-IN') || '0'}
                  </p>
                </div>
              </div>

              {/* Desktop Footer: Total Amount Paid */}
              <div className="hidden md:block mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Total Amount Paid</p>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    ₹{booking.totalAmount?.toLocaleString('en-IN') || '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Details Modal */}
      {showPaymentModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50  z-40 transition-opacity"
            onClick={() => {
              setShowPaymentModal(false)
              setPaymentDetails(null)
              setPaymentDetailsError(null)
            }}
          />

          {/* Modal - Mobile: Slide up from bottom, Desktop: Centered */}
          <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center md:p-4">
            {/* Mobile: Bottom sheet */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up-from-bottom">
              {/* Drag Handle - Mobile only */}
              <div className="flex-shrink-0 pt-3 pb-2 flex justify-center">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              </div>

              {/* Header */}
              <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Payment Details</h2>
                  {booking && (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Booking ID: <span className="font-mono text-[10px]">{booking.bookingId}</span>
                      </p>
                      {booking.createdAt && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Booking Date: {formatDate(booking.createdAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentDetails(null)
                    setPaymentDetailsError(null)
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-2 shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {loadingPayment ? (
                  <div className="flex items-center justify-center py-12">
                    <Loading size="md" text="Loading payment details..." />
                  </div>
                ) : paymentDetailsError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-400 dark:text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      {paymentDetailsError}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      Please try again or contact support if the issue persists.
                    </p>
                  </div>
                ) : paymentDetails ? (
                  <div className="space-y-4">
                    {/* Payment Status */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        {paymentDetails.status === 'success' ? (
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-300" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-300" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Payment Status</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mt-0.5 ${getPaymentStatusColor(paymentDetails.status)}`}>
                            {paymentDetails.status?.toUpperCase() || 'PENDING'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Amount Paid</p>
                        <p className="text-lg font-bold text-primary-600 dark:text-primary-400 mt-0.5">
                          ₹{paymentDetails.amount?.toLocaleString('en-IN') || '0'}
                        </p>
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className="space-y-3">
                      {/* Payment Method and Currency - Side by Side */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Payment Method</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {getPaymentMethodLabel(paymentDetails.paymentMethod)}
                          </p>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Currency</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {paymentDetails.currency || 'INR'}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Payment Date</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatDateTime(paymentDetails.createdAt)}
                        </p>
                      </div>

                      {paymentDetails.razorpayPaymentId && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Payment ID</p>
                              <p className="font-mono text-[10px] text-gray-900 dark:text-white break-all">
                                {paymentDetails.razorpayPaymentId}
                              </p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(paymentDetails.razorpayPaymentId)}
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors shrink-0"
                              title="Copy Payment ID"
                            >
                              <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                          </div>
                        </div>
                      )}

                      {paymentDetails.razorpayOrderId && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Order ID</p>
                              <p className="font-mono text-[10px] text-gray-900 dark:text-white break-all">
                                {paymentDetails.razorpayOrderId}
                              </p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(paymentDetails.razorpayOrderId)}
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors shrink-0"
                              title="Copy Order ID"
                            >
                              <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Failure Reason (if failed) */}
                    {paymentDetails.status === 'failed' && paymentDetails.failureReason && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-xs font-semibold text-red-900 dark:text-red-300 mb-1">Failure Reason</p>
                        <p className="text-xs text-red-700 dark:text-red-400">{paymentDetails.failureReason}</p>
                      </div>
                    )}

                    {/* Refund Information (if refunded) */}
                    {paymentDetails.status === 'refunded' && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">Refund Information</p>
                        <div className="space-y-2">
                          {paymentDetails.refundId && (
                            <div>
                              <p className="text-[10px] text-blue-700 dark:text-blue-400">Refund ID</p>
                              <p className="font-mono text-xs text-blue-900 dark:text-blue-300">{paymentDetails.refundId}</p>
                            </div>
                          )}
                          {paymentDetails.refundAmount > 0 && (
                            <div>
                              <p className="text-[10px] text-blue-700 dark:text-blue-400">Refund Amount</p>
                              <p className="text-base font-bold text-blue-900 dark:text-blue-300">
                                ₹{paymentDetails.refundAmount.toLocaleString('en-IN')}
                              </p>
                            </div>
                          )}
                          {paymentDetails.refundedAt && (
                            <div>
                              <p className="text-[10px] text-blue-700 dark:text-blue-400">Refund Date</p>
                              <p className="text-xs text-blue-900 dark:text-blue-300">
                                {formatDateTime(paymentDetails.refundedAt)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      Payment details not found
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      No payment information is available for this booking.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer with Close Button - Mobile */}
              <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentDetails(null)
                    setPaymentDetailsError(null)
                  }}
                  className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white font-medium rounded-lg transition-all shadow-[0_4px_12px_rgba(235,78,98,0.3)] hover:shadow-[0_6px_16px_rgba(235,78,98,0.4)]"
                >
                  Okay, Got it
                </button>
              </div>
            </div>

            {/* Desktop/Tablet: Centered Modal */}
            <div className="hidden md:flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden">
              {/* Header */}
              <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Payment Details</h2>
                  {booking && (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Booking ID: <span className="font-mono">{booking.bookingId}</span>
                      </p>
                      {booking.createdAt && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Booking Date: {formatDate(booking.createdAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentDetails(null)
                    setPaymentDetailsError(null)
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                {loadingPayment ? (
                  <div className="flex items-center justify-center py-8">
                    <Loading size="md" text="Loading payment details..." />
                  </div>
                ) : paymentDetailsError ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-10 h-10 text-red-400 dark:text-red-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {paymentDetailsError}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1.5">
                      Please try again or contact support if the issue persists.
                    </p>
                  </div>
                ) : paymentDetails ? (
                  <div className="space-y-3">
                    {/* Payment Status */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        {paymentDetails.status === 'success' ? (
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-300" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-300" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Payment Status</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mt-0.5 ${getPaymentStatusColor(paymentDetails.status)}`}>
                            {paymentDetails.status?.toUpperCase() || 'PENDING'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 dark:text-gray-400">Amount Paid</p>
                        <p className="text-lg font-bold text-primary-600 dark:text-primary-400 mt-0.5">
                          ₹{paymentDetails.amount?.toLocaleString('en-IN') || '0'}
                        </p>
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className="space-y-2">
                      {/* Payment Method and Currency - Side by Side */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Payment Method</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {getPaymentMethodLabel(paymentDetails.paymentMethod)}
                          </p>
                        </div>

                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Currency</p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {paymentDetails.currency || 'INR'}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Payment Date</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatDateTime(paymentDetails.createdAt)}
                        </p>
                      </div>

                      {paymentDetails.razorpayPaymentId && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Payment ID</p>
                              <p className="font-mono text-[10px] text-gray-900 dark:text-white break-all">
                                {paymentDetails.razorpayPaymentId}
                              </p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(paymentDetails.razorpayPaymentId)}
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors shrink-0"
                              title="Copy Payment ID"
                            >
                              <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                          </div>
                        </div>
                      )}

                      {paymentDetails.razorpayOrderId && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Order ID</p>
                              <p className="font-mono text-[10px] text-gray-900 dark:text-white break-all">
                                {paymentDetails.razorpayOrderId}
                              </p>
                            </div>
                            <button
                              onClick={() => copyToClipboard(paymentDetails.razorpayOrderId)}
                              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors shrink-0"
                              title="Copy Order ID"
                            >
                              <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Failure Reason (if failed) */}
                    {paymentDetails.status === 'failed' && paymentDetails.failureReason && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-xs font-semibold text-red-900 dark:text-red-300 mb-0.5">Failure Reason</p>
                        <p className="text-xs text-red-700 dark:text-red-400">{paymentDetails.failureReason}</p>
                      </div>
                    )}

                    {/* Refund Information (if refunded) */}
                    {paymentDetails.status === 'refunded' && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-red-800 rounded-lg">
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1.5">Refund Information</p>
                        <div className="space-y-1.5">
                          {paymentDetails.refundId && (
                            <div>
                              <p className="text-[10px] text-blue-700 dark:text-blue-400">Refund ID</p>
                              <p className="font-mono text-xs text-blue-900 dark:text-blue-300">{paymentDetails.refundId}</p>
                            </div>
                          )}
                          {paymentDetails.refundAmount > 0 && (
                            <div>
                              <p className="text-[10px] text-blue-700 dark:text-blue-400">Refund Amount</p>
                              <p className="text-base font-bold text-blue-900 dark:text-blue-300">
                                ₹{paymentDetails.refundAmount.toLocaleString('en-IN')}
                              </p>
                            </div>
                          )}
                          {paymentDetails.refundedAt && (
                            <div>
                              <p className="text-[10px] text-blue-700 dark:text-blue-400">Refund Date</p>
                              <p className="text-xs text-blue-900 dark:text-blue-300">
                                {formatDateTime(paymentDetails.refundedAt)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-10 h-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Payment details not found
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1.5">
                      No payment information is available for this booking.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer - Sticky at bottom */}
              <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-5">
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentDetails(null)
                    setPaymentDetailsError(null)
                  }}
                  className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all shadow-[0_4px_12px_rgba(235,78,98,0.3)] hover:shadow-[0_6px_16px_rgba(235,78,98,0.4)]"
                >
                  Okay, Got it
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Ticket Preview Modal */}
      {showTicketPreviewModal && previewBooking && previewEvent && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => {
              setShowTicketPreviewModal(false)
              setPreviewBooking(null)
              setPreviewEvent(null)
            }}
          />

          {/* Modal - Mobile: Slide up from bottom, Desktop: Centered */}
          <div className="fixed inset-0 z-50 md:flex md:items-center md:justify-center md:p-4">
            {/* Mobile: Bottom sheet */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up-from-bottom">
              {/* Drag Handle - Mobile only */}
              <div className="flex-shrink-0 pt-3 pb-2 flex justify-center">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              </div>

              {/* Header */}
              <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ticket Preview</h2>
                <button
                  onClick={() => {
                    setShowTicketPreviewModal(false)
                    setPreviewBooking(null)
                    setPreviewEvent(null)
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ml-2 shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="bg-gray-100 dark:bg-gray-900 py-4" style={{ backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                  <div className="max-w-sm mx-auto px-2">
                    {/* Ticket Preview - Same structure as download */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-4 relative">
                      {/* Upper Section - Event Details */}
                      <div className="p-4 relative">
                        <div className="flex gap-3">
                          {/* Event Image/Poster */}
                          <div className="shrink-0">
                            {getEventImage(previewEvent) ? (
                              <img
                                src={getEventImage(previewEvent)}
                                alt={previewEvent?.title || 'Event'}
                                className="w-16 h-24 object-cover rounded"
                              />
                            ) : (
                              <div className="w-16 h-24 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded flex items-center justify-center">
                                <Ticket className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                              </div>
                            )}
                          </div>

                          {/* Event Info */}
                          <div className="flex-1 min-w-0 pr-8">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                              {previewEvent?.title || 'Event Ticket'}
                              {previewEvent?.category && <span className="text-sm font-normal text-gray-600 dark:text-gray-400"> ({previewEvent.category})</span>}
                            </h2>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              {previewEvent?.category || 'Event'}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              {formatShortDate(previewBooking.slotDate || previewBooking.selectedDate)} | {formatTimeForTicket(previewBooking.slotStartTime || previewBooking.selectedTime)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {previewEvent?.venues?.[0]?.fullAddress || previewEvent?.address?.fullAddress || previewEvent?.address?.city || 'TBA'}
                            </p>
                          </div>

                          {/* M-Ticket Label - Vertical */}
                          <div className="absolute right-4 top-4">
                            <div className="text-xs font-semibold text-primary-600 dark:text-primary-400" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                              M-Ticket
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lower Section - QR Code and Details */}
                      <div className="p-4 pt-6">
                        <div className="flex gap-4">
                          {/* QR Code */}
                          {previewBooking.qrCode && (
                            <div className="shrink-0">
                              <div className="bg-white dark:bg-gray-700 p-2 rounded">
                                <img
                                  src={previewBooking.qrCode}
                                  alt="QR Code"
                                  className="w-32 h-32 object-contain"
                                />
                              </div>
                            </div>
                          )}

                          {/* Ticket Details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                              {previewBooking.tickets?.reduce((sum, t) => sum + (t.quantity || 0), 0) || 0} Ticket{(previewBooking.tickets?.reduce((sum, t) => sum + (t.quantity || 0), 0) || 0) > 1 ? 's' : ''}
                            </p>

                            {/* Venue/Audi Info */}
                            {(previewEvent?.venues?.[0]?.fullAddress || previewEvent?.address?.fullAddress) && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                {previewEvent?.venues?.[0]?.fullAddress || previewEvent?.address?.fullAddress}
                              </p>
                            )}

                            {/* Ticket Types */}
                            {previewBooking.tickets?.map((ticket, index) => (
                              <p key={index} className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                {cleanTicketType(ticket.ticketTypeTitle || 'Ticket')} - {ticket.quantity}x
                              </p>
                            ))}

                            {/* Booking ID */}
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                              BOOKING ID: <span className="font-mono font-semibold text-gray-900 dark:text-white">{previewBooking.bookingId}</span>
                            </p>
                          </div>
                        </div>

                        {/* Confirmation Message */}
                        <div className="text-center mt-4">
                          <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 py-2 px-3 rounded">
                            This is your official ticket. Please bring this ticket to the venue.
                          </p>
                        </div>
                      </div>

                      {/* Total Amount Footer */}
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">Total Amount</span>
                          <div className="flex items-center gap-1">
                            <span className="text-base font-bold text-gray-900 dark:text-white">
                              ₹{previewBooking.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400 rotate-90" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer with Download Button - Mobile */}
              <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <button
                  onClick={() => {
                    handleDownloadTicket(previewBooking, previewEvent)
                    setShowTicketPreviewModal(false)
                    setPreviewBooking(null)
                    setPreviewEvent(null)
                  }}
                  className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white font-medium rounded-lg transition-all shadow-[0_4px_12px_rgba(235,78,98,0.3)] hover:shadow-[0_6px_16px_rgba(235,78,98,0.4)] flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Ticket
                </button>
              </div>
            </div>

            {/* Desktop/Tablet: Centered Modal */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ticket Preview</h2>
                <button
                  onClick={() => {
                    setShowTicketPreviewModal(false)
                    setPreviewBooking(null)
                    setPreviewEvent(null)
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="bg-gray-100 dark:bg-gray-900 py-8" style={{ backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                  <div className="max-w-sm mx-auto">
                    {/* Ticket Preview - Same structure as download */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-4 relative">
                      {/* Upper Section - Event Details */}
                      <div className="p-4 relative">
                        <div className="flex gap-3">
                          {/* Event Image/Poster */}
                          <div className="shrink-0">
                            {getEventImage(previewEvent) ? (
                              <img
                                src={getEventImage(previewEvent)}
                                alt={previewEvent?.title || 'Event'}
                                className="w-16 h-24 object-cover rounded"
                              />
                            ) : (
                              <div className="w-16 h-24 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded flex items-center justify-center">
                                <Ticket className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                              </div>
                            )}
                          </div>

                          {/* Event Info */}
                          <div className="flex-1 min-w-0 pr-8">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                              {previewEvent?.title || 'Event Ticket'}
                              {previewEvent?.category && <span className="text-sm font-normal text-gray-600 dark:text-gray-400"> ({previewEvent.category})</span>}
                            </h2>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              {previewEvent?.category || 'Event'}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              {formatShortDate(previewBooking.slotDate || previewBooking.selectedDate)} | {formatTimeForTicket(previewBooking.slotStartTime || previewBooking.selectedTime)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {previewEvent?.venues?.[0]?.fullAddress || previewEvent?.address?.fullAddress || previewEvent?.address?.city || 'TBA'}
                            </p>
                          </div>

                          {/* M-Ticket Label - Vertical */}
                          <div className="absolute right-4 top-4">
                            <div className="text-xs font-semibold text-primary-600 dark:text-primary-400" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                              M-Ticket
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lower Section - QR Code and Details */}
                      <div className="p-4 pt-6">
                        <div className="flex gap-4">
                          {/* QR Code */}
                          {previewBooking.qrCode && (
                            <div className="shrink-0">
                              <div className="bg-white dark:bg-gray-700 p-2 rounded">
                                <img
                                  src={previewBooking.qrCode}
                                  alt="QR Code"
                                  className="w-32 h-32 object-contain"
                                />
                              </div>
                            </div>
                          )}

                          {/* Ticket Details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                              {previewBooking.tickets?.reduce((sum, t) => sum + (t.quantity || 0), 0) || 0} Ticket{(previewBooking.tickets?.reduce((sum, t) => sum + (t.quantity || 0), 0) || 0) > 1 ? 's' : ''}
                            </p>

                            {/* Venue/Audi Info */}
                            {(previewEvent?.venues?.[0]?.fullAddress || previewEvent?.address?.fullAddress) && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                {previewEvent?.venues?.[0]?.fullAddress || previewEvent?.address?.fullAddress}
                              </p>
                            )}

                            {/* Ticket Types */}
                            {previewBooking.tickets?.map((ticket, index) => (
                              <p key={index} className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                {cleanTicketType(ticket.ticketTypeTitle || 'Ticket')} - {ticket.quantity}x
                              </p>
                            ))}

                            {/* Booking ID */}
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                              BOOKING ID: <span className="font-mono font-semibold text-gray-900 dark:text-white">{previewBooking.bookingId}</span>
                            </p>
                          </div>
                        </div>

                        {/* Confirmation Message */}
                        <div className="text-center mt-4">
                          <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 py-2 px-3 rounded">
                            This is your official ticket. Please bring this ticket to the venue.
                          </p>
                        </div>
                      </div>

                      {/* Total Amount Footer */}
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">Total Amount</span>
                          <div className="flex items-center gap-1">
                            <span className="text-base font-bold text-gray-900 dark:text-white">
                              ₹{previewBooking.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </span>
                            <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400 rotate-90" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer with Download Button - Desktop */}
              <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                <button
                  onClick={() => {
                    handleDownloadTicket(previewBooking, previewEvent)
                    setShowTicketPreviewModal(false)
                    setPreviewBooking(null)
                    setPreviewEvent(null)
                  }}
                  className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white font-medium rounded-lg transition-all shadow-[0_4px_12px_rgba(235,78,98,0.3)] hover:shadow-[0_6px_16px_rgba(235,78,98,0.4)] flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Ticket
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default BookingConfirmation
