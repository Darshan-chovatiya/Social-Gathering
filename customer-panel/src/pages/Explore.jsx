import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import EventCard from '../components/common/EventCard'
import Loading from '../components/common/Loading'
import EmptyState from '../components/common/EmptyState'
import { Calendar, Search, Filter, ChevronRight, MapPin, Ticket } from 'lucide-react'
import Pagination from '../components/common/Pagination'
import api from '../utils/api'

// Carousel Component
const EventCarousel = ({ events, navigate }) => {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const length = events?.length || 0;

  useEffect(() => {
    if (!events || length === 0) return;
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [events, length]);

  useEffect(() => {
    if (length === 0) return;

    if (currentIndex === length + 1) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(1);
      }, 500);
      return () => clearTimeout(timeout);
    } else if (currentIndex === 0) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(length);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, length]);

  if (!events || length === 0) return null;

  const displayList = [events[length - 1], ...events, events[0]];

  const getImageUrl = (path) => {
    if (!path) return ''
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '')
    return `${baseUrl}${path}`
  }

  return (
    <div className="relative w-full bg-white dark:bg-gray-900 overflow-hidden py-0 cursor-pointer select-none">
      <div
        className={`flex h-[200px] sm:h-[250px] md:h-[350px] lg:h-[400px] xl:h-[450px] py-1 md:py-2 ${isTransitioning ? 'transition-transform duration-500 ease-out' : ''}`}
        style={{ transform: `translateX(calc(8% - ${currentIndex * 86}%))` }}
      >
        {displayList.map((event, idx) => {
          if (!event) return null;
          const bgImg = event.banners?.[0] ? getImageUrl(event.banners[0]) : null;

          if (!bgImg) return null;

          return (
            <div
              key={`carousel-${event._id}-${idx}`}
              onClick={() => navigate(`/events/${event._id}`)}
              className="w-[84%] shrink-0 mr-[1%] relative rounded-lg xl:rounded-lg overflow-hidden group border border-gray-200 dark:border-gray-800"
            >
              <img
                src={bgImg}
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end">
                <div className="p-4 md:p-8 w-full bg-black/10 transition-all text-left rounded-b-xl xl:rounded-b-3xl">
                  <h2 className="text-white text-xl md:text-3xl font-bold line-clamp-1 group-hover:text-primary-400 transition-colors uppercase">{event.title}</h2>
                  <div className="flex items-center text-gray-200 mt-2 text-sm md:text-base gap-2">
                    <MapPin className="w-4 h-4 text-primary-400" />
                    <span>Live in {event.address?.city}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
        {events.map((_, idx) => (
          <button
            key={`bullet-${idx}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsTransitioning(true);
              setCurrentIndex(idx + 1);
            }}
            className={`transition-all duration-300 rounded-full ${
              (currentIndex === 0 && idx === length - 1) || (currentIndex === length + 1 && idx === 0) || (currentIndex - 1 === idx)
                ? 'w-5 h-1.5 md:w-6 md:h-1.5 bg-white'
                : 'w-1.5 h-1.5 md:w-2 md:h-2 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const Explore = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''
  
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch)
  const [cityFilter, setCityFilter] = useState('')
  const [cities, setCities] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await api.get('/users/events?limit=1000&status=approved')
        if (response.data.status === 200) {
          const allEvents = response.data.result.events || []
          const uniqueCities = [...new Set(allEvents.map(e => e.address?.city))].filter(Boolean)
          setCities(uniqueCities)
        }
      } catch (error) {
        console.error('Error fetching cities:', error)
      }
    }
    fetchCities()
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [currentPage, debouncedSearch, cityFilter])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, cityFilter])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users/events', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearch,
          city: cityFilter,
          status: 'approved'
        }
      })
      
      if (response.data.status === 200 && response.data.result?.events) {
        setEvents(response.data.result.events)
        setTotalPages(response.data.result.pagination?.pages || 1)
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

  const carouselEvents = events.filter(e => e.banners && e.banners.length > 0).slice(0, 5)

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center py-12">
        <Loading size="lg" text="Loading amazing events..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-12">
      {/* BookMyShow Style Carousel */}
      <EventCarousel events={carouselEvents} navigate={navigate} />

      {/* Search & Filters */}
      <div className="max-w-7xl mx-auto px-4 mt-6 md:mt-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events by name, artist or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white transition-all shadow-sm outline-none"
            />
          </div>
          <div className="relative w-full md:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white appearance-none transition-all shadow-sm outline-none cursor-pointer"
            >
              <option value="">All Cities</option>
              {cities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 mt-8 md:mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {debouncedSearch ? `Search Results for "${debouncedSearch}"` : 'Recommended Events'}
          </h2>
          <span className="text-primary-600 dark:text-primary-400 text-sm font-semibold cursor-pointer hover:underline transition-all hidden sm:block">Recommended ›</span>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 relative z-10">
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No events found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </div>
    </div>
  )
}

export default Explore

