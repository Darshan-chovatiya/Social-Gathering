import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket } from 'lucide-react'
import { getEventDetailPath } from '../../utils/eventUrl'

const EventCard = ({ event }) => {
  const navigate = useNavigate()
  const [imageError, setImageError] = useState(false)
  
  // Get API base URL for images
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  const getImageUrl = (bannerPath) => {
    if (!bannerPath) return ''
    if (bannerPath.startsWith('http')) return bannerPath
    const baseUrl = API_BASE_URL.replace('/api', '')
    return `${baseUrl}${bannerPath}`
  }

  // Get event image (prioritize eventDetailImage for cards)
  const bannerImage = event.eventDetailImage 
    ? getImageUrl(event.eventDetailImage)
    : event.banners && event.banners.length > 0 
      ? getImageUrl(event.banners[0]) 
      : null

  // Get earliest slot date
  const getEarliestDate = () => {
    if (!event.slots || event.slots.length === 0) return null
    const dates = event.slots
      .filter(slot => slot.isActive)
      .map(slot => new Date(slot.date))
      .sort((a, b) => a - b)
    return dates[0]
  }

  // Get minimum ticket price
  const getMinPrice = () => {
    if (!event.ticketTypes || event.ticketTypes.length === 0) return null
    const prices = event.ticketTypes
      .filter(ticket => ticket.isActive)
      .map(ticket => ticket.price)
    return prices.length > 0 ? Math.min(...prices) : null
  }

  const earliestDate = getEarliestDate()
  const minPrice = getMinPrice()
  
  const formatDate = (date) => {
    if (!date) return 'TBA'
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleClick = () => {
    navigate(getEventDetailPath(event))
  }

  return (
    <div
      onClick={handleClick}
      className="group bg-white dark:bg-gray-800 rounded-3xl overflow-hidden cursor-pointer border border-gray-100 dark:border-gray-700 h-full flex flex-col hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-500"
    >
      {/* Event Image - Poster Style */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shrink-0 mx-3 mt-3 rounded-2xl">
        {!imageError && bannerImage ? (
          <img
            src={bannerImage}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Ticket className="w-12 h-12 text-primary-200 dark:text-primary-800 mx-auto mb-2" />
              <p className="text-gray-300 dark:text-gray-600 text-xs font-medium uppercase tracking-widest">No Poster</p>
            </div>
          </div>
        )}
        
        {/* Overlay for better text readability if needed in the future */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* Event Details */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Date and Time - Primary Color */}
        {earliestDate && (
          <p className="text-[11px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1.5">
            {new Date(earliestDate).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
            {event.slots?.[0]?.startTime && ` | ${event.slots[0].startTime}`}
          </p>
        )}

        {/* Event Title */}
        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1 line-clamp-1 leading-tight tracking-tight">
          {event.title}
        </h3>

        {/* City/Location */}
        {event.address?.city && (
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-1">
            Live in {event.address.city}
          </p>
        )}

        {/* Price Pill */}
        <div className="mt-auto flex items-center">
          {minPrice ? (
            <div className="px-3 py-1 bg-primary-50 dark:bg-primary-900/40 border border-primary-100 dark:border-primary-800 rounded-full">
              <p className="text-[11px] font-black text-primary-700 dark:text-primary-300">
                ₹{minPrice} <span className="font-bold opacity-70">Onwards</span>
              </p>
            </div>
          ) : (
            <div className="px-3 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full">
              <p className="text-[11px] font-black text-gray-400 uppercase">Price TBA</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EventCard

