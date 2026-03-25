import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Ticket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Loading from './Loading'
import { getEventDetailPath } from '../../utils/eventUrl'

const BannerSlider = () => {
  const [banners, setBanners] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imageErrors, setImageErrors] = useState({})
  const navigate = useNavigate()

  // Get API base URL for images
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  const getImageUrl = (bannerPath) => {
    if (!bannerPath) return ''
    if (bannerPath.startsWith('http')) return bannerPath
    // Remove /api from base URL and add the banner path
    const baseUrl = API_BASE_URL.replace('/api', '')
    return `${baseUrl}${bannerPath}`
  }

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/users/banners/active`)
        const data = await response.json()
        
        if (data.status === 200 && data.result?.banners) {
          // Flatten banners from all events
          const allBanners = []
          data.result.banners.forEach(event => {
            if (event.banners && event.banners.length > 0) {
              event.banners.forEach(banner => {
                allBanners.push({
                  url: banner,
                  eventId: event._id,
                  eventTitle: event.title,
                  address: event.address,
                })
              })
            }
          })
          setBanners(allBanners)
        }
      } catch (err) {
        console.error('Error fetching banners:', err)
        setError('Failed to load banners')
      } finally {
        setLoading(false)
      }
    }

    fetchBanners()
  }, [API_BASE_URL])

  // Auto-slide functionality
  useEffect(() => {
    if (banners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [banners.length])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  const handleBannerClick = (eventId) => {
    if (eventId) navigate(getEventDetailPath(eventId))
  }

  if (loading) {
    return (
      <div className="w-full h-64 md:h-80 lg:h-96 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded-lg">
        <Loading size="md" text="Loading banners..." />
      </div>
    )
  }

  if (error || banners.length === 0) {
    return null // Don't show anything if no banners
  }

  return (
    <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden shadow-lg mb-6 group">
      {/* Banner Images */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {!imageErrors[index] ? (
              <img
                src={getImageUrl(banner.url)}
                alt={banner.eventTitle || `Banner ${index + 1}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => handleBannerClick(banner.eventId)}
                onError={() => setImageErrors(prev => ({ ...prev, [index]: true }))}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 cursor-pointer" onClick={() => handleBannerClick(banner.eventId)}>
                <div className="text-center">
                  <Ticket className="w-16 h-16 text-primary-300 dark:text-primary-600 mx-auto mb-2" />
                  <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">{banner.eventTitle || 'Banner'}</p>
                </div>
              </div>
            )}
            {/* Overlay with event title */}
            {banner.eventTitle && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 md:p-6">
                <h3 className="text-white text-lg md:text-2xl font-bold mb-1">
                  {banner.eventTitle}
                </h3>
                {banner.address?.city && (
                  <p className="text-white/90 text-sm md:text-base">
                    {banner.address.city}, {banner.address.state}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
            aria-label="Next banner"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default BannerSlider

