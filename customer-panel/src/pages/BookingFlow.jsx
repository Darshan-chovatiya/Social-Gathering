import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Ticket, 
  ChevronLeft, 
  X,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Globe,
  Home,
  ChevronRight
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import Loading from '../components/common/Loading'
import EmptyState from '../components/common/EmptyState'
import Header from '../components/layout/Header'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../components/common/ToastContainer'
import { getEventDetailPath } from '../utils/eventUrl'

const BookingFlow = () => {
  const { id, organizerSlug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processingFreeBooking, setProcessingFreeBooking] = useState(false)
  
  // Booking state
  const [currentStep, setCurrentStep] = useState(() => {
    // If coming from booking summary, start at step 3
    return location.state?.selectedTickets ? 3 : 1
  }) // 1: Venue, 2: Date & Time, 3: Tickets
  const [selectedVenue, setSelectedVenue] = useState(location.state?.selectedVenue || null)
  const [selectedDate, setSelectedDate] = useState(location.state?.selectedDate ? new Date(location.state.selectedDate) : null)
  const [selectedTime, setSelectedTime] = useState(location.state?.selectedTime || null)
  const [selectedTickets, setSelectedTickets] = useState(location.state?.selectedTickets || {}) // { ticketId: quantity }
  const [expandedDescription, setExpandedDescription] = useState(null) // Track which ticket's description is expanded
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [availabilityError, setAvailabilityError] = useState(null)
  const [bookedFreeTicketTypeIds, setBookedFreeTicketTypeIds] = useState([]) // Array of booked free ticket type IDs
  const [checkingFreeBooking, setCheckingFreeBooking] = useState(false)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/users/events/${id}`)
        const data = await response.json()
        
        if (data.status === 200 && data.result?.event) {
          const eventData = data.result.event
          setEvent(eventData)
          
          // Auto-select first venue if available
          if (eventData.address) {
            setSelectedVenue({
              city: eventData.address.city,
              fullAddress: eventData.address.fullAddress || 
                `${eventData.address.street || ''}, ${eventData.address.landmark || ''}, ${eventData.address.city}, ${eventData.address.state} ${eventData.address.pincode}`.trim()
            })
          }
        } else {
          setError('Event not found')
        }
      } catch (err) {
        console.error('Error fetching event:', err)
        setError('Failed to load event details')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchEvent()
    }
  }, [id, API_BASE_URL])

  const getImageUrl = (bannerPath) => {
    if (!bannerPath) return ''
    if (bannerPath.startsWith('http')) return bannerPath
    const baseUrl = API_BASE_URL.replace('/api', '')
    return `${baseUrl}${bannerPath}`
  }

  const getAllSlots = () => {
    if (!event?.slots || event.slots.length === 0) return []
    return event.slots
      .filter(slot => slot.isActive)
      .map(slot => ({
        ...slot,
        date: new Date(slot.date)
      }))
      .sort((a, b) => a.date - b.date)
  }

  const getUniqueDates = () => {
    const slots = getAllSlots()
    const dates = [...new Set(slots.map(slot => slot.date.toISOString().split('T')[0]))]
    return dates.map(date => new Date(date))
  }

  const getSlotsForDate = (date) => {
    const slots = getAllSlots()
    const dateStr = date.toISOString().split('T')[0]
    return slots.filter(slot => slot.date.toISOString().split('T')[0] === dateStr)
  }

  const getTicketTypes = () => {
    if (!event?.ticketTypes) return []
    // Show all active tickets, even if availableQuantity is 0
    return event.ticketTypes.filter(ticket => ticket.isActive)
  }

  const formatDate = (date) => {
    if (!date) return ''
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    const dayName = days[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]
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

  const formatDuration = (hours) => {
    if (!hours) return ''
    if (hours < 1) return `${Math.round(hours * 60)} minutes`
    if (hours === 1) return '1 hour'
    return `${hours} hours`
  }

  // Auto-select first slot if only one slot exists
  useEffect(() => {
    if (!event) return
    
    const slots = getAllSlots()
    
    if (slots.length === 1 && !selectedDate && !selectedTime) {
      const firstSlot = slots[0]
      setSelectedDate(firstSlot.date)
      setSelectedTime(firstSlot)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event])

  // Auto-expand first ticket description when entering tickets section
  useEffect(() => {
    if (currentStep === 3 && event && !expandedDescription) {
      const tickets = getTicketTypes()
      const firstTicketWithDescription = tickets.find(ticket => 
        ticket.description && ticket.description.trim().length > 0
      )
      if (firstTicketWithDescription) {
        setExpandedDescription(firstTicketWithDescription._id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, event])

  // Check which specific free ticket types user has already booked for this event
  useEffect(() => {
    const checkFreeTicketBooking = async () => {
      if (!isAuthenticated || !event?._id) {
        setBookedFreeTicketTypeIds([])
        return
      }

      try {
        setCheckingFreeBooking(true)
        // Fetch user bookings for this event
        const response = await api.get(`/users/bookings?limit=100`)
        
        if (response.data?.status === 200 && response.data?.result?.bookings) {
          const bookings = response.data.result.bookings
          const bookedFreeTicketIds = new Set()
          
          // Check each booking for this event
          bookings.forEach(booking => {
            const eventId = (booking.eventId && typeof booking.eventId === 'object')
              ? booking.eventId._id 
              : booking.eventId
            
            // Check if this booking is for the current event and is confirmed/successful
            if (
              eventId === event._id &&
              (booking.status === 'confirmed' || booking.paymentStatus === 'success')
            ) {
              // Check each ticket in the booking
              if (booking.tickets && Array.isArray(booking.tickets)) {
                booking.tickets.forEach(ticket => {
                  if (!ticket || !ticket.ticketTypeId) return
                  
                  // Find the ticket type to check if it's free (price = 0)
                  const ticketType = event?.ticketTypes?.find(
                    tt => (tt?._id?.toString() === ticket.ticketTypeId?.toString()) ||
                    (tt?._id === ticket.ticketTypeId)
                  )
                  
                  // If this ticket type is free (price = 0), add it to booked list
                  if (ticketType && ticketType.price === 0) {
                    const ticketTypeIdStr = ticketType._id?.toString() || ticket.ticketTypeId?.toString()
                    if (ticketTypeIdStr) {
                      bookedFreeTicketIds.add(ticketTypeIdStr)
                    }
                  }
                })
              }
            }
          })
          
          setBookedFreeTicketTypeIds(Array.from(bookedFreeTicketIds))
          
          // Remove any booked free tickets from current selection
          if (bookedFreeTicketIds.size > 0 && event?.ticketTypes) {
            setSelectedTickets(prev => {
              const updated = { ...prev }
              
              event.ticketTypes.forEach(ticket => {
                const ticketIdStr = ticket._id?.toString()
                if (ticket.isActive && ticket.price === 0 && bookedFreeTicketIds.has(ticketIdStr) && updated[ticket._id]) {
                  delete updated[ticket._id]
                }
              })
              
              return updated
            })
          }
        }
      } catch (error) {
        console.error('Error checking free ticket booking:', error)
        // Don't block the user if there's an error checking
        setBookedFreeTicketTypeIds([])
      } finally {
        setCheckingFreeBooking(false)
      }
    }

    checkFreeTicketBooking()
  }, [isAuthenticated, event?._id, event?.ticketTypes])


  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setSelectedTime(null) // Reset time when date changes
  }

  const handleTicketQuantity = (ticketId, change) => {
    // Clear availability error when user changes ticket selection
    if (availabilityError) {
      setAvailabilityError(null)
    }
    
    setSelectedTickets(prev => {
      const currentQty = prev[ticketId] || 0
      const ticket = getTicketTypes().find(t => t._id === ticketId)
      
      if (!ticket) return prev
      
      // Check if this specific free ticket type has been booked
      const ticketIdStr = ticket._id?.toString()
      const isThisFreeTicketBooked = ticket.price === 0 && bookedFreeTicketTypeIds.includes(ticketIdStr)
      
      // Prevent adding free tickets if this specific ticket type has been booked
      if (isThisFreeTicketBooked && change > 0) {
        return prev
      }
      
      // Prevent adding tickets if availableQuantity is 0 or less
      if (ticket.availableQuantity <= 0 && change > 0) {
        return prev
      }
      
      // For free tickets (price = 0), limit to maximum 1 ticket
      const maxQuantity = ticket.price === 0 ? 1 : ticket.availableQuantity
      
      const newQty = Math.max(0, Math.min(maxQuantity, currentQty + change))
      
      if (newQty === 0) {
        const updated = { ...prev }
        delete updated[ticketId]
        return updated
      }
      
      return { ...prev, [ticketId]: newQty }
    })
  }

  const calculateTotal = () => {
    let total = 0
    Object.entries(selectedTickets).forEach(([ticketId, quantity]) => {
      const ticket = getTicketTypes().find(t => t._id === ticketId)
      if (ticket) {
        total += ticket.price * quantity
      }
    })
    return total
  }

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0)
  }

  const validateTicketAvailability = async () => {
    try {
      setCheckingAvailability(true)
      setAvailabilityError(null)
      
      // Fetch latest event data
      const response = await fetch(`${API_BASE_URL}/users/events/${id}`)
      const data = await response.json()
      
      if (data.status !== 200 || !data.result?.event) {
        throw new Error('Failed to fetch latest event data')
      }
      
      const latestEvent = data.result.event
      const unavailableTickets = []
      
      // Check each selected ticket
      for (const [ticketId, quantity] of Object.entries(selectedTickets)) {
        const latestTicket = latestEvent.ticketTypes.find(t => t._id === ticketId)
        
        if (!latestTicket || !latestTicket.isActive) {
          unavailableTickets.push({
            ticketId,
            ticketTitle: latestTicket?.title || 'Unknown Ticket',
            reason: 'Ticket type no longer available'
          })
        } else if (latestTicket.availableQuantity < quantity) {
          unavailableTickets.push({
            ticketId,
            ticketTitle: latestTicket.title,
            reason: `Only ${latestTicket.availableQuantity} ticket(s) available, but ${quantity} requested`
          })
        }
      }
      
      if (unavailableTickets.length > 0) {
        const errorMessages = unavailableTickets.map(t => 
          `${t.ticketTitle}: ${t.reason}`
        ).join('\n')
        
        setAvailabilityError(errorMessages)
        return false
      }
      
      // Update event data with latest information
      setEvent(latestEvent)
      return true
      
    } catch (err) {
      console.error('Error validating availability:', err)
      setAvailabilityError('Failed to check ticket availability. Please try again.')
      return false
    } finally {
      setCheckingAvailability(false)
    }
  }

  const handleNext = async () => {
    if (currentStep === 1 && selectedVenue) {
      // Skip step 2 if there's only one slot
      if (hasOnlyOneSlot) {
        setCurrentStep(3)
      } else {
        setCurrentStep(2)
      }
    } else if (currentStep === 2 && selectedDate && selectedTime) {
      setCurrentStep(3)
    } else if (currentStep === 3 && Object.keys(selectedTickets).length > 0) {
      // Validate availability before proceeding
      const isAvailable = await validateTicketAvailability()
      
      if (!isAvailable) {
        // Don't navigate - error message will be shown
        return
      }
      
      // Check if all selected tickets are free (price = 0)
      const allTicketsFree = Object.entries(selectedTickets).every(([ticketId]) => {
        const ticket = getTicketTypes().find(t => t._id === ticketId)
        return ticket && ticket.price === 0
      })
      
      // If all tickets are free, directly create booking and navigate to confirmation
      if (allTicketsFree) {
        // Check if user is authenticated
        if (!isAuthenticated) {
          // Save booking data to sessionStorage so we can restore it after login
          sessionStorage.setItem('bookingData', JSON.stringify({
            event,
            selectedVenue,
            selectedDate,
            selectedTime,
            selectedTickets,
            total: 0
          }))
          sessionStorage.setItem('bookingPath', `/events/${id}/booking-flow`)
          // Redirect to login page
          navigate('/login', {
            state: {
              from: `/events/${id}/booking-flow`,
              message: 'Please login to complete your free booking'
            }
          })
          return
        }
        
        // Directly create booking for free tickets
        setProcessingFreeBooking(true)
        try {
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
            offerCode: null,
            affiliateCode: affiliateCode || null
          }

          // Create booking directly without payment
          const storeResponse = await api.post('/users/payments/store', {
            bookingData: bookingDataPayload,
            razorpay_order_id: null,
            razorpay_payment_id: null,
            razorpay_signature: null,
            amount: 0,
            paymentMethod: 'free'
          })

          if (storeResponse.data?.result) {
            // Clear affiliate code from sessionStorage after successful booking
            sessionStorage.removeItem('affiliateCode')
            sessionStorage.removeItem('affiliateEventId')
            if (event._id) {
              sessionStorage.removeItem(`affiliate_${event._id}`)
            }
            
            // Show success toast
            toast.success('Your booking is confirmed!', 'Booking Confirmed')

            // Navigate to confirmation page
            setTimeout(() => {
              const confirmedBooking = storeResponse.data.result.booking
              navigate(`/bookings/${confirmedBooking._id || confirmedBooking.bookingId}/confirmation`, {
                state: {
                  booking: confirmedBooking,
                  event: event
                }
              })
            }, 1500)
          } else {
            throw new Error('Failed to create booking')
          }
        } catch (error) {
          console.error('Error creating free booking:', error)
          toast.error(error.response?.data?.message || error.message || 'Failed to create booking. Please try again.', 'Booking Error')
          setProcessingFreeBooking(false)
        }
        return
      }
      
      // For paid tickets, navigate to booking summary
      navigate(getEventDetailPath(event || id, organizerSlug) + '/booking-summary', {
        state: {
          event,
          selectedVenue,
          selectedDate,
          selectedTime,
          selectedTickets,
          total: calculateTotal()
        }
      })
    }
  }

  const handlePrevious = () => {
    if (currentStep === 3) {
      // If coming from tickets, go back to step 2 only if multiple slots exist
      if (hasOnlyOneSlot) {
        setCurrentStep(1)
      } else {
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      setCurrentStep(1)
    } else {
      navigate(getEventDetailPath(event || id, organizerSlug))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="flex items-center justify-center py-12">
          <Loading size="lg" text="Loading booking..." />
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="py-6 sm:py-8 lg:py-12">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
            <EmptyState
              icon={Ticket}
              title="Event Not Found"
              message={error || "The event you're looking for doesn't exist."}
            />
          </div>
        </div>
      </div>
    )
  }
  
  const allSlots = getAllSlots()
  const uniqueDates = getUniqueDates()
  const slotsForSelectedDate = selectedDate ? getSlotsForDate(selectedDate) : []
  const ticketTypes = getTicketTypes()
  const totalAmount = calculateTotal()
  const totalTickets = getTotalTickets()
  
  // Check if there's only one slot (one date and one time)
  const hasOnlyOneSlot = allSlots.length === 1

  // Get organizer branding (name and logo from organizer data)
  const getOrganizerBranding = () => {
    if (!event?.organizer) return null
    
    const organizer = event.organizer.organizerId
    const organizerName = typeof organizer === 'object' && organizer.name 
      ? organizer.name 
      : (event.organizer.name || 'Organizer')
    const organizerLogo = typeof organizer === 'object' && organizer.profilePicture 
      ? organizer.profilePicture 
      : null
    
    return {
      name: organizerName,
      logo: organizerLogo
    }
  }

  const organizerBranding = getOrganizerBranding()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      {/* Breadcrumbs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <nav className="flex items-center gap-2 text-sm">
            <NavLink
              to="/"
              className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </NavLink>
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            <span className="text-gray-900 dark:text-white font-medium">Booking Flow</span>
          </nav>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center justify-center overflow-x-auto">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Step 1: Venue */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 ${
                  currentStep >= 1 ? 'bg-primary-500 text-gray-900' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${currentStep >= 1 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  Venue
                </span>
              </div>

              {/* Show Date & Time step only if multiple slots exist */}
              {!hasOnlyOneSlot && (
                <>
                  <div className={`w-8 sm:w-12 h-0.5 ${currentStep >= 2 ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>

                  {/* Step 2: Date & Time */}
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 ${
                      currentStep >= 2 ? 'bg-primary-500 text-gray-900' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${currentStep >= 2 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      Date & Time
                    </span>
                  </div>
                </>
              )}

              <div className={`w-8 sm:w-12 h-0.5 ${currentStep >= 3 ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>

              {/* Step 3: Tickets */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 ${
                  currentStep >= 3 ? 'bg-primary-500 text-gray-900' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <span className={`text-xs sm:text-sm font-medium whitespace-nowrap ${currentStep >= 3 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  Tickets
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 pb-24 sm:pb-6">
        {/* Step 1: Venue Selection */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {event.address?.city?.toUpperCase() || 'SELECT VENUE'}
            </h2>
            
            {selectedVenue && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-primary-200 dark:border-primary-700 p-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                      {event.title}
                    </h3>
                    {hasOnlyOneSlot && allSlots.length > 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {formatDate(allSlots[0].date)} | {allSlots[0].startTime && formatTime(allSlots[0].startTime)} | {formatDuration(event.duration)}
                      </p>
                    )}
                    {!hasOnlyOneSlot && allSlots.length > 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {formatDate(allSlots[0].date)} | {formatDuration(event.duration)}
                      </p>
                    )}
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedVenue.fullAddress}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date & Time Selection - Only show if multiple slots exist */}
        {currentStep === 2 && !hasOnlyOneSlot && (
          <div className="space-y-6">
            {/* Select Date */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
                Select Date
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {uniqueDates.map((date, index) => (
                  <button
                    key={index}
                    onClick={() => handleDateSelect(date)}
                    className={`py-2.5 px-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                      selectedDate?.toISOString().split('T')[0] === date.toISOString().split('T')[0]
                        ? 'bg-primary-500 border-primary-600 text-gray-900'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:border-primary-500'
                    }`}
                  >
                    {formatDate(date)}
                  </button>
                ))}
              </div>
            </div>

            {/* Select Time */}
            {selectedDate && slotsForSelectedDate.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
                  Select Time
                </h2>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {slotsForSelectedDate.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedTime(slot)}
                      className={`py-2.5 px-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                        selectedTime?._id === slot._id
                          ? 'bg-primary-500 border-primary-600 text-gray-900'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:border-primary-500'
                      }`}
                    >
                      {formatTime(slot.startTime)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Ticket Selection */}
        {currentStep === 3 && (
          <div className="space-y-3">
            {/* Availability Error Message */}
            {availabilityError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                      Ticket Availability Issue
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-line">
                      {availabilityError}
                    </p>
                    <button
                      onClick={() => {
                        setAvailabilityError(null)
                        // Reload event data
                        const fetchEvent = async () => {
                          try {
                            const response = await fetch(`${API_BASE_URL}/users/events/${id}`)
                            const data = await response.json()
                            if (data.status === 200 && data.result?.event) {
                              setEvent(data.result.event)
                            }
                          } catch (err) {
                            console.error('Error fetching event:', err)
                          }
                        }
                        fetchEvent()
                      }}
                      className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium underline"
                    >
                      Refresh and try again
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {ticketTypes.map((ticket) => {
              const quantity = selectedTickets[ticket._id] || 0
              const isSoldOut = ticket.availableQuantity <= 0
              const isDescriptionExpanded = expandedDescription === ticket._id
              const hasDescription = ticket.description && ticket.description.trim().length > 0
              const isFreeTicket = ticket.price === 0
              const ticketIdStr = ticket._id?.toString()
              // Check if THIS SPECIFIC free ticket type has been booked
              const isFreeTicketDisabled = isFreeTicket && bookedFreeTicketTypeIds.includes(ticketIdStr)
              
              return (
                <div
                  key={ticket._id}
                  className={`bg-white dark:bg-gray-800 rounded-lg border p-4 ${
                    isSoldOut || isFreeTicketDisabled
                      ? 'border-gray-300 dark:border-gray-600 opacity-60' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className={`text-base font-bold ${
                          isSoldOut || isFreeTicketDisabled
                            ? 'text-gray-500 dark:text-gray-500' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {ticket.title}
                        </h3>
                        {isFreeTicketDisabled && (
                          <span className="hidden md:inline text-xs text-red-600 dark:text-red-400 font-medium">
                            • You have already booked this free ticket for this event
                          </span>
                        )}
                      </div>
                      <p className={`text-sm mb-1 ${
                        isSoldOut || isFreeTicketDisabled
                          ? 'text-gray-400 dark:text-gray-500' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        ₹ {ticket.price} / person
                      </p>
                      <p className={`text-sm ${
                        isSoldOut || isFreeTicketDisabled
                          ? 'text-gray-400 dark:text-gray-500' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {selectedDate && formatDate(selectedDate)} | {selectedTime && formatTime(selectedTime.startTime)}
                      </p>
                      {quantity > 0 && (
                        <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-2">
                          {quantity} Ticket{quantity > 1 ? 's' : ''} | Total: ₹ {ticket.price * quantity}
                        </p>
                      )}
                      {hasDescription && !isDescriptionExpanded && (
                        <button
                          onClick={() => setExpandedDescription(ticket._id)}
                          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mt-1 font-medium underline cursor-pointer"
                        >
                          Description
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {quantity > 0 ? (
                        <>
                          <button
                            onClick={() => handleTicketQuantity(ticket._id, -1)}
                            disabled={isSoldOut}
                            className="w-8 h-8 rounded-lg border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white w-6 text-center">
                            {quantity}
                          </span>
                          <button
                            onClick={() => handleTicketQuantity(ticket._id, 1)}
                            disabled={(quantity >= ticket.availableQuantity || isSoldOut || isFreeTicketDisabled) || (ticket.price === 0 && quantity >= 1)}
                            className="w-8 h-8 rounded-lg border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleTicketQuantity(ticket._id, 1)}
                          disabled={isSoldOut || isFreeTicketDisabled || (ticket.price === 0 && (selectedTickets[ticket._id] || 0) >= 1)}
                          className="px-5 py-2 bg-primary-500 hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600 text-gray-900 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSoldOut ? 'Sold Out' : isFreeTicketDisabled ? 'Already Booked' : 'Add'}
                        </button>
                      )}
                    </div>
                  </div>
                  {isDescriptionExpanded && hasDescription && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div 
                        className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: ticket.description }}
                      />
                      <button
                        onClick={() => setExpandedDescription(null)}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mt-3 font-medium underline cursor-pointer"
                      >
                        Hide Description
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Total Summary */}
            {totalTickets > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900 dark:text-white">
                    Total: ₹ {totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons - Desktop */}
        <div className="hidden lg:flex items-center justify-between mt-6 gap-2 sm:gap-3">
          <button
            onClick={handlePrevious}
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 sm:py-2.5 border-2 border-primary-600 text-primary-600 dark:text-primary-400 rounded-lg text-xs sm:text-sm font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex-shrink-0 min-w-[80px] sm:min-w-[100px]"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Previous
          </button>
          
          {currentStep === 3 && totalTickets > 0 && (
            <div className="flex-1 text-center min-w-0">
              <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                Total: ₹ {totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          )}

            <button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !selectedVenue) ||
                (currentStep === 2 && (!selectedDate || !selectedTime)) ||
                (currentStep === 3 && (totalTickets === 0 || checkingAvailability || processingFreeBooking))
              }
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2.5 sm:py-2.5 bg-primary-500 hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600 text-gray-900 rounded-lg text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 min-w-[80px] sm:min-w-[100px]"
            >
              {checkingAvailability || processingFreeBooking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{processingFreeBooking ? 'Booking...' : 'Checking...'}</span>
                </>
              ) : (
                <>
                  {currentStep === 3 ? 'Proceed' : 'Next'}
                  {currentStep !== 3 && <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </>
              )}
            </button>
        </div>
      </div>

      {/* Sticky Mobile Navigation Buttons - Always visible on mobile */}
      {event && (
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <button
              onClick={handlePrevious}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 border-2 border-primary-600 text-primary-600 dark:text-primary-400 rounded-lg text-xs sm:text-sm font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex-shrink-0 min-w-[80px]"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Previous
            </button>
            
            {currentStep === 3 && totalTickets > 0 && (
              <div className="flex-1 text-center min-w-0">
                <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                  Total: ₹ {totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <button
              onClick={handleNext}
              disabled={
                (currentStep === 1 && !selectedVenue) ||
                (currentStep === 2 && (!selectedDate || !selectedTime)) ||
                (currentStep === 3 && (totalTickets === 0 || checkingAvailability || processingFreeBooking))
              }
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600 text-gray-900 rounded-lg text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 min-w-[80px]"
            >
              {checkingAvailability || processingFreeBooking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{processingFreeBooking ? 'Booking...' : 'Checking...'}</span>
                </>
              ) : (
                <>
                  {currentStep === 3 ? 'Proceed' : 'Next'}
                  {currentStep !== 3 && <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}

export default BookingFlow

