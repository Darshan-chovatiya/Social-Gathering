import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation, NavLink } from 'react-router-dom'
import { MapPin, Calendar, Clock, Ticket, ArrowLeft, Tag, X, User, Mail, Phone, Info } from 'lucide-react'
import EmptyState from '../components/common/EmptyState'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../components/common/ToastContainer'
import Header from '../components/layout/Header'
import { getEventDetailPath } from '../utils/eventUrl'

const BookingSummary = () => {
  const { id, organizerSlug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  const [showCouponCanvas, setShowCouponCanvas] = useState(false)
  const [availableCoupons, setAvailableCoupons] = useState([])
  const [loadingCoupons, setLoadingCoupons] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [showStickyButton, setShowStickyButton] = useState(true) // Show sticky button on mobile
  const [showFullDescription, setShowFullDescription] = useState(false)
  
  // Get booking data from location state or sessionStorage (if redirected from login)
  const [bookingData, setBookingData] = useState(() => {
    const state = location.state
    if (state) return state
    
    const saved = sessionStorage.getItem('bookingData')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Convert date strings back to Date objects
        if (parsed.selectedDate && typeof parsed.selectedDate === 'string') {
          parsed.selectedDate = new Date(parsed.selectedDate)
        }
        return parsed
      } catch (err) {
        console.error('Error parsing saved booking data:', err)
        return null
      }
    }
    return null
  })
  
  // Clear sessionStorage if we have location state
  useEffect(() => {
    if (location.state && sessionStorage.getItem('bookingData')) {
      sessionStorage.removeItem('bookingData')
      sessionStorage.removeItem('bookingPath')
    }
  }, [location.state])

  // Scroll detection for sticky button on mobile
  useEffect(() => {
    if (!bookingData) return

    const handleScroll = () => {
      // Only apply scroll detection on mobile
      if (window.innerWidth < 1024) {
        const scrollPosition = window.scrollY + window.innerHeight
        const documentHeight = document.documentElement.scrollHeight
        // Hide sticky button when near bottom of page (within 50px)
        // Show it at all other scroll positions (top, middle, etc.)
        setShowStickyButton(scrollPosition < documentHeight - 50)
      } else {
        // Always hide sticky button on desktop (it's not used)
        setShowStickyButton(false)
      }
    }

    // Initialize: show button by default on mobile
    if (window.innerWidth < 1024) {
      setShowStickyButton(true)
    }

    // Check on mount and after a short delay to ensure DOM is ready
    setTimeout(handleScroll, 100)
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [bookingData])

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            icon={Ticket}
            title="No Booking Data"
            message="Please start the booking process from the event page."
          />
        </div>
      </div>
    )
  }

  const { event, selectedVenue, selectedDate, selectedTime, selectedTickets, total } = bookingData

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

  const getImageUrl = (bannerPath) => {
    if (!bannerPath) return ''
    if (bannerPath.startsWith('http')) return bannerPath
    const baseUrl = API_BASE_URL.replace('/api', '')
    return `${baseUrl}${bannerPath}`
  }

  const getTicketTypes = () => {
    if (!event?.ticketTypes) return []
    return event.ticketTypes.filter(ticket => ticket.isActive)
  }

  const formatDate = (date) => {
    if (!date) return ''
    // Convert string to Date object if needed
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return ''
    
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    const dayName = days[dateObj.getDay()]
    const day = dateObj.getDate()
    const month = months[dateObj.getMonth()]
    return `${dayName} ${day} ${month}`
  }

  const formatTime = (time) => {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    if (hour === 0) return `12:${minutes} AM`
    if (hour < 12) return `${hour}:${minutes} AM`
    if (hour === 12) return `12:${minutes} PM`
    return `${hour - 12}:${minutes} PM`
  }

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0)
  }

  // Fetch available coupons (only for authenticated users)
  useEffect(() => {
    if (showCouponCanvas && event?._id && isAuthenticated) {
      fetchAvailableCoupons()
    }
  }, [showCouponCanvas, event?._id, isAuthenticated])

  const fetchAvailableCoupons = async () => {
    setLoadingCoupons(true)
    try {
      // Use authenticated users endpoint so backend can calculate isAvailable/isAlreadyUsed
      const response = await api.get(`/users/events/${event._id}/offers`)
      // Backend returns { status, message, result: { offers: [...] } }
      if (response.data?.result?.offers) {
        setAvailableCoupons(response.data.result.offers)
      } else {
        setAvailableCoupons([])
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
      setAvailableCoupons([])
    } finally {
      setLoadingCoupons(false)
    }
  }

  // Calculate discount based on coupon
  const calculateDiscount = (coupon, subtotal) => {
    if (!coupon) return 0

    // Check minimum purchase amount
    if (coupon.minPurchaseAmount && subtotal < coupon.minPurchaseAmount) {
      return 0
    }

    let discount = 0
    if (coupon.type === 'flat') {
      discount = coupon.value
    } else if (coupon.type === 'percentage') {
      discount = (subtotal * coupon.value) / 100
      // Apply max discount limit if set
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount
      }
    }

    // Ensure discount doesn't exceed subtotal
    return Math.min(discount, subtotal)
  }

  // Handle coupon selection
  const handleCouponSelect = (coupon) => {
    const discount = calculateDiscount(coupon, total)
    setAppliedCoupon(coupon)
    setDiscountAmount(discount)
    setShowCouponCanvas(false)
  }

  // Remove applied coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setDiscountAmount(0)
  }

  // Handle payment process - Supports multiple gateways via backend
  const handleProceedToPay = async () => {
    if (processingPayment) return

    // Check if user is authenticated before proceeding
    if (!isAuthenticated) {
      // Save booking data to sessionStorage so we can restore it after login
      if (bookingData) {
        sessionStorage.setItem('bookingData', JSON.stringify(bookingData))
        sessionStorage.setItem('bookingPath', location.pathname)
      }
      // Redirect to login page
      navigate('/login', {
        state: {
          from: location.pathname,
          message: 'Please login to proceed with payment'
        }
      })
      return
    }

    setProcessingPayment(true)
    try {
      // Prepare booking data
      const tickets = Object.entries(selectedTickets).map(([ticketId, quantity]) => ({
        ticketTypeId: ticketId,
        quantity: quantity
      }))

      // Get affiliate code from sessionStorage if available
      let affiliateCode = null
      const storedAffiliateCode = sessionStorage.getItem('affiliateCode')
      const storedAffiliateEventId = sessionStorage.getItem('affiliateEventId')

      if (storedAffiliateCode && String(storedAffiliateEventId) === String(event?._id)) {
        affiliateCode = storedAffiliateCode
      } else {
        const eventIdStr = String(event?._id)
        const eventSpecificKey = `affiliate_${eventIdStr}`
        const eventSpecificCode = sessionStorage.getItem(eventSpecificKey)
        if (eventSpecificCode) {
          affiliateCode = eventSpecificCode
        }
      }

      const bookingDataPayload = {
        eventId: event._id,
        slotId: selectedTime._id,
        tickets: tickets,
        offerCode: appliedCoupon?.code || null,
        affiliateCode: affiliateCode || null
      }

      // Step 1: Create Order on Backend
      const orderResponse = await api.post('/users/payments/create-order', {
        bookingData: bookingDataPayload,
        amount: finalAmount
      })

      const { status, result, message } = orderResponse.data
      if (!result || (status !== 200 && status !== 201)) {
        throw new Error(message || 'Failed to create payment order')
      }

      const { gateway, orderData, bookingId, keyId, isTestMode } = result

      // If amount is 0 (free tickets), it should have been handled by create-order 
      // but let's handle the direct storage if needed or if backend returns success without gateway
      if (!gateway || finalAmount === 0) {
        // Assume successful booking if no gateway required
        toast.success('Your booking is confirmed!', 'Booking Confirmed')
        setTimeout(() => {
          navigate(`/bookings/${bookingId}/confirmation`, {
            state: { booking: result.booking, event: event }
          })
        }, 1500)
        return
      }

      if (gateway === 'razorpay') {
        if (!window.Razorpay) {
          throw new Error('Razorpay payment gateway is not loaded. Please refresh the page.')
        }

        const options = {
          key: keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Easy Tickets',
          description: `Payment for ${event.title}`,
          order_id: orderData.id,
          handler: async function (response) {
            try {
              const storeResponse = await api.post('/users/payments/store', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: bookingId,
                amount: finalAmount,
                gateway: 'razorpay'
              })

              if (storeResponse.data?.status === 200) {
                toast.success('Payment successful! Your booking is confirmed.', 'Booking Confirmed')
                setTimeout(() => {
                  const confirmedBooking = storeResponse.data.result.booking
                  navigate(`/bookings/${confirmedBooking._id || confirmedBooking.bookingId}/confirmation`, {
                    state: { booking: confirmedBooking, event: event }
                  })
                }, 1500)
              } else {
                throw new Error(storeResponse.data?.message || 'Failed to verify payment')
              }
            } catch (error) {
              console.error('Error verifying payment:', error)
              toast.error(error.response?.data?.message || error.message || 'Payment verification failed', 'Payment Error')
              setProcessingPayment(false)
            }
          },
          prefill: {
            name: '',
            email: '',
            contact: ''
          },
          modal: {
            ondismiss: function() {
              setProcessingPayment(false)
            }
          }
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else if (gateway === 'cashfree') {
        if (!window.Cashfree) {
          throw new Error('Cashfree payment gateway is not loaded. Please refresh the page.')
        }

        const cashfree = window.Cashfree({
          mode: isTestMode ? 'sandbox' : 'production'
        })

        const checkoutOptions = {
          paymentSessionId: orderData.payment_session_id,
          redirectTarget: '_self' // Or '_modal' for modal-based flow if supported/desired
        }

        // For Cashfree, we usually redirect or use their SDK to open a component
        // Note: The backend storePayment will handle the callback/verification
        cashfree.checkout(checkoutOptions).then((result) => {
          if (result.error) {
            console.error('Cashfree error:', result.error)
            toast.error(result.error.message, 'Payment Error')
            setProcessingPayment(false)
          }
          if (result.redirect) {
            console.log('Redirecting to payment page...')
          }
        })
      }
    } catch (error) {
      console.error('Payment process error:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to process payment. Please try again.', 'Payment Error')
      setProcessingPayment(false)
    }
  }

  const ticketTypes = getTicketTypes()
  
  // Priority: eventDetailImage > eventImages[0] > banners[0]
  let bannerImage = 'https://via.placeholder.com/800x600?text=Event+Image'
  if (event.eventDetailImage) {
    bannerImage = getImageUrl(event.eventDetailImage)
  } else if (event.eventImages && event.eventImages.length > 0) {
    bannerImage = getImageUrl(event.eventImages[0])
  } else if (event.banners && event.banners.length > 0) {
    bannerImage = getImageUrl(event.banners[0])
  }
  
  const totalTickets = getTotalTickets()
  const finalAmount = total - discountAmount

  const formatDuration = (hours) => {
    if (!hours) return ''
    if (hours < 1) return `${Math.round(hours * 60)} minutes`
    if (hours === 1) return '1 hour'
    return `${hours} hours`
  }

  // Strip HTML tags from description
  const stripHtml = (html) => {
    if (!html) return ''
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  // Get organizer name
  const getOrganizerName = () => {
    if (!event?.organizer) return null
    if (typeof event.organizer.organizerId === 'object' && event.organizer.organizerId?.name) {
      return event.organizer.organizerId.name
    }
    return event.organizer.name || null
  }

  // Get organizer contact
  const getOrganizerContact = () => {
    if (!event?.organizer) return null
    if (typeof event.organizer.organizerId === 'object') {
      return event.organizer.organizerId.mobile || event.organizer.organizerId.email || event.organizer.contactInfo || null
    }
    return event.organizer.contactInfo || null
  }

  // Get organizer email
  const getOrganizerEmail = () => {
    if (!event?.organizer) return null
    if (typeof event.organizer.organizerId === 'object' && event.organizer.organizerId?.email) {
      return event.organizer.organizerId.email
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="py-4 sm:py-6 lg:py-8 pb-4 sm:pb-6 lg:pb-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => navigate(getEventDetailPath(bookingData?.event || id, organizerSlug) + '/booking-flow', {
                state: bookingData
              })}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </button>
          </div>

        {/* Desktop: Single Card Layout | Mobile: Separate Sections */}
        <div className="lg:bg-white lg:dark:bg-gray-800 lg:rounded-2xl lg:shadow-xl lg:border lg:border-gray-200 lg:dark:border-gray-700 lg:overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-0">
            {/* Left Column - Event Details */}
            <div className="lg:col-span-3 space-y-4 sm:space-y-6 lg:p-6 lg:border-r lg:border-gray-200 lg:dark:border-gray-700">
              {/* Event Title - Mobile only */}
              <div className="md:hidden">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white break-words">
                  {event.title}
                </h1>
              </div>

              {/* Event Image and Details Side by Side */}
              <div className="grid grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                {/* Event Image - Left Side */}
                <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 shadow-xl group col-span-2">
                  <img
                    src={bannerImage}
                    alt={event.title}
                    className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/800x600?text=Event+Image'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>

                {/* Event Details Beside Image - Right Side */}
                <div className="flex flex-col space-y-2 md:space-y-4 col-span-3">
                  {/* Event Title - Desktop only (on right side) */}
                  <div className="hidden md:block lg:pt-0">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                      {event.title}
                    </h1>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <span className="break-words">{selectedVenue.fullAddress}</span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <span>{formatDate(selectedDate)}</span>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <span>{formatTime(selectedTime.startTime)}</span>
                  </div>

                  {/* Duration */}
                  {event.duration && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Clock className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      <span>Duration: {formatDuration(event.duration)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Event Details */}
              <div className="hidden lg:block space-y-4 sm:space-y-5 pt-4 sm:pt-5 border-t border-gray-200 dark:border-gray-700">
                {/* Event Description */}
                {event.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      About Event
                    </h3>
                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {showFullDescription ? (
                        <div dangerouslySetInnerHTML={{ __html: event.description }} />
                      ) : (
                        <p className="line-clamp-4">{stripHtml(event.description)}</p>
                      )}
                      {stripHtml(event.description).length > 200 && (
                        <button
                          onClick={() => setShowFullDescription(!showFullDescription)}
                          className="mt-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-xs font-medium"
                        >
                          {showFullDescription ? 'Show Less' : 'Read More'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-2">
              <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:rounded-none lg:shadow-none lg:border-0 lg:sticky  lg:h-[calc(100vh-8rem)] lg:flex lg:flex-col lg:p-0 lg:pt-0 lg:px-0 lg:pb-0">
              <div className="lg:px-6 lg:pt-6 lg:pb-6 lg:flex lg:flex-col lg:flex-1">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4 sm:mb-5 uppercase border-b border-gray-300 dark:border-gray-600 pb-3 sm:pb-4">
                ORDER SUMMARY
              </h2>

              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-5 lg:mb-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                    {totalTickets} Ticket{totalTickets > 1 ? 's' : ''}
                  </p>
                  {/* E Ticket Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg">
                    <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-[10px] sm:text-xs font-semibold">E Ticket</span>
                  </div>
                </div>
                <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white break-words">
                  {event.title}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">
                  {selectedVenue.fullAddress}
                </p>

                {/* Apply Coupon Section */}
                <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  {appliedCoupon ? (
                    <div className="p-2.5 sm:p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-green-900 dark:text-green-100">
                              {appliedCoupon.code || appliedCoupon.title}
                            </p>
                            <p className="text-[10px] sm:text-xs text-green-700 dark:text-green-300">
                              ₹ {discountAmount.toLocaleString('en-IN')} off
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="p-1 sm:p-1.5 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-colors"
                          aria-label="Remove coupon"
                        >
                          <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCouponCanvas(true)}
                      className="w-full flex items-center gap-2 p-2.5 sm:p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
                      <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                        Apply Coupon
                      </span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{formatDate(selectedDate)}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{formatTime(selectedTime.startTime)}</span>
                  </div>
                </div>
              </div>

              {/* Ticket Breakdown */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4 mb-3 sm:mb-4 lg:mb-4 lg:flex-1 lg:overflow-y-auto">
                <div className="space-y-2.5">
                  {Object.entries(selectedTickets).map(([ticketId, quantity]) => {
                    const ticket = ticketTypes.find(t => t._id === ticketId)
                    if (!ticket) return null
                    return (
                      <div key={ticketId} className="flex items-center justify-between text-xs sm:text-sm py-1.5">
                        <span className="text-gray-700 dark:text-gray-300 break-words pr-2">
                          {ticket.title} <span className="text-gray-500 dark:text-gray-500">(₹ {ticket.price.toLocaleString('en-IN')} × {quantity})</span>
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white flex-shrink-0">
                          ₹ {(ticket.price * quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4 mb-3 sm:mb-4 lg:mb-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                      Subtotal
                    </span>
                    <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                      ₹ {total.toLocaleString('en-IN')}
                    </span>
                  </div>
                  {appliedCoupon && discountAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words pr-2">
                        Discount ({appliedCoupon.code || appliedCoupon.title})
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 flex-shrink-0">
                        - ₹ {discountAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Amount Payable Box */}
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg p-3 sm:p-3.5 mb-3 sm:mb-4 lg:mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm sm:text-base font-semibold text-primary-900 dark:text-primary-100">
                    Amount Payable
                  </span>
                  <span className="text-base sm:text-lg font-bold text-primary-600 dark:text-primary-400">
                    ₹ {finalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Proceed to Pay Button - Desktop always, Mobile only when sticky footer is hidden */}
              <button 
                onClick={handleProceedToPay}
                disabled={processingPayment || finalAmount <= 0}
                className={`w-full py-3 sm:py-3.5 px-4 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white font-bold text-sm sm:text-base rounded-lg transition-all duration-200 uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl ${showStickyButton ? 'hidden lg:flex' : 'flex'}`}
              >
                {processingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  'PROCEED TO PAY'
                )}
              </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      </div>

      {/* Sticky Mobile Proceed to Pay Button */}
      {bookingData && (
        <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 ease-in-out ${
          showStickyButton 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 translate-y-full pointer-events-none'
        }`}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              {/* Amount Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Amount Payable:
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-primary-600 dark:text-primary-400">
                    ₹ {finalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Proceed to Pay Button */}
              <button 
                onClick={handleProceedToPay}
                disabled={processingPayment || finalAmount <= 0}
                className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white font-bold py-2.5 px-6 rounded-lg transition-colors uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 text-sm sm:text-base"
              >
                {processingPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  'PROCEED TO PAY'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Modal - Mobile: Bottom Modal, Desktop: Side Canvas */}
      {showCouponCanvas && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity md:z-40"
            onClick={() => setShowCouponCanvas(false)}
            style={{ backdropFilter: 'blur(8px)' }}
          />
          {/* Mobile: Bottom Modal, Desktop: Side Canvas */}
          <div className="fixed bottom-0 left-0 right-0 md:right-0 md:left-auto md:top-0 h-[70vh] max-h-[70vh] md:h-full md:max-h-full w-full md:w-full md:max-w-md bg-white dark:bg-gray-800 shadow-2xl z-[101] md:z-50 transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col rounded-t-2xl md:rounded-none animate-slide-up md:animate-none" style={{ margin: 0, padding: 0 }}>
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 dark:text-primary-400" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Available Coupons
                </h2>
              </div>
              <button
                onClick={() => setShowCouponCanvas(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:p-6" style={{ minHeight: 0 }}>
              {!isAuthenticated ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4">
                    <Tag className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Login Required
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
                    Please login to view and apply available coupons for this event.
                  </p>
                  <button
                    onClick={() => {
                      // Store booking data in sessionStorage to preserve it
                      if (bookingData) {
                        sessionStorage.setItem('bookingData', JSON.stringify(bookingData))
                        sessionStorage.setItem('bookingPath', location.pathname)
                      }
                      // Close canvas and redirect to login
                      setShowCouponCanvas(false)
                      navigate('/login', {
                        state: {
                          from: location.pathname,
                          message: 'Please login to apply coupons'
                        }
                      })
                    }}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
                  >
                    Login Now
                  </button>
                </div>
              ) : loadingCoupons ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : availableCoupons.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <Tag className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">
                    No coupons available
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-2">
                    There are no active coupons for this event at the moment.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {availableCoupons.map((coupon) => {
                    const discount = calculateDiscount(coupon, total)
                    const meetsMinAmount = !coupon.minPurchaseAmount || total >= coupon.minPurchaseAmount
                    const isApplicableByAmount = discount > 0 && meetsMinAmount
                    // Disable if backend says coupon is not available (already used by this user)
                    const isAvailable = coupon.isAvailable !== false
                    const isButtonEnabled = isAvailable && isApplicableByAmount

                    return (
                      <button
                        key={coupon._id}
                        onClick={() => isButtonEnabled && handleCouponSelect(coupon)}
                        disabled={!isButtonEnabled}
                        className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all ${
                          isButtonEnabled
                            ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 hover:border-primary-500 dark:hover:border-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30 cursor-pointer'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 sm:gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white break-words">
                                {coupon.code || coupon.title}
                              </h3>
                              {coupon.code && (
                                <span className="px-1.5 sm:px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-[10px] sm:text-xs font-semibold rounded">
                                  {coupon.code}
                                </span>
                              )}
                            </div>
                            {coupon.description && (
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 break-words">
                                {coupon.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                              {coupon.type === 'flat' ? (
                                <span className="font-semibold text-primary-600 dark:text-primary-400">
                                  ₹ {coupon.value.toLocaleString('en-IN')} OFF
                                </span>
                              ) : (
                                <span className="font-semibold text-primary-600 dark:text-primary-400">
                                  {coupon.value}% OFF
                                  {coupon.maxDiscount && ` (Max ₹ ${coupon.maxDiscount.toLocaleString('en-IN')})`}
                                </span>
                              )}
                              {coupon.minPurchaseAmount > 0 && (
                                <span className="break-words">Min. purchase: ₹ {coupon.minPurchaseAmount.toLocaleString('en-IN')}</span>
                              )}
                            </div>
                            {isButtonEnabled && (
                              <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                                You save ₹ {discount.toLocaleString('en-IN')}
                              </p>
                            )}
                            {/* Show message if user has already used this coupon */}
                            {!isAvailable && (
                              <p className="text-[10px] sm:text-xs text-[#eb4e62] dark:text-[#eb4e62] mt-2 break-words">
                                You have already used this coupon.
                              </p>
                            )}
                            {/* Show message if order total is below minimum amount */}
                            {isAvailable && !isApplicableByAmount && coupon.minPurchaseAmount > 0 && total < coupon.minPurchaseAmount && (
                              <p className="text-[10px] sm:text-xs text-[#eb4e62] dark:text-[#eb4e62] mt-2 break-words">
                                Add ₹ {(coupon.minPurchaseAmount - total).toLocaleString('en-IN')} more to apply
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default BookingSummary

