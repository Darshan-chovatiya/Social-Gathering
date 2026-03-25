import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, Ticket, Download, AlertCircle, Share2, X, Wallet, Phone, Ban, ArrowLeft, ChevronDown } from 'lucide-react'
import api from '../utils/api'
import Loading from '../components/common/Loading'
import EmptyState from '../components/common/EmptyState'

const TicketDownload = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [showDetails, setShowDetails] = useState(true)
  const [imageError, setImageError] = useState(false)
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  
  const getImageUrl = (bannerPath) => {
    if (!bannerPath) return ''
    if (bannerPath.startsWith('http')) return bannerPath
    const baseUrl = API_BASE_URL.replace('/api', '')
    return `${baseUrl}${bannerPath}`
  }
  
  const getEventImage = () => {
    if (!event) return null
    if (event.eventDetailsImages && event.eventDetailsImages.length > 0) {
      return getImageUrl(event.eventDetailsImages[0])
    } else if (event.eventDetailImage) {
      return getImageUrl(event.eventDetailImage)
    } else if (event.eventImages && event.eventImages.length > 0) {
      return getImageUrl(event.eventImages[0])
    } else if (event.banners && event.banners.length > 0) {
      return getImageUrl(event.banners[0])
    }
    return null
  }

  useEffect(() => {
    const verifyAndFetchTicket = async () => {
      try {
        setLoading(true)
        setError(null)
        setVerifying(true)

        // First verify the QR code
        const verifyResponse = await api.post('/public/bookings/verify-qr', {
          bookingId: bookingId
        })

        if (verifyResponse.data?.status === 200 && verifyResponse.data?.result?.booking) {
          const verifiedBooking = verifyResponse.data.result.booking
          
          // Fetch full booking details
          const bookingResponse = await api.get(`/users/bookings/${bookingId}`)
          if (bookingResponse.data?.status === 200 && bookingResponse.data?.result?.booking) {
            const fullBooking = bookingResponse.data.result.booking
            setBooking(fullBooking)
            
            // Fetch event details if available
            if (fullBooking.eventId) {
              const eventId = typeof fullBooking.eventId === 'object' 
                ? fullBooking.eventId._id 
                : fullBooking.eventId
              
              try {
                const eventResponse = await api.get(`/users/events/${eventId}`)
                if (eventResponse.data?.status === 200 && eventResponse.data?.result?.event) {
                  setEvent(eventResponse.data.result.event)
                }
              } catch (eventError) {
                console.error('Error fetching event:', eventError)
                // Continue without event details
              }
            }
          } else {
            setError('Booking not found')
          }
        } else {
          setError('Invalid ticket. Please check your QR code.')
        }
      } catch (err) {
        console.error('Error verifying ticket:', err)
        setError(err.response?.data?.message || 'Failed to verify ticket. Please check your QR code.')
      } finally {
        setLoading(false)
        setVerifying(false)
      }
    }

    if (bookingId) {
      verifyAndFetchTicket()
    } else {
      setError('Booking ID is required')
      setLoading(false)
    }
  }, [bookingId])

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

  const handleDownloadTicket = () => {
    // Create a printable/downloadable version of the ticket
    // Use a hidden iframe to avoid showing preview
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    iframe.style.opacity = '0'
    iframe.style.pointerEvents = 'none'
    document.body.appendChild(iframe)
    
    if (booking) {
      // Process tickets to remove "Category" before using in template
      const processedTickets = booking.tickets?.map(t => ({
        ...t,
        cleanTitle: cleanTicketType(t.ticketTypeTitle || '')
      })) || []
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write(`
        <html>
          <head>
            <title>Ticket - ${booking?.bookingId}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
                padding: 20px; 
                background: #f5f5f5;
              }
              .ticket { 
                border: 3px solid #6366f1; 
                border-radius: 12px;
                padding: 40px; 
                max-width: 600px; 
                margin: 0 auto; 
                background: white;
                box-shadow: 0 10px 25px rgba(0,0,0,0.15);
              }
              .header { 
                text-align: center; 
                margin-bottom: 35px; 
                border-bottom: 3px solid #6366f1;
                padding-bottom: 25px;
              }
              .header h1 { 
                color: #6366f1; 
                font-size: 36px; 
                font-weight: bold;
                margin-bottom: 8px;
                letter-spacing: -0.5px;
              }
              .header h2 { 
                font-size: 22px; 
                color: #333;
                margin-top: 12px;
                font-weight: 600;
              }
              .qr-code { 
                text-align: center; 
                margin: 30px 0; 
                padding: 25px;
                background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
                border: 2px dashed #d1d5db;
                border-radius: 8px;
              }
              .qr-code img { 
                max-width: 200px; 
                height: auto;
              }
              .details { 
                margin: 20px 0; 
              }
              .details div { 
                margin: 8px 0; 
                font-size: 16px;
                padding: 4px 0;
                border-bottom: 1px solid #e5e7eb;
              }
              .details div:last-of-type {
                border-bottom: none;
              }
              .details strong { 
                display: inline-block;
                width: 160px;
                color: #4b5563;
                font-weight: 600;
              }
              .details .status {
                color: #059669;
                font-weight: bold;
              }
              .footer {
                text-align: center;
                margin-top: 35px;
                padding-top: 25px;
                border-top: 2px solid #e5e7eb;
                color: #6b7280;
                font-size: 13px;
                line-height: 1.6;
              }
              @media print {
                body { background: white; padding: 0; }
                .ticket { 
                  box-shadow: none; 
                  border: 2px solid #000;
                  border-radius: 0;
                  padding: 30px;
                }
              }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                <h1>Easy Tickets</h1>
                <h2>${event?.title || 'Event Ticket'}</h2>
              </div>
              <div class="qr-code">
                ${booking?.qrCode ? `<img src="${booking.qrCode}" alt="QR Code" />` : ''}
              </div>
              <div class="details">
                <div><strong>Booking ID:</strong> ${booking?.bookingId}</div>
                <div><strong>Date:</strong> ${formatDateForTicket(booking?.slotDate || booking?.selectedDate)}</div>
                <div><strong>Time:</strong> ${formatTimeForTicket(booking?.slotStartTime || booking?.selectedTime)}</div>
                <div><strong>Location:</strong> ${event?.venues?.[0]?.fullAddress || event?.address?.fullAddress || event?.address?.city || 'TBA'}</div>
                <div><strong>Tickets:</strong> ${processedTickets.map(t => `${t.quantity}x ${t.cleanTitle || 'Ticket'}`).join(', ') || 'N/A'}</div>
                ${booking?.createdAt ? `<div><strong>Booking Date:</strong> ${formatDateForTicket(booking.createdAt)}</div>` : ''}
                <div><strong>Total Amount:</strong> ₹${booking?.totalAmount?.toLocaleString('en-IN') || '0'}</div>
                <div><strong>Status:</strong> <span style="color: green; font-weight: bold;">Confirmed</span></div>
              </div>
              <div class="footer">
                <p>This is your official ticket. Please bring this ticket to the venue.</p>
                <p>For any queries, contact support.</p>
              </div>
            </div>
          </body>
        </html>
      `)
        iframeDoc.close()
        
        // Trigger print immediately
        setTimeout(() => {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus()
            iframe.contentWindow.print()
          }
          // Remove iframe after print dialog appears
          setTimeout(() => {
            if (iframe.parentNode) {
              document.body.removeChild(iframe)
            }
          }, 1000)
        }, 100)
      }
    }
  }

  if (loading || verifying) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" text={verifying ? "Verifying ticket..." : "Loading ticket details..."} />
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
            icon={AlertCircle}
            title="Ticket Not Found"
            message={error || "The ticket you're looking for doesn't exist or is invalid."}
          />
        </div>
      </div>
    )
  }

  const eventTitle = event?.title || (typeof booking.eventId === 'object' ? booking.eventId?.title : 'Event')
  const venue = event?.venues?.[0]?.fullAddress || event?.address?.fullAddress || event?.address?.city || 'TBA'
  const eventImage = getEventImage()
  const totalTickets = booking.tickets?.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0) || 0
  const subtotal = booking.tickets?.reduce((sum, ticket) => sum + (ticket.price * ticket.quantity || 0), 0) || 0
  const discount = booking.discount || 0
  const convenienceFee = (booking.totalAmount || 0) - subtotal + discount
  const savedAmount = discount > 0 ? discount : 0
  
  // Format date like "Fri, 06 Oct"
  const formatShortDate = (date) => {
    if (!date) return 'N/A'
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return 'N/A'
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]}`
  }
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket for ${eventTitle}`,
          text: `Check out my ticket for ${eventTitle}`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Ticket link copied to clipboard!')
    }
  }

  const handleClose = () => {
    navigate(-1)
  }

  const handleAddToWallet = () => {
    // Placeholder for Apple Wallet / Google Wallet functionality
    alert('Wallet functionality coming soon!')
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-4 sm:py-8" style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      <div className="max-w-sm mx-auto px-4">
        {/* Header - BookMyShow Style */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleAddToWallet}
            className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <Wallet className="w-4 h-4" />
            <span>Apple wallet</span>
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Your Ticket</h1>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Main Ticket Card - BookMyShow Style */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-4 relative">
          {/* Upper Section - Event Details */}
          <div className="p-4 relative">
            <div className="flex gap-3">
              {/* Event Image/Poster */}
              <div className="flex-shrink-0">
                {eventImage && !imageError ? (
                  <img
                    src={eventImage}
                    alt={eventTitle}
                    className="w-16 h-24 object-cover rounded"
                    onError={() => setImageError(true)}
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
                  {eventTitle}
                  {event?.category && <span className="text-sm font-normal text-gray-600 dark:text-gray-400"> ({event.category})</span>}
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {event?.category || 'Event'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {formatShortDate(booking.slotDate || booking.selectedDate)} | {formatTime(booking.slotStartTime || booking.selectedTime)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {venue}
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
              {booking.qrCode && (
                <div className="flex-shrink-0">
                  <div className="bg-white dark:bg-gray-700 p-2 rounded">
                    <img 
                      src={booking.qrCode} 
                      alt="QR Code" 
                      className="w-32 h-32 object-contain"
                    />
                  </div>
                </div>
              )}
              
              {/* Ticket Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {totalTickets} Ticket{totalTickets > 1 ? 's' : ''}
                </p>
                
                {/* Venue/Audi Info */}
                {venue && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {venue}
                  </p>
                )}
                
                {/* Ticket Types */}
                {booking.tickets?.map((ticket, index) => (
                  <p key={index} className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {cleanTicketType(ticket.ticketTypeTitle || 'Ticket')} - {ticket.quantity}x
                  </p>
                ))}
                
                {/* Booking ID */}
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  BOOKING ID: <span className="font-mono font-semibold text-gray-900 dark:text-white">{booking.bookingId}</span>
                </p>
                
                {/* Tap to see more */}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mt-1 underline"
                >
                  Tap to see more
                </button>
              </div>
            </div>

            {/* Expanded Details */}
            {showDetails && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {/* Confirmation Message */}
                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                  A confirmation is sent on e-mail/SMS/WhatsApp within 15 minutes of booking.
                </p>

                {/* Action Buttons */}
                <div className="flex items-center justify-around pt-2">
                  <button className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Ban className="w-5 h-5" />
                    </div>
                    <span className="text-xs">Cancel booking</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Phone className="w-5 h-5" />
                    </div>
                    <span className="text-xs">Contact support</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Total Amount Footer */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Total Amount</span>
              <div className="flex items-center gap-1">
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  ₹{booking.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownloadTicket}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors shadow-lg"
        >
          <Download className="w-5 h-5" />
          Download Ticket
        </button>
      </div>
    </div>
  )
}

export default TicketDownload
