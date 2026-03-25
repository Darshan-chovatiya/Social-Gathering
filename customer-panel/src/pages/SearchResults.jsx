import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import Loading from '../components/common/Loading'
import EventCard from '../components/common/EventCard'
import FarmhouseCard from '../components/common/FarmhouseCard'
import BanquetCard from '../components/common/BanquetCard'
import { Search, Calendar, Home, Building2, Ticket, MapPin, ChevronLeft } from 'lucide-react'

const SearchResults = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') || ''
  
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState({
    events: [],
    farmhouses: [],
    banquets: []
  })

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return
      
      try {
        setLoading(true)
        // Fetch from all categories in parallel
        const [eventRes, farmhouseRes, banquetRes] = await Promise.all([
          api.get(`/users/events?search=${encodeURIComponent(query)}&status=approved`),
          api.get(`/farmhouses/public?search=${encodeURIComponent(query)}&limit=10`),
          api.get(`/banquets/public?search=${encodeURIComponent(query)}&limit=10`)
        ])

        setResults({
          events: eventRes.data.result?.events || [],
          farmhouses: farmhouseRes.data.result?.farmhouses || [],
          banquets: banquetRes.data.result?.banquets || []
        })
      } catch (error) {
        console.error('Error fetching search results:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [query])

  const totalResults = results.events.length + results.farmhouses.length + results.banquets.length
  const isEmpty = totalResults === 0

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loading size="lg" />
        <p className="mt-4 text-gray-500 dark:text-gray-400 font-bold animate-pulse">Searching global records for "{query}"...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/30 dark:bg-gray-950 pb-20">
      {/* Search Header - Refined UI */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 py-10 relative overflow-hidden">
        {/* Subtle Accents */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-primary-600 transition-colors mb-6 font-bold text-xs uppercase tracking-widest"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight leading-none">
                Results for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-pink-500">"{query}"</span>
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  {totalResults} Matches Found
                </span>
                <div className="flex gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${results.events.length > 0 ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-800'}`} />
                  <div className={`w-1.5 h-1.5 rounded-full ${results.farmhouses.length > 0 ? 'bg-amber-500' : 'bg-gray-200 dark:bg-gray-800'}`} />
                  <div className={`w-1.5 h-1.5 rounded-full ${results.banquets.length > 0 ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {isEmpty ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-50 dark:border-gray-800">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-primary-500/10 rounded-full animate-ping" />
              <div className="relative bg-white dark:bg-gray-800 w-full h-full rounded-full flex items-center justify-center border-4 border-primary-50">
                <Search className="w-10 h-10 text-primary-600" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No Results Found</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-medium">
              We couldn't find any matches for "{query}". 
              Please check the spelling or try a more general term.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-primary-600 text-white px-8 py-3 rounded-xl font-black text-sm transition-all hover:bg-primary-700 shadow-lg active:scale-95"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Events Section */}
            {results.events.length > 0 && (
              <section className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2 rounded-xl">
                      <Ticket className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Trending Events</h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{results.events.length} Concerts & Shows</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                  {results.events.map(event => (
                    <div key={event._id} className="flex flex-col">
                      <EventCard event={event} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Farmhouses Section */}
            {results.farmhouses.length > 0 && (
              <section className="animate-fade-in-delayed">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-500/10 p-2 rounded-xl">
                      <Home className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Luxury Stays</h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{results.farmhouses.length} Private Escapes</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                  {results.farmhouses.map(fh => (
                    <div key={fh._id} className="flex flex-col">
                      <FarmhouseCard farmhouse={fh} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Banquets Section */}
            {results.banquets.length > 0 && (
              <section className="animate-fade-in-delayed-more">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600/10 p-2 rounded-xl">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Premium Venues</h2>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{results.banquets.length} Wedding & Party Halls</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                  {results.banquets.map(bq => (
                    <div key={bq._id} className="flex flex-col">
                      <BanquetCard banquet={bq} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchResults
