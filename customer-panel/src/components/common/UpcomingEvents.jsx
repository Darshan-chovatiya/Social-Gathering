import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, ArrowRight } from 'lucide-react'
import EventCard from './EventCard'
import Loading from './Loading'
import EmptyState from './EmptyState'

const UpcomingEvents = ({ limit = 8, showViewMore = true }) => {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/users/events?limit=${limit}&status=approved`)
        const data = await response.json()
        
        if (data.status === 200 && data.result?.events) {
          // Filter events with future slots (check date and endTime)
          const now = new Date()
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          
          const upcomingEvents = data.result.events.filter(event => {
            if (!event.slots || event.slots.length === 0) return false
            
            return event.slots.some(slot => {
              if (!slot.isActive || !slot.date || !slot.endTime) return false
              
              const slotDate = new Date(slot.date)
              const slotDay = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate())
              
              // If slot date is in the past, it's expired
              if (slotDay < today) return false
              
              // If slot date is in the future, it's valid
              if (slotDay > today) return true
              
              // If slot date is today, check if endTime hasn't passed
              const [hours, minutes] = slot.endTime.split(':').map(Number)
              const slotEndDateTime = new Date(slotDay)
              slotEndDateTime.setHours(hours, minutes || 0, 0, 0)
              
              return slotEndDateTime >= now
            })
          })
          
          setEvents(upcomingEvents)
        } else {
          setEvents([])
        }
      } catch (err) {
        console.error('Error fetching events:', err)
        setError('Failed to load events')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [API_BASE_URL, limit])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="md" text="Loading events..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-[#f84464] dark:text-[#f84464]">{error}</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No Upcoming Events"
        message="Check back soon for exciting events!"
      />
    )
  }

  return (
    <div className="w-full">
      {/* Events Grid - BookMyShow Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {events.slice(0, limit).map((event) => (
          <EventCard key={event._id} event={event} />
        ))}
      </div>

      {/* View More Events Button - BookMyShow Style */}
      {showViewMore && events.length > limit && (
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/explore')}
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white font-semibold px-8 py-3 rounded-md transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <span>View All Events</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}

export default UpcomingEvents

