import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { getEventDetailPath, getOrganizerNameFromEvent, slugify } from '../utils/eventUrl'
import {
    Calendar,
    Clock,
    MapPin,
    Share2,
    Lightbulb,
    Check,
    Info,
    Ticket,
    Headphones,
    ArrowRight,
    ChevronRight,
    ChevronLeft,
    Award,
    Image as ImageIcon,
    X
} from 'lucide-react'
import Loading from '../components/common/Loading'
import EmptyState from '../components/common/EmptyState'

const EventDetail = () => {
    const { id: routeId, organizerSlug } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [event, setEvent] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isTermsOpen, setIsTermsOpen] = useState(true)
    const [isNotesOpen, setIsNotesOpen] = useState(true)
    const [isTermsExpanded, setIsTermsExpanded] = useState(true)
    const [isNotesExpanded, setIsNotesExpanded] = useState(true)
    const [showStickyButton, setShowStickyButton] = useState(true)
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true)
    const [imageError, setImageError] = useState(false)
    const [showBookingCard, setShowBookingCard] = useState(false)

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
    const id = routeId // keep existing variable name usage throughout file

    // Capture affiliate ref parameter from URL and store in sessionStorage
    useEffect(() => {
        // Try to get ref from searchParams first (works for hash routing: #/events/123?ref=ABC)
        let refCode = searchParams.get('ref')
        
        // Fallback: If not found in searchParams, try parsing from window.location.search
        // This handles cases where query params are before the hash (non-standard but sometimes happens)
        if (!refCode) {
            const urlParams = new URLSearchParams(window.location.search)
            refCode = urlParams.get('ref')
        }
        
        if (refCode && id) {
            const normalizedCode = refCode.toUpperCase()
            // Store affiliate code with event ID to ensure it's only used for this event
            sessionStorage.setItem(`affiliate_${id}`, normalizedCode)
            // Also store a general affiliate code for the current session
            sessionStorage.setItem('affiliateCode', normalizedCode)
            sessionStorage.setItem('affiliateEventId', id)
        }
    }, [searchParams, id])

    // Scroll detection for sticky button and booking card
    useEffect(() => {
        if (!event) return

        const handleScroll = () => {
            // For desktop: show booking card after scrolling past hero section
            if (window.innerWidth >= 1024) {
                const heroSection = document.getElementById('desktop-hero-section')
                if (heroSection) {
                    const rect = heroSection.getBoundingClientRect()
                    // Show booking card when hero section bottom is above viewport (scrolled past)
                    setShowBookingCard(rect.bottom <= window.innerHeight - 50)
                } else {
                    // If hero section not found, show booking card
                    setShowBookingCard(true)
                }
                // Always hide sticky button on desktop (it's not used)
                setShowStickyButton(false)
            } else {
                // For mobile: sticky button logic - show when not at bottom of page
                const scrollPosition = window.scrollY + window.innerHeight
                const documentHeight = document.documentElement.scrollHeight
                // Hide sticky button when near bottom of page
                setShowStickyButton(scrollPosition < documentHeight - 50)
            }
        }

        // Check on mount and after a short delay to ensure DOM is ready
        setTimeout(handleScroll, 100)
        window.addEventListener('scroll', handleScroll, { passive: true })
        window.addEventListener('resize', handleScroll, { passive: true })

        return () => {
            window.removeEventListener('scroll', handleScroll)
            window.removeEventListener('resize', handleScroll)
        }
    }, [event])

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                setLoading(true)
                setError(null)
                setEvent(null) // Clear previous event data

                // Special case: route used when there are no events/upcoming events
                // Check if events exist, and if so, redirect to the first one
                if (!id || id === 'not-found') {
                    // First, check if any events exist
                    try {
                        const eventsResponse = await fetch(`${API_BASE_URL}/users/events?limit=10&status=approved`)
                        const eventsData = await eventsResponse.json()
                        
                        if (eventsData.status === 200 && eventsData.result?.events && eventsData.result.events.length > 0) {
                            // Filter events with future slots
                            const now = new Date()
                            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                            
                            const upcomingEvents = eventsData.result.events.filter(event => {
                                if (!event.slots || event.slots.length === 0) return false
                                
                                return event.slots.some(slot => {
                                    if (!slot.isActive || !slot.date || !slot.endTime) return false
                                    
                                    const slotDate = new Date(slot.date)
                                    const slotDay = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate())
                                    
                                    if (slotDay < today) return false
                                    if (slotDay > today) return true
                                    
                                    const [hours, minutes] = slot.endTime.split(':').map(Number)
                                    const slotEndDateTime = new Date(slotDay)
                                    slotEndDateTime.setHours(hours, minutes || 0, 0, 0)
                                    
                                    return slotEndDateTime >= now
                                })
                            })
                            
                            if (upcomingEvents.length > 0) {
                                // Events exist - redirect to the first one but preserve search params
                                const searchStr = searchParams.toString() ? `?${searchParams.toString()}` : ''
                                navigate(getEventDetailPath(upcomingEvents[0]) + searchStr, { replace: true })
                                return
                            }
                        }
                    } catch (eventsErr) {
                        console.error('Error checking for events:', eventsErr)
                    }
                    
                    // No events found - show error message
                    setError('No events available right now. Please check back later.')
                    setLoading(false)
                    return
                }

                const response = await fetch(`${API_BASE_URL}/users/events/${id}`)
                const data = await response.json()

                if (data.status === 200 && data.result?.event) {
                    // Verify the event ID matches (convert to string for comparison)
                    const eventId = String(data.result.event._id)
                    const requestedId = String(id)
                    if (eventId === requestedId) {
                        setEvent(data.result.event)

                        // Normalize URL to /events/:organizerSlug/:id but preserve search params (like ?ref=...)
                        const desiredSlug = slugify(getOrganizerNameFromEvent(data.result.event)) || 'organizer'
                        const searchStr = searchParams.toString() ? `?${searchParams.toString()}` : ''
                        if (desiredSlug && desiredSlug !== organizerSlug) {
                            navigate(getEventDetailPath(data.result.event, desiredSlug) + searchStr, { replace: true })
                        }
                    } else {
                        console.error('Event ID mismatch:', { requested: requestedId, received: eventId })
                        setError('Event ID mismatch')
                    }
                } else {
                    setError(data.message || 'Event not found')
                }
            } catch (err) {
                console.error('Error fetching event:', err)
                setError('Failed to load event details')
            } finally {
                setLoading(false)
            }
        }

        fetchEvent()
    }, [id, organizerSlug, API_BASE_URL, navigate])

    const getImageUrl = (bannerPath) => {
        if (!bannerPath) return ''
        if (bannerPath.startsWith('http')) return bannerPath
        const baseUrl = API_BASE_URL.replace('/api', '')
        return `${baseUrl}${bannerPath}`
    }

    const getEarliestDate = () => {
        if (!event?.slots || event.slots.length === 0) return null
        const dates = event.slots
            .filter(slot => slot.isActive)
            .map(slot => new Date(slot.date))
            .sort((a, b) => a - b)
        return dates[0]
    }

    const getActiveSlots = () => {
        if (!event?.slots || event.slots.length === 0) return []
        return event.slots.filter(slot => slot.isActive)
    }

    const getMinPrice = () => {
        if (!event?.ticketTypes || event.ticketTypes.length === 0) return null
        const prices = event.ticketTypes
            .filter(ticket => ticket.isActive)
            .map(ticket => ticket.price)
        return prices.length > 0 ? Math.min(...prices) : null
    }

    const getMinPriceTicketType = () => {
        if (!event?.ticketTypes || event.ticketTypes.length === 0) return null
        const activeTickets = event.ticketTypes.filter(ticket => ticket.isActive)
        if (activeTickets.length === 0) return null
        const minPrice = Math.min(...activeTickets.map(ticket => ticket.price))
        return activeTickets.find(ticket => ticket.price === minPrice) || null
    }

    const getTicketTypesCount = () => {
        if (!event?.ticketTypes) return 0
        return event.ticketTypes.filter(ticket => ticket.isActive).length
    }

    const formatDate = (date) => {
        if (!date) return 'TBA'
        return new Date(date).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatFullDate = (date) => {
        if (!date) return 'TBA'
        return new Date(date).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const getFullAddress = () => {
        if (!event?.address) return 'Address not available'
        // Use fullAddress if available, otherwise build from parts
        if (event.address.fullAddress) {
            return event.address.fullAddress
        }
        const addr = event.address
        const parts = [
            addr.street,
            addr.landmark,
            addr.city,
            addr.state,
            addr.pincode
        ].filter(Boolean)
        return parts.join(', ')
    }

    const formatTime = (time) => {
        if (!time) return ''
        // If time is in HH:MM format, add AM/PM
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

    const formatDuration = (hours) => {
        if (!hours) return ''
        if (hours < 1) return `${Math.round(hours * 60)} minutes`
        if (hours === 1) return '1 hour'
        return `${hours} hours`
    }

    const getTicketTypes = () => {
        if (!event?.ticketTypes || event.ticketTypes.length === 0) return []
        return event.ticketTypes.filter(ticket => ticket.isActive)
    }

    const handleBookNow = () => {
        // Prefer canonical /events/:organizerSlug/:id when possible
        navigate(getEventDetailPath(event || id, organizerSlug) + '/booking-flow')
    }

    // Strip HTML tags and format text for sharing
    const stripHtmlAndFormat = (html) => {
        if (!html) return ''
        
        // Create a temporary div to parse HTML
        const tmp = document.createElement('DIV')
        tmp.innerHTML = html
        
        // Process lists first - convert <ul>/<ol> and <li> to formatted text
        const lists = Array.from(tmp.querySelectorAll('ul, ol'))
        lists.forEach(list => {
            const listItems = Array.from(list.querySelectorAll('li'))
            let listText = '\n'
            listItems.forEach(li => {
                const liText = (li.textContent || li.innerText || '').trim()
                if (liText) {
                    listText += `• ${liText}\n`
                }
            })
            // Replace the list element with a text node
            if (list.parentNode) {
                const textNode = document.createTextNode(listText)
                list.parentNode.replaceChild(textNode, list)
            }
        })
        
        // Process <br> tags - convert to newlines
        const brs = Array.from(tmp.querySelectorAll('br'))
        brs.forEach(br => {
            if (br.parentNode) {
                const textNode = document.createTextNode('\n')
                br.parentNode.replaceChild(textNode, br)
            }
        })
        
        // Process <p> and <div> tags - add newlines after
        const blockElements = Array.from(tmp.querySelectorAll('p, div'))
        blockElements.forEach(el => {
            const elText = (el.textContent || el.innerText || '').trim()
            if (elText && el.parentNode) {
                const textNode = document.createTextNode(elText + '\n\n')
                el.parentNode.replaceChild(textNode, el)
            } else if (el.parentNode) {
                el.remove()
            }
        })
        
        // Get plain text content (this automatically decodes HTML entities like &amp; to &)
        let text = tmp.textContent || tmp.innerText || ''
        
        // Clean up extra whitespace and normalize line breaks
        text = text
            .replace(/\n\s*\n\s*\n+/g, '\n\n') // Multiple newlines to double newline
            .replace(/[ \t]+/g, ' ') // Multiple spaces to single space
            .replace(/^\s+|\s+$/gm, '') // Trim each line
            .trim()
        
        return text
    }

    const handleShare = () => {
        if (!event) return
        
        // Format description without HTML tags
        const plainDescription = stripHtmlAndFormat(event.description)
        
        // Build share text
        let shareText = `${event.title}\n\n`
        
        if (plainDescription) {
            shareText += `${plainDescription}\n\n`
        }
        
        // Add event details
        if (earliestDate) {
            shareText += `📅 Date: ${formatFullDate(earliestDate)}\n`
        }
        
        if (hasOnlyOneSlot && singleSlot && singleSlot.startTime) {
            shareText += `🕐 Time: ${formatTime(singleSlot.startTime)}\n`
        } else if (event.duration) {
            shareText += `⏱️ Duration: ${formatDuration(event.duration)}\n`
        }
        
        if (fullAddress) {
            shareText += `📍 Venue: ${fullAddress}\n`
        }
        
        if (minPrice) {
            shareText += `💰 Price: ₹${minPrice}${getTicketTypesCount() > 1 ? ' onwards' : ''}\n`
        }
        
        if (navigator.share) {
            // For Web Share API, don't include URL in text - use the separate url parameter
            // This prevents double formatting or unwanted URL formatting
            navigator.share({
                title: event.title,
                text: shareText,
                url: window.location.href
            }).catch(() => { })
        } else {
            // Fallback: copy to clipboard - include URL in text for clipboard
            shareText += `\n${window.location.href}`
            navigator.clipboard.writeText(shareText).then(() => {
                // Optionally show a toast notification
                alert('Event link copied to clipboard!')
            }).catch(() => {
                // If clipboard API fails, just copy the URL
                navigator.clipboard.writeText(window.location.href)
            })
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center py-12">
                        <Loading size="lg" text="Loading event details..." />
                    </div>
                </div>
            </div>
        )
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <EmptyState
                        icon={Ticket}
                        title="Event Not Found"
                        message={error || "The event you're looking for doesn't exist or has been removed."}
                    />
                </div>
            </div>
        )
    }

    const earliestDate = getEarliestDate()
    const minPrice = getMinPrice()
    const activeSlots = getActiveSlots()
    const hasOnlyOneSlot = activeSlots.length === 1
    const singleSlot = hasOnlyOneSlot ? activeSlots[0] : null
    
    // Banner image for background (priority: banners[0] > eventImages[0] > eventDetailsImages[0] > eventDetailImage)
    let bannerImage = null
    if (event.banners && event.banners.length > 0) {
        bannerImage = getImageUrl(event.banners[0])
    } else if (event.eventImages && event.eventImages.length > 0) {
        bannerImage = getImageUrl(event.eventImages[0])
    } else if (event.eventDetailsImages && event.eventDetailsImages.length > 0) {
        bannerImage = getImageUrl(event.eventDetailsImages[0])
    } else if (event.eventDetailImage) {
        bannerImage = getImageUrl(event.eventDetailImage)
    }
    
    // Event details image for poster overlay (priority: eventDetailsImages[0] > eventDetailImage)
    let posterImage = null
    if (event.eventDetailsImages && event.eventDetailsImages.length > 0) {
        posterImage = getImageUrl(event.eventDetailsImages[0])
    } else if (event.eventDetailImage) {
        posterImage = getImageUrl(event.eventDetailImage)
    }
    
    const fullAddress = getFullAddress()

    return (
        <>
        <div className="min-h-screen bg-white dark:bg-gray-900">
            {/* Desktop Hero Section - Full Width (lg and above) - No padding */}
            <div id="desktop-hero-section" className="hidden lg:block relative w-full min-h-[600px] overflow-hidden bg-gradient-to-br from-gray-900 to-black">
                            {/* Background Banner Image */}
                            {bannerImage ? (
                                <>
                                    <img
                                        src={bannerImage}
                                        alt={event.title}
                                        className="absolute inset-0 w-full h-full object-cover opacity-40"
                                        onError={() => setImageError(true)}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50"></div>
                                </>
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black"></div>
                            )}
                            
                            <div className="relative z-10 flex gap-8 px-4 sm:px-6 lg:px-8 py-8 min-h-[600px] max-w-7xl mx-auto">
                                {/* Left Side - Poster Image */}
                                <div className="flex-shrink-0 w-80">
                                    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-gray-800 border-2 border-gray-700 shadow-2xl">
                                        {posterImage ? (
                                            <img
                                                src={posterImage}
                                                alt={event.title}
                                                className="w-full h-full object-cover"
                                                onError={() => setImageError(true)}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                                <div className="text-center">
                                                    <Ticket className="w-16 h-16 text-gray-600 mx-auto mb-3" />
                                                    <p className="text-gray-500 text-sm font-medium">Event Poster</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Right Side - Event Details Overlay */}
                                <div className="flex-1 flex flex-col pt-4 pb-4">
                                    {/* Share Button - Top */}
                                    <div className="flex justify-end mb-8">
                                        <button
                                            onClick={handleShare}
                                            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/20 transition-all text-white"
                                            aria-label="Share event"
                                        >
                                            <Share2 className="w-5 h-5" />
                                            <span className="text-sm font-medium">Share</span>
                                        </button>
                                    </div>
                                    
                                    {/* Centered Content */}
                                    <div className="flex flex-col justify-center">
                                        {/* Title */}
                                        <h1 className="text-4xl font-bold text-white leading-tight mb-6">
                                            {event.title}
                                        </h1>
                                        
                                        {/* Event Meta Info */}
                                        <div className="flex flex-wrap items-center gap-4 mb-6 text-white/90">
                                            {hasOnlyOneSlot && singleSlot ? (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-5 h-5" />
                                                        <span className="text-base font-medium">{formatFullDate(new Date(singleSlot.date))}</span>
                                                    </div>
                                                    {singleSlot.startTime && (
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-5 h-5" />
                                                            <span className="text-base font-medium">{formatTime(singleSlot.startTime)}</span>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    {earliestDate && (
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-5 h-5" />
                                                            <span className="text-base font-medium">{formatFullDate(earliestDate)}</span>
                                                        </div>
                                                    )}
                                                    {event.duration && (
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-5 h-5" />
                                                            <span className="text-base font-medium">{formatDuration(event.duration)}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            {event.address?.city && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-5 h-5" />
                                                    <span className="text-base font-medium">{event.address.city}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Categories/Tags */}
                                        {event.categories && event.categories.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-6">
                                                {event.categories.map((category, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-4 py-2 rounded-full text-sm font-semibold bg-white/10 backdrop-blur-sm text-white border border-white/20"
                                                    >
                                                        {typeof category === 'object' ? category.name : category}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Price Info and Book Now Button */}
                                        <div>
                                            {minPrice ? (
                                                <div className="mb-4">
                                                    <p className="text-sm text-gray-400 mb-1">
                                                        {getTicketTypesCount() > 1 ? 'Starting from' : 'Price'}
                                                    </p>
                                                    <div className="flex items-baseline gap-2 mb-3">
                                                        <span className="text-3xl font-bold text-white">
                                                            ₹{minPrice}
                                                        </span>
                                                        {getTicketTypesCount() > 1 && (
                                                            <span className="text-base text-gray-400">onwards</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-base text-gray-400 mb-4">Price TBA</p>
                                            )}
                                            
                                            {/* Book Now Button */}
                                            <button
                                                onClick={handleBookNow}
                                                className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600 text-gray-900 font-semibold py-2.5 px-8 rounded text-sm transition-all duration-200"
                                            >
                                                Book Tickets
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
            </div>

            {/* Mobile Hero Section - Full Width (md and below) - No padding */}
            <div className="lg:hidden relative w-full min-h-[400px] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                            {!imageError && posterImage ? (
                                <img
                                    src={posterImage}
                                    alt={event.title}
                                    className="w-full h-full object-cover"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
                                    <div className="text-center">
                                        <Ticket className="w-16 h-16 md:w-20 md:h-20 text-primary-300 dark:text-primary-600 mx-auto mb-3" />
                                        <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">Event Image</p>
                                    </div>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                            
                            {/* Event Title Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
                                            {event.title}
                                        </h1>
                                        
                                        {/* Event Meta Info */}
                                        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-white/90">
                                            {hasOnlyOneSlot && singleSlot ? (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{formatFullDate(new Date(singleSlot.date))}</span>
                                                    </div>
                                                    {singleSlot.startTime && (
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4" />
                                                            <span className="text-sm font-medium">{formatTime(singleSlot.startTime)}</span>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    {earliestDate && (
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4" />
                                                            <span className="text-sm font-medium">{formatFullDate(earliestDate)}</span>
                                                        </div>
                                                    )}
                                                    {event.duration && (
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="w-4 h-4" />
                                                            <span className="text-sm font-medium">{formatDuration(event.duration)}</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            {event.address?.city && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4" />
                                                    <span className="text-sm font-medium">{event.address.city}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Share Button */}
                                    <button
                                        onClick={handleShare}
                                        className="flex-shrink-0 p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded border border-white/20 transition-all"
                                        aria-label="Share event"
                                    >
                                        <Share2 className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>
            </div>

            {/* Content Container - With padding */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Content Grid - Shows after hero section */}
                <div className={`grid gap-8 ${showBookingCard ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
                    {/* Left Column - Main Content */}
                    <div className={`space-y-8 ${showBookingCard ? 'lg:col-span-2' : ''}`}>
                        {/* Categories - Mobile only (shown in desktop overlay) */}
                        {event.categories && event.categories.length > 0 && (
                            <div className="lg:hidden flex flex-wrap gap-2">
                                {event.categories.map((category, index) => (
                                    <span
                                        key={index}
                                        className="px-4 py-2 rounded-full text-sm font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700"
                                    >
                                        {typeof category === 'object' ? category.name : category}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Description Section - Minimal */}
                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                About This Event
                            </h2>
                            <div className="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-base max-w-none dark:prose-invert">
                                <div 
                                    className={!isDescriptionExpanded ? 'line-clamp-3' : ''}
                                    dangerouslySetInnerHTML={{ 
                                        __html: event.description || 'No description available for this event.' 
                                    }}
                                ></div>
                                {event.description && event.description.length > 200 && (
                                    <div className="mt-4">
                                        <button
                                            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold text-sm transition-colors flex items-center gap-1"
                                        >
                                            {isDescriptionExpanded ? (
                                                <>
                                                    <span>Show Less</span>
                                                    <ChevronRight className="w-4 h-4 rotate-90" />
                                                </>
                                            ) : (
                                                <>
                                                    <span>Read More</span>
                                                    <ChevronRight className="w-4 h-4 -rotate-90" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <style>{`
                                .prose h1 { font-size: 2em; margin-bottom: 0.5em; }
                                .prose h2 { font-size: 1.5em; margin-bottom: 0.5em; }
                                .prose h3 { font-size: 1.25em; margin-bottom: 0.5em; }
                                .prose b, .prose strong { font-weight: bold; }
                                .prose p { margin-bottom: 1em; }
                                .prose ul, .prose ol { margin-left: 1.5em; margin-bottom: 1em; }
                                .prose ul li { list-style-type: disc; }
                                .prose ol li { list-style-type: decimal; }
                                .prose br { display: block; content: ""; margin-bottom: 0.5em; }
                            `}</style>
                        </div>

                        {/* Venue Location Section - Minimal */}
                        <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                Venue Information
                            </h2>
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 rounded bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                                        <MapPin className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                                        {event.address?.landmark || event.address?.street || 'Event Venue'}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                                        {fullAddress}
                                    </p>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                                    >
                                        View on Map
                                        <ArrowRight className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </div>


                        {/* Organizer Section - Minimal */}
                        {event.organizer?.organizerId && (
                            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                    Organizer
                                </h2>
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                                        {(() => {
                                            const organizer = typeof event.organizer.organizerId === 'object' ? event.organizer.organizerId : null
                                            const organizerImage = organizer?.profilePicture || organizer?.image || organizer?.avatar || organizer?.logo
                                            const imageUrl = organizerImage ? getImageUrl(organizerImage) : null
                                            const defaultText = organizer?.name?.charAt(0).toUpperCase() || 'O'
                                            
                                            if (imageUrl) {
                                                return (
                                                    <>
                                                        <img
                                                            src={imageUrl}
                                                            alt={organizer?.name || 'Organizer'}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                // Fallback to default text if image fails to load
                                                                e.target.style.display = 'none'
                                                                const fallback = e.target.nextElementSibling
                                                                if (fallback) {
                                                                    fallback.style.display = 'flex'
                                                                }
                                                            }}
                                                        />
                                                        <span 
                                                            className="text-lg font-semibold text-primary-600 dark:text-primary-400 absolute inset-0 flex items-center justify-center"
                                                            style={{ display: 'none' }}
                                                        >
                                                            {defaultText}
                                                        </span>
                                                    </>
                                                )
                                            }
                                            
                                            return (
                                                <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                                                    {defaultText}
                                                </span>
                                            )
                                        })()}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                                            {typeof event.organizer.organizerId === 'object'
                                                ? event.organizer.organizerId.name
                                                : 'Organizer'}
                                        </h3>
                                        {typeof event.organizer.organizerId === 'object' && event.organizer.organizerId.email && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                {event.organizer.organizerId.email}
                                            </p>
                                        )}
                                        {typeof event.organizer.organizerId === 'object' && event.organizer.organizerId.mobile && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {event.organizer.organizerId.mobile}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Sponsors Section - Minimal */}
                        {event.sponsors && event.sponsors.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    Sponsors & Partners
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {event.sponsors.map((sponsor, index) => {
                                        // Sponsor should be populated from backend, but handle both cases
                                        // Check if sponsor is an object with _id (populated) or just an ID string
                                        let sponsorData = null
                                        if (sponsor && typeof sponsor === 'object' && sponsor._id) {
                                            // Fully populated sponsor object
                                            sponsorData = sponsor
                                        } else if (typeof sponsor === 'string') {
                                            // Just an ID - this shouldn't happen if backend populates correctly
                                            console.warn('Sponsor is just an ID, not populated:', sponsor)
                                            return null
                                        } else {
                                            return null
                                        }
                                        
                                        if (!sponsorData || !sponsorData.name) {
                                            return null
                                        }
                                        
                                        const getTypeLabel = (type) => {
                                            const labels = {
                                                'sponsor': 'Sponsor',
                                                'co-sponsor': 'Co-Sponsor',
                                                'title sponsor': 'Title Sponsor',
                                                'supported by': 'Supported By',
                                                'community partner': 'Community Partner',
                                                'technology partner': 'Technology Partner',
                                                'social media partner': 'Social Media Partner',
                                            }
                                            return labels[type] || type
                                        }

                                        const getTypeColor = (type) => {
                                            const colors = {
                                                'sponsor': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
                                                'co-sponsor': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
                                                'title sponsor': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
                                                'supported by': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700',
                                                'community partner': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
                                                'technology partner': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
                                                'social media partner': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700',
                                            }
                                            return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                                        }

                                        // Build logo URL
                                        let sponsorLogoUrl = null
                                        if (sponsorData.logo) {
                                            if (sponsorData.logo.startsWith('http')) {
                                                sponsorLogoUrl = sponsorData.logo
                                            } else {
                                                sponsorLogoUrl = `${API_BASE_URL.replace('/api', '')}${sponsorData.logo}`
                                            }
                                        }

                                        return (
                                            <div
                                                key={sponsorData._id ? String(sponsorData._id) : `sponsor-${index}`}
                                                className="p-4 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="w-20 h-20 rounded border border-gray-200 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                                                        {sponsorLogoUrl ? (
                                                            <img
                                                                src={sponsorLogoUrl}
                                                                alt={sponsorData.name || 'Sponsor Logo'}
                                                                className="w-full h-full object-contain p-2"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none'
                                                                    e.target.nextSibling.style.display = 'flex'
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div 
                                                            className={`w-full h-full items-center justify-center ${sponsorLogoUrl ? 'hidden' : 'flex'}`}
                                                            style={{ display: sponsorLogoUrl ? 'none' : 'flex' }}
                                                        >
                                                            <Award className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="font-semibold text-gray-900 dark:text-white text-base mb-2">
                                                            {sponsorData.name || 'Sponsor'}
                                                        </h5>
                                                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeColor(sponsorData.type)}`}>
                                                            {getTypeLabel(sponsorData.type)}
                                                        </span>
                                                        
                                                        {/* Website and Social Media Links - All in one row */}
                                                        {(sponsorData.website || sponsorData.socialMedia) && (
                                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                                {/* Website Link */}
                                                                {sponsorData.website && sponsorData.website.trim() && (
                                                                    <a
                                                                        href={sponsorData.website}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="cursor-pointer"
                                                                        title="Visit Website"
                                                                    >
                                                                        <img src="/world-wide-web.png" alt="Website" className="w-6 h-6 dark:brightness-100 dark:opacity-100" style={{ filter: 'none' }} />
                                                                    </a>
                                                                )}
                                                                
                                                                {/* Social Media Links */}
                                                                {sponsorData.socialMedia.facebook && sponsorData.socialMedia.facebook.trim() && (
                                                                    <a
                                                                        href={sponsorData.socialMedia.facebook}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="cursor-pointer"
                                                                        title="Facebook"
                                                                    >
                                                                        <img src="/facebook.png" alt="Facebook" className="w-5 h-5" />
                                                                    </a>
                                                                )}
                                                                {sponsorData.socialMedia.twitter && sponsorData.socialMedia.twitter.trim() && (
                                                                    <a
                                                                        href={sponsorData.socialMedia.twitter}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="cursor-pointer"
                                                                        title="Twitter"
                                                                    >
                                                                        <img src="/twitter.png" alt="Twitter" className="w-5 h-5" />
                                                                    </a>
                                                                )}
                                                                {sponsorData.socialMedia.instagram && sponsorData.socialMedia.instagram.trim() && (
                                                                    <a
                                                                        href={sponsorData.socialMedia.instagram}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="cursor-pointer"
                                                                        title="Instagram"
                                                                    >
                                                                        <img src="/instagram.png" alt="Instagram" className="w-5 h-5" />
                                                                    </a>
                                                                )}
                                                                {sponsorData.socialMedia.linkedin && sponsorData.socialMedia.linkedin.trim() && (
                                                                    <a
                                                                        href={sponsorData.socialMedia.linkedin}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="cursor-pointer"
                                                                        title="LinkedIn"
                                                                    >
                                                                        <img src="/linkdin.png" alt="LinkedIn" className="w-5 h-5 dark:brightness-100 dark:opacity-100" style={{ filter: 'none' }} />
                                                                    </a>
                                                                )}
                                                                {sponsorData.socialMedia.youtube && sponsorData.socialMedia.youtube.trim() && (
                                                                    <a
                                                                        href={sponsorData.socialMedia.youtube}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="cursor-pointer"
                                                                        title="YouTube"
                                                                    >
                                                                        <img src="/youtube.png" alt="YouTube" className="w-5 h-5" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })} 
                                </div>
                            </div>
                        )}

                        {/* Notes - At Bottom - Minimal */}
                        {event.notes && (
                            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    Important Notes
                                </h2>
                                <div className="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-base max-w-none dark:prose-invert">
                                    <div 
                                        className={!isNotesExpanded ? 'line-clamp-3' : ''}
                                        dangerouslySetInnerHTML={{ 
                                            __html: event.notes || '' 
                                        }}
                                    ></div>
                                    {event.notes && event.notes.length > 200 && (
                                        <div className="mt-4">
                                            <button
                                                onClick={() => setIsNotesExpanded(!isNotesExpanded)}
                                                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold text-sm transition-colors flex items-center gap-1"
                                            >
                                                {isNotesExpanded ? (
                                                    <>
                                                        <span>Show Less</span>
                                                        <ChevronRight className="w-4 h-4 rotate-90" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Read More</span>
                                                        <ChevronRight className="w-4 h-4 -rotate-90" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <style>{`
                                    .prose h1 { font-size: 2em; margin-bottom: 0.5em; }
                                    .prose h2 { font-size: 1.5em; margin-bottom: 0.5em; }
                                    .prose h3 { font-size: 1.25em; margin-bottom: 0.5em; }
                                    .prose b, .prose strong { font-weight: bold; }
                                    .prose p { margin-bottom: 1em; }
                                    .prose ul, .prose ol { margin-left: 1.5em; margin-bottom: 1em; }
                                    .prose ul li { list-style-type: disc; }
                                    .prose ol li { list-style-type: decimal; }
                                    .prose br { display: block; content: ""; margin-bottom: 0.5em; }
                                `}</style>
                            </div>
                        )}

                        {/* Terms & Conditions - At Bottom - Minimal */}
                        {event.termsAndConditions && (
                            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Info className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    Terms & Conditions
                                </h2>
                                <div className="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-base max-w-none dark:prose-invert">
                                    <div 
                                        className={!isTermsExpanded ? 'line-clamp-3' : ''}
                                        dangerouslySetInnerHTML={{ 
                                            __html: event.termsAndConditions || '' 
                                        }}
                                    ></div>
                                    {event.termsAndConditions && event.termsAndConditions.length > 200 && (
                                        <div className="mt-4">
                                            <button
                                                onClick={() => setIsTermsExpanded(!isTermsExpanded)}
                                                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold text-sm transition-colors flex items-center gap-1"
                                            >
                                                {isTermsExpanded ? (
                                                    <>
                                                        <span>Show Less</span>
                                                        <ChevronRight className="w-4 h-4 rotate-90" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>Read More</span>
                                                        <ChevronRight className="w-4 h-4 -rotate-90" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <style>{`
                                    .prose h1 { font-size: 2em; margin-bottom: 0.5em; }
                                    .prose h2 { font-size: 1.5em; margin-bottom: 0.5em; }
                                    .prose h3 { font-size: 1.25em; margin-bottom: 0.5em; }
                                    .prose b, .prose strong { font-weight: bold; }
                                    .prose p { margin-bottom: 1em; }
                                    .prose ul, .prose ol { margin-left: 1.5em; margin-bottom: 1em; }
                                    .prose ul li { list-style-type: disc; }
                                    .prose ol li { list-style-type: decimal; }
                                    .prose br { display: block; content: ""; margin-bottom: 0.5em; }
                                `}</style>
                            </div>
                        )}

                    </div>

                    {/* Right Column - Booking Card - Shows after scrolling past hero */}
                    {showBookingCard && (
                    <div className="lg:col-span-1 transition-opacity duration-300 opacity-100">
                        <div className="lg:sticky lg:top-24">
                            {/* Booking Card - Minimal Design */}
                            <div id="booking-card-section" className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-5 flex flex-col">
                                {/* Date */}
                                {earliestDate && (
                                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                                        <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400 shrink-0" />
                                        <p className="text-sm text-gray-900 dark:text-white">
                                            {formatFullDate(earliestDate)}
                                        </p>
                                    </div>
                                )}

                                {/* Location */}
                                <div className="flex items-start gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                                    <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 shrink-0" />
                                    <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                                        {fullAddress}
                                    </p>
                                </div>

                                {/* Price */}
                                <div className="mb-4">
                                    {minPrice ? (
                                        <>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                                {getTicketTypesCount() > 1 ? 'Starting from' : 'Price'}
                                            </p>
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                                    ₹{minPrice}
                                                </span>
                                                {getTicketTypesCount() > 1 && (
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">onwards</span>
                                                )}
                                            </div>
                                            {(() => {
                                                const minPriceTicket = getMinPriceTicketType()
                                                return minPriceTicket && (
                                                    <p className="text-xs text-primary-600 dark:text-primary-400">
                                                        {minPriceTicket.title}
                                                    </p>
                                                )
                                            })()}
                                        </>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Price TBA
                                        </p>
                                    )}
                                </div>

                                {/* Book Now Button */}
                                <button
                                    onClick={handleBookNow}
                                    className="w-full bg-primary-500 hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600 text-gray-900 font-semibold py-3 px-4 rounded transition-all duration-200"
                                >
                                    Book Now
                                </button>
                            </div>
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </div>

        {/* Sticky Mobile Book Now Button */}
        {event && (
            <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 ease-in-out ${
                showStickyButton 
                    ? 'opacity-100 translate-y-0 pointer-events-auto' 
                    : 'opacity-0 translate-y-full pointer-events-none'
            }`}>
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                        {/* Price Info */}
                        <div className="flex-1 min-w-0">
                            {minPrice ? (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-lg sm:text-xl font-bold text-primary-600 dark:text-primary-400">
                                        ₹{minPrice}
                                    </span>
                                    
                                    {getTicketTypesCount() > 1 && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            onwards
                                        </span>
                                    )}
                                    {(() => {
                                        const minPriceTicket = getMinPriceTicketType()
                                        return minPriceTicket && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                                                <Ticket className="w-3 h-3" />
                                                {minPriceTicket.title}
                                            </span>
                                        )
                                    })()}
                                </div>
                            ) : (
                                <span className="text-sm text-gray-600 dark:text-gray-400">Price TBA</span>
                            )}
                        </div>

                        {/* Book Now Button */}
                        <button
                            onClick={handleBookNow}
                            className="bg-primary-500 hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600 text-gray-900 font-semibold py-2.5 px-6 rounded transition-all duration-200 whitespace-nowrap flex-shrink-0"
                        >
                            Book Now
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}

export default EventDetail

