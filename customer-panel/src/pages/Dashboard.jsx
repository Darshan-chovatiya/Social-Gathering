import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, Ticket, History } from 'lucide-react'
import api from '../utils/api'
import Loading from '../components/common/Loading'
import DownloadAppSection from '../components/common/DownloadAppSection'
import ArtistInquirySection from '../components/common/ArtistInquirySection'
import EventCard from '../components/common/EventCard'
import InfiniteCarousel from '../components/common/InfiniteCarousel'
import eventSectionBg from '../assets/h1-bg.webp'
import heroBgSvg from '../assets/bg1.svg'
import mainBg from '../assets/main-bg.jpg'
import logoIcon from '../assets/Logo Icon.png'

const OrganizerCard = ({ organizer }) => {
  const [imgError, setImgError] = useState(false)
  const navigate = useNavigate()
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  
  const getImageUrl = (path) => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    const baseUrl = API_BASE_URL.replace('/api', '')
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${baseUrl}${normalizedPath}`
  }
  
  const org = organizer.organizerId || organizer
  // Search for any possible image field
  const imageField = org.profilePicture || org.profile_picture || org.image || org.profileImage || org.profile_image || org.avatar || org.logo || org.url || org.photo || (org.banners && org.banners.length > 0 ? org.banners[0] : null)
  const name = org.name || 'Organizer'
  const imageUrl = imageField && !imgError ? getImageUrl(imageField) : null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[2rem] overflow-hidden border border-gray-100 dark:border-gray-700  transition-all duration-500 group h-full flex flex-col">
       <div className="aspect-square flex items-center justify-center p-4 shrink-0 relative bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800 border-4 border-gray-100 dark:border-gray-700">
          {imageUrl ? (
            <div className="w-full h-full p-4 flex items-center justify-center">
              <img 
                src={imageUrl} 
                alt={name} 
                className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-700 drop-shadow-sm" 
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary-500 to-purple-600 flex items-center justify-center text-white font-black text-4xl shadow-lg transform group-hover:scale-110 transition-transform duration-500 uppercase">
              {name.charAt(0)}
            </div>
          )}
       </div>
       <div className="p-4 mt-auto">
          <p className="text-sm font-black text-gray-900 dark:text-gray-100 text-center truncate tracking-tight uppercase">{name}</p>
          <div className="w-8 h-1 bg-primary-500 mx-auto mt-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500" />
       </div>
    </div>
  )
}

const Dashboard = () => {
  const navigate = useNavigate()
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [loading, setLoading] = useState(true)
  const [recentEvents, setRecentEvents] = useState([])
  const [recentOrganizers, setRecentOrganizers] = useState([])
  const [carouselItems, setCarouselItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const eventRes = await api.get('/users/events?limit=10&status=approved&populate=organizer')
        const events = eventRes.data.result.events || []

        setRecentEvents(events)

        const orgMap = new Map()
        events.forEach(e => {
          const org = e.organizer?.organizerId || e.organizer
          if (org && (org._id || org.name)) {
            const id = org._id || org.name
            orgMap.set(id, org)
          }
        })
        setRecentOrganizers(Array.from(orgMap.values()))

        const mixed = []
        events.filter(e => e.banners?.length > 0).forEach(e => {
          mixed.push({
            id: e._id,
            title: e.title,
            banner: e.banners[0],
            location: e.address?.city || 'Various Locations',
            type: 'Event',
            link: `/events/${e._id}`
          })
        })
        setCarouselItems(mixed.sort(() => Math.random() - 0.5))
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Carousel logic for Trending Events
  const [eventIndex, setEventIndex] = useState(4) // Start after the 4 clones
  const [isEventTransitioning, setIsEventTransitioning] = useState(true)
  const eventLength = recentEvents.length

  useEffect(() => {
    if (eventLength === 0) return
    const interval = setInterval(() => {
      setIsEventTransitioning(true)
      setEventIndex(prev => prev + 1)
    }, 5000)
    return () => clearInterval(interval)
  }, [eventLength])

  useEffect(() => {
    if (eventLength === 0) return
    
    // Handle forward reset
    if (eventIndex === eventLength + 4) {
      const timeout = setTimeout(() => {
        setIsEventTransitioning(false)
        setEventIndex(4)
      }, 500)
      return () => clearTimeout(timeout)
    }
    
    // Handle backward reset
    if (eventIndex === 0) {
      const timeout = setTimeout(() => {
        setIsEventTransitioning(false)
        setEventIndex(eventLength)
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [eventIndex, eventLength])

  // Carousel logic for Organizers
  const orgLength = recentOrganizers.length
  // For small lists, we need a buffer that's at least as large as the visible items (6)
  const orgOffset = 6
  const [orgIndex, setOrgIndex] = useState(orgOffset)
  const [isOrgTransitioning, setIsOrgTransitioning] = useState(true)

  useEffect(() => {
    if (orgLength === 0) return
    const interval = setInterval(() => {
      setIsOrgTransitioning(true)
      setOrgIndex(prev => prev + 1)
    }, 5000) // Match events timing
    return () => clearInterval(interval)
  }, [orgLength])

  useEffect(() => {
    if (orgLength === 0) return
    if (orgIndex === orgLength + orgOffset) {
      const timeout = setTimeout(() => {
        setIsOrgTransitioning(false)
        setOrgIndex(orgOffset)
      }, 500)
      return () => clearTimeout(timeout)
    }
    if (orgIndex === 0) {
      const timeout = setTimeout(() => {
        setIsOrgTransitioning(false)
        setOrgIndex(orgLength)
      }, 500)
      return () => clearTimeout(timeout)
    }
  }, [orgIndex, orgLength, orgOffset])

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active')
        }
      })
    }, observerOptions)

    const revealElements = document.querySelectorAll('.reveal')
    revealElements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [loading]) // Re-run when loading finishes to catch newly rendered elements

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><Loading size="lg" text="Setting up your dashboard..." /></div>

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50/50 dark:bg-gray-950 pb-20">
      {/* Global Page Background Image */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 dark:opacity-10 pointer-events-none"
        style={{ 
          backgroundImage: `url(${mainBg})`
        }}
      />

      {/* Infinite Mixed Carousel */}
      <div className="relative z-10">
        <InfiniteCarousel items={carouselItems} navigate={navigate} />
      </div>

      <div className="relative py-16 md:py-20 px-4 overflow-hidden">
        {/* Modern Mesh Accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[160%] h-[160%] bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.08),transparent_50%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.05),transparent_40%),radial-gradient(circle_at_20%_80%,rgba(59,130,246,0.05),transparent_40%)] pointer-events-none z-1" />
        
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <div className="reveal inline-block px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/40 border border-primary-100 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-sm">
            Discover • Book • Celebrate
          </div>
          
          <h1 className="reveal reveal-delay-100 text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight leading-[1.1]">
            Unfold Your Next  
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-purple-500 to-pink-500"> Perfect Story</span>
          </h1>
          
          <p className="reveal reveal-delay-200 text-base md:text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            Leading platform to search and book trending live events. All in one place.
          </p>

          <div className="reveal reveal-delay-300 max-w-2xl mx-auto mb-16">
            <form 
              onSubmit={handleSearch} 
              className="flex items-center bg-white dark:bg-gray-800 rounded-2xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 dark:border-gray-700/50 transition-all focus-within:ring-4 focus-within:ring-primary-500/10"
            >
              <div className="flex-1 flex items-center px-4">
                <Search className="w-5 h-5 text-primary-600" />
                <input 
                  type="text" 
                  placeholder="Search for events..." 
                  className="w-full bg-transparent border-none outline-none py-3.5 px-3 text-gray-900 dark:text-gray-100 text-base font-bold placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="bg-primary-500 hover:bg-primary-600 text-gray-900 px-8 py-3.5 rounded-xl font-black text-base transition-all shadow-lg active:scale-95 flex items-center gap-2"
              >
                Find Now
              </button>
            </form>

            <div className="mt-6 flex flex-wrap justify-center gap-8">
              {[
                { label: 'Upcoming Events', icon: Ticket, path: '/explore' },
                { label: 'My Bookings', icon: History, path: '/bookings' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="group/btn flex items-center gap-2 text-[11px] font-black text-gray-400 hover:text-primary-600 transition-all uppercase tracking-widest"
                >
                  <div className="w-1 h-1 rounded-full bg-gray-300 group-hover/btn:bg-primary-500 transition-all" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-30">
        {/* Categories Grid (FastTicket style cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {[
            { 
              title: 'Explore Events', 
              desc: 'Music, Festivals & More',
              icon: Ticket,
              path: '/explore',
              img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=2070&auto=format&fit=crop',
              color: 'from-emerald-500/90 to-emerald-900/95'
            },
            { 
              title: 'My Bookings', 
              desc: 'Tickets & History',
              icon: History,
              path: '/bookings',
              img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop',
              color: 'from-blue-500/90 to-blue-900/95'
            },
          ].map((item) => (
            <div 
              key={item.title}
              onClick={() => navigate(item.path)}
              className="group relative h-52 rounded-3xl overflow-hidden cursor-pointer shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-xl"
            >
              <img src={item.img} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={item.title} />
              <div className={`absolute inset-0 bg-gradient-to-t ${item.color} opacity-80 backdrop-blur-[1px] group-hover:opacity-100 transition-all duration-500`} />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="bg-white/20 backdrop-blur-xl w-fit p-2.5 rounded-xl mb-3 transform -translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-0.5">{item.title}</h3>
                <p className="text-gray-100 text-[11px] font-bold tracking-wide opacity-80">{item.desc}</p>
              </div>
            </div>
          ))}
      </div>
    </div>

      <section 
        className="mb-16 relative overflow-hidden py-12 md:py-20 bg-primary-50/30 dark:bg-primary-900/10"
      >
        {/* Background Pattern Layer */}
        <div className="absolute inset-0 z-0 opacity-40 dark:opacity-0">
          <img 
            src={eventSectionBg} 
            alt="" 
            className="w-full h-full object-cover scale-150 opacity-100"
          />
        </div>
        
        {/* Subtle Gradient Overlays */}
        <div className="absolute inset-0  via-transparent to-white/60 dark:from-gray-900/60 dark:via-transparent dark:to-gray-900/60 z-0" />
        
        {/* Section Content - Centered */}
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-16 reveal">
            <p className="text-primary-600 dark:text-primary-400 font-bold text-sm uppercase tracking-[0.4em] mb-4 flex items-center justify-center gap-3">
               <span className="w-8 h-[1px] bg-primary-600/30" />
               Events You Love, Booked Your Way
               <span className="w-8 h-[1px] bg-primary-600/30" />
            </p>
            
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-[1.1] relative inline-block">
               Discover Latest
               <span className="relative inline-block mx-4">
                 <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">Trending</span>
                 <span className="absolute -top-10 md:-top-14 left-1/2 -translate-x-1/2 text-6xl md:text-9xl font-script text-gray-200/60 dark:text-gray-700/30 -rotate-6 pointer-events-none select-none lowercase tracking-normal">
                   Vibe
                 </span>
               </span>
               <br className="md:hidden" />
               Events
            </h2>

            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => navigate('/explore')}
                className="group flex items-center gap-2 bg-white dark:bg-gray-800 px-6 py-2.5 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all text-primary-600 dark:text-primary-400 font-black uppercase text-[10px] tracking-widest"
              >
                Show All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden -mx-4">
            <div 
              className={`flex transition-transform duration-500 ease-out ${!isEventTransitioning ? 'transition-none' : ''}`}
              style={{ transform: `translateX(-${eventIndex * (100 / (eventLength > 0 ? (windowWidth >= 1024 ? 4 : windowWidth >= 640 ? 2 : 1) : 1))}%` }}
            >
              {(() => {
                if (eventLength === 0) return null;
                const repeated = [...recentEvents];
                while (repeated.length < 4) {
                  repeated.push(...recentEvents);
                }
                const clonesStart = repeated.slice(-4);
                const clonesEnd = repeated.slice(0, 4);
                return [...clonesStart, ...recentEvents, ...clonesEnd].map((event, idx) => (
                  <div 
                    key={`${event._id}-${idx}`}
                    className="w-full sm:w-1/2 lg:w-1/4 shrink-0 px-4 flex flex-col"
                  >
                    <EventCard event={event} />
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Carousel Dots */}
          <div className="flex justify-center gap-1.5 mt-10">
            {recentEvents.map((_, idx) => {
              const activeIdx = (eventIndex - 4 + eventLength) % eventLength;
              return (
                <div 
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeIdx === idx ? 'w-6 bg-primary-500' : 'w-1.5 bg-gray-300 dark:bg-gray-700'
                  }`}
                />
              );
            })}
          </div>
        </div>
      </section>
 
      {/* Cinematic Entertainment Banner */}
      <div className="max-w-7xl mx-auto px-4 mb-8 relative z-10">
        <div className="group relative w-full py-8 md:py-0 md:h-32 rounded-xl md:rounded-[1.5rem] bg-gray-900 overflow-hidden flex flex-col md:flex-row items-center px-8 md:px-12 shadow-2xl transition-all duration-500 hover:scale-[1.01]">
          {/* Background Decorative Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <img src={heroBgSvg} alt="" className="w-full h-full object-cover scale-150 rotate-6" />
          </div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary-600/20 blur-[100px] rounded-full" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full" />

          {/* Logo Section */}
          <div className="relative shrink-0 flex flex-col items-center mb-6 md:mb-0 md:mr-16 reveal">
            <div className="flex items-center gap-3">
              <img src={logoIcon} alt="Logo" className="w-10 h-10 md:w-14 md:h-14 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
              <div className="flex flex-col leading-none">
                <span className="text-white text-xl md:text-2xl font-black tracking-tighter uppercase whitespace-nowrap">Social Gathering</span>
                <span className="text-gray-400 text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em] ml-0.5">Stream • Book • Enjoy</span>
              </div>
            </div>
          </div>

          {/* Slogan Section */}
          <div className="relative flex-1 text-center md:text-left reveal reveal-delay-200">
            <h3 className="text-white text-xl md:text-4xl font-black italic tracking-tight leading-tight">
              Endless <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">Tickets </span> Anytime. <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Anywhere!</span>
            </h3>
            <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] mt-2 opacity-60">Experience The Magic Of Live Events</p>
          </div>
          
          {/* Decorative Arrow/Indicator */}
          <div className="hidden lg:flex relative shrink-0 ml-4 items-center gap-3">
             <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
             <div className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-pulse shadow-[0_0_20px_rgba(79,70,229,0.8)]" />
          </div>
        </div>
      </div>

      {/* Organizer Listing Carousel Section (Full Width Background) */}
      {recentOrganizers.length > 0 && (
        <section className="relative py-8 md:py-8 mb-8 overflow-hidden bg-primary-50/30 dark:bg-primary-900/10">
          {/* Background Image Wrapper */}
          <div className="absolute inset-0 z-0">
            {/* <img 
              src={heroBgSvg} 
              alt="Background Pattern" 
              className="w-full h-full object-contain opacity-40 dark:opacity-20 scale-170" 
            /> */}
            <div className="absolute inset-0 bg-gradient-to-b from-gray-50/10 via-transparent to-gray-50/40 dark:from-gray-900/40 dark:via-transparent dark:to-gray-900/40"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="flex items-center justify-between mb-8 reveal">
              <div className="flex flex-col gap-1">
                <p className="text-primary-600 dark:text-primary-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                   Bringing Your Vision to Life <span className="animate-pulse">✨</span>
                </p>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Our Organizers</h2>
              </div>
            </div>

            <div className="relative overflow-hidden -mx-4">
              <div 
                className={`flex transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1) ${!isOrgTransitioning ? 'transition-none' : ''}`}
                style={{ transform: `translateX(-${orgIndex * (100 / (orgLength > 0 ? (windowWidth >= 1024 ? 6 : windowWidth >= 640 ? 3 : 2) : 1))}%` }}
              >
                {/* Robust cloning: Repeat items if necessary to fill exactly orgOffset clones */}
                {(() => {
                  if (orgLength === 0) return null;
                  const repeated = [...recentOrganizers];
                  while (repeated.length < orgOffset) {
                    repeated.push(...recentOrganizers);
                  }
                  const clonesStart = repeated.slice(-orgOffset);
                  const clonesEnd = repeated.slice(0, orgOffset);
                  return [...clonesStart, ...recentOrganizers, ...clonesEnd].map((org, idx) => (
                    <div 
                      key={`${org._id}-${idx}`}
                      className="w-1/2 sm:w-1/3 lg:w-1/6 shrink-0 px-4 flex flex-col"
                    >
                      <OrganizerCard organizer={org} />
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Carousel Dots */}
            <div className="flex justify-center gap-1.5 mt-10">
              {recentOrganizers.map((_, idx) => {
                const activeIdx = (orgIndex - orgOffset + orgLength) % orgLength;
                return (
                  <div 
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeIdx === idx ? 'w-6 bg-primary-500' : 'w-1.5 bg-gray-300 dark:bg-gray-700/50'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      <ArtistInquirySection />

      <div className="max-w-7xl mx-auto px-4 relative z-30">

        {/* Call to Action Section (Professional touch) */}
        <div className="mt-20 rounded-[40px] bg-primary-600 overflow-hidden relative p-12 text-center text-white shadow-2xl shadow-primary-500/20">
          <div className="absolute inset-0 z-0 opacity-10">
             <img src={heroBgSvg} alt="" className="w-full h-full object-cover scale-110" />
          </div>
          <div className="absolute top-0 right-0 p-8 scale-150 opacity-10">
            <Ticket className="w-64 h-64" />
          </div>
          <div className="relative z-10 reveal">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Experience the Best Social Gathering Booking System</h2>
            <p className="reveal reveal-delay-200 text-lg text-primary-100 mb-10 max-w-2xl mx-auto font-medium">
              Join thousands of users who trust us for their entertainment booking needs. Fast, secure, and hassle-free.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="bg-white text-primary-600 hover:bg-gray-100 px-10 py-4 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95"
              >
                Get Started Now
              </button>
              <button 
                onClick={() => navigate('/about')}
                className="bg-primary-500/30 border-2 border-primary-400/50 backdrop-blur-sm text-white hover:bg-primary-500/50 px-10 py-4 rounded-2xl font-black text-lg transition-all active:scale-95"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      <DownloadAppSection />
    </div>
  )
}

export default Dashboard
