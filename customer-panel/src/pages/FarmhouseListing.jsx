import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import Loading from '../components/common/Loading'
import { Home, MapPin, Star, Search, Filter, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react'
import Pagination from '../components/common/Pagination'

// Carousel Component
const FarmhouseCarousel = ({ farmhouses, navigate }) => {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const length = farmhouses?.length || 0;

  useEffect(() => {
    if (!farmhouses || length === 0) return;
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [farmhouses, length]);

  useEffect(() => {
    if (length === 0) return;

    if (currentIndex === length + 1) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(1);
      }, 500); // Wait for transition to finish before snapping
      return () => clearTimeout(timeout);
    } else if (currentIndex === 0) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(length);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, length]);

  if (!farmhouses || length === 0) return null;

  // Create clone nodes for infinite scrolling effect
  const displayList = [farmhouses[length - 1], ...farmhouses, farmhouses[0]];

  return (
    <div className="relative w-full bg-white dark:bg-gray-900 overflow-hidden py-0 md:py-0 cursor-pointer select-none">
      <div
        className={`flex h-[200px] sm:h-[250px] md:h-[350px] lg:h-[400px] xl:h-[450px] py-1 md:py-2 ${isTransitioning ? 'transition-transform duration-500 ease-out' : ''}`}
        style={{ transform: `translateX(calc(8% - ${currentIndex * 86}%))` }}
      >
        {displayList.map((fh, idx) => {
          if (!fh) return null;
          const bannerObj = fh.banners?.[0];
          const bgImg = bannerObj
            ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}${bannerObj}`
            : null;

          if (!bgImg) return null;

          return (
            <div
              key={`carousel-${fh._id}-${idx}`}
              onClick={() => navigate(`/farmhouses/${fh._id}`)}
              className="w-[84%] shrink-0 mr-[1%] relative rounded-lg xl:rounded-lg overflow-hidden group border border-gray-200 dark:border-gray-800"
            >
              <img
                src={bgImg}
                alt={fh.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end">
                <div className="p-4 md:p-8 w-full bg-black/10 transition-all text-left rounded-b-xl xl:rounded-b-3xl">
                  <h2 className="text-white text-xl md:text-3xl font-bold line-clamp-1 group-hover:text-primary-400 transition-colors uppercase">{fh.title}</h2>
                  <div className="flex items-center text-gray-200 mt-2 text-sm md:text-base gap-2">
                    <MapPin className="w-4 h-4 text-primary-400" />
                    <span>{fh.address?.city}, {fh.address?.state}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Bullets */}
      <div className="absolute bottom-6 md:bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
        {farmhouses.map((_, idx) => {
          let isActive = false;
          if (currentIndex === 0 && idx === length - 1) isActive = true;
          else if (currentIndex === length + 1 && idx === 0) isActive = true;
          else if (currentIndex - 1 === idx) isActive = true;

          return (
            <button
              key={`bullet-${idx}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsTransitioning(true);
                setCurrentIndex(idx + 1);
              }}
              className={`transition-all duration-300 rounded-full ${isActive ? 'w-5 h-1.5 md:w-6 md:h-1.5 bg-white' : 'w-1.5 h-1.5 md:w-2 md:h-2 bg-white/50 hover:bg-white/80'
                }`}
            />
          );
        })}
      </div>
    </div>
  );
};

const FarmhouseListing = () => {
  const navigate = useNavigate()
  const [farmhouses, setFarmhouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [cities, setCities] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 20

  // Handle Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch Cities once on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await api.get('/farmhouses/public?limit=1000')
        if (response.data.status === 200) {
          const allFh = response.data.result.farmhouses || []
          const uniqueCities = [...new Set(allFh.map(fh => fh.address?.city))].filter(Boolean)
          setCities(uniqueCities)
        }
      } catch (error) {
        console.error('Error fetching cities:', error)
      }
    }
    fetchCities()
  }, [])

  // Fetch paginated data
  useEffect(() => {
    fetchFarmhouses()
  }, [currentPage, debouncedSearch, cityFilter])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, cityFilter])

  const fetchFarmhouses = async () => {
    try {
      setLoading(true)
      const response = await api.get('/farmhouses/public', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearch,
          city: cityFilter
        }
      })
      if (response.data.status === 200) {
        setFarmhouses(response.data.result.farmhouses || [])
        setTotalPages(response.data.result.pagination?.pages || 1)
      }
    } catch (error) {
      console.error('Error fetching farmhouses:', error)
    } finally {
      setLoading(false)
    }
  }

  const carouselFarmhouses = farmhouses.filter(fh => fh.banners && fh.banners.length > 0).slice(0, 5);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><Loading size="lg" text="Finding best farmhouses..." /></div>

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-12">
      {/* BookMyShow Style Carousel */}
      <FarmhouseCarousel farmhouses={carouselFarmhouses} navigate={navigate} />

      {/* Search & Filters */}
      <div className="max-w-7xl mx-auto px-4 mt-6 md:mt-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search farmhouse by name, location or keyword..."
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
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">Recommended Farmhouses</h2>
          <span className="text-primary-600 dark:text-primary-400 text-sm font-semibold cursor-pointer hover:underline transition-all hidden sm:block">See All ›</span>
        </div>

        {farmhouses.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 relative z-10">
            <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No farmhouses found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
            {farmhouses.map((fh) => (
              <div
                key={fh._id}
                onClick={() => navigate(`/farmhouses/${fh._id}`)}
                className="group cursor-pointer flex flex-col"
              >
                {/* Image Section - Vertical Aspect */}
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl md:rounded-2xl bg-gray-100 dark:bg-gray-800 transition-all duration-300 shadow-sm hover:shadow-lg">
                  {fh.banners?.[0] ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}${fh.banners[0]}`}
                      alt={fh.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                      <Home className="w-12 h-12 text-gray-300" />
                    </div>
                  )}
                  {/* Rating Tag (Like BookMyShow) */}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded flex items-center gap-1">
                    <Star className="w-3 h-3 text-red-500 fill-red-500" />
                    <span className="text-xs font-semibold text-white">4.8</span>
                  </div>
                </div>

                {/* Info Section - Blending with background */}
                <div className="py-2.5 flex flex-col space-y-0.5 pointer-events-none">
                  <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 group-hover:text-primary-600 transition-colors tracking-wide">{fh.title}</h3>

                  <div className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">
                    <span className="truncate line-clamp-1">{fh.address?.city}, {fh.address?.state} • {fh.amenities?.guests} Guests</span>
                  </div>

                  <div className="pt-1 flex items-baseline flex-wrap gap-1">
                    <span className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium uppercase tracking-wide">Starting From</span>
                    <span className="text-sm md:text-base font-bold text-gray-900 dark:text-gray-100 pb-0.5">₹{fh.pricing?.regular?.rate12h || fh.pricing?.regular?.rate24h || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    </div>
  )
}

export default FarmhouseListing
