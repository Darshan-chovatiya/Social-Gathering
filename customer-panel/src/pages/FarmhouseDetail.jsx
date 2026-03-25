import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import api from '../utils/api'
import Loading from '../components/common/Loading'
import { useToast } from '../components/common/ToastContainer'
import { useAuthStore } from '../store/authStore'
import {
  Home, MapPin, Users, Bed, Bath, Wind, Wifi, Car, Music,
  Tv, Coffee, Utensils, Calendar, ShieldCheck, Info, Star, Receipt,
  Check, ChevronLeft, Share2, Heart, ArrowRight, X, DollarSign, ChevronRight, Award, Lightbulb, Ticket, User, ImageIcon, Mail, Phone, MessageSquare, Send,
  Waves, Trees, Refrigerator, Disc
} from 'lucide-react'
import { format, differenceInDays, addDays, isSameDay, eachDayOfInterval } from 'date-fns'
import { DateRange } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import './FarmhouseCalendar.css'
import { Clock } from 'lucide-react'

const formatTime = (timeStr) => {
  if (!timeStr) return '--:--'
  try {
    const [hours, minutes] = timeStr.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${minutes} ${ampm}`
  } catch (e) {
    return timeStr
  }
}

const FarmhouseDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { isAuthenticated } = useAuthStore()

  const [farmhouse, setFarmhouse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState([
    {
      startDate: addDays(new Date(), 1),
      endDate: addDays(new Date(), 2),
      key: 'selection'
    }
  ])
  const [bookedDates, setBookedDates] = useState([])
  const [stayType, setStayType] = useState('rate24h') // rate12h, rate24h, perNight
  const [totalPrice, setTotalPrice] = useState(0)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [isAvailable, setIsAvailable] = useState(true)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [showCalendar, setShowCalendar] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [isTermsExpanded, setIsTermsExpanded] = useState(false)
  const [isNotesExpanded, setIsNotesExpanded] = useState(false)
  const [showBookingCard, setShowBookingCard] = useState(true)
  const [showStickyButton, setShowStickyButton] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [enquiryForm, setEnquiryForm] = useState({
    name: '',
    mobile: '',
    email: '',
    message: ''
  })
  const [enquiryLoading, setEnquiryLoading] = useState(false)
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false)

  const depositValue = farmhouse?.deposit?.type === 'percentage'
    ? (totalPrice * (farmhouse.deposit.value || 0) / 100)
    : Number(farmhouse?.deposit?.value || 0)

  useEffect(() => {
    fetchFarmhouse()
    fetchAllBookedDates()
  }, [id])

  // Scroll lock and keyboard support for modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsGalleryModalOpen(false)
    }

    if (isGalleryModalOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEsc)
    } else {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleEsc)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleEsc)
    }
  }, [isGalleryModalOpen])

  useEffect(() => {
    if (farmhouse && dateRange[0].startDate && dateRange[0].endDate) {
      calculatePrice()
      checkAvailability()
    }
  }, [farmhouse, dateRange, stayType])

  // Auto-slide for mobile hero
  useEffect(() => {
    if (!farmhouse?.banners?.length) return
    const interval = setInterval(() => {
      setActiveImageIdx(prev => (prev + 1) % farmhouse.banners.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [farmhouse])

  useEffect(() => {
    const { user } = useAuthStore.getState()
    if (user) {
      setEnquiryForm(prev => ({
        ...prev,
        name: user.name || '',
        mobile: user.mobile || '',
        email: user.email || ''
      }))
    }
  }, [isAuthenticated])

  // Scroll detection for sticky button and booking card
  useEffect(() => {
    if (!farmhouse) return

    const handleScroll = () => {
      if (window.innerWidth >= 1024) {
        const heroSection = document.getElementById('desktop-hero-section')
        if (heroSection) {
          const rect = heroSection.getBoundingClientRect()
          setShowBookingCard(rect.bottom <= window.innerHeight - 50)
        } else {
          setShowBookingCard(true)
        }
        setShowStickyButton(false)
      } else {
        const scrollPosition = window.scrollY + window.innerHeight
        const documentHeight = document.documentElement.scrollHeight
        setShowStickyButton(scrollPosition < documentHeight - 50)
      }
    }

    setTimeout(handleScroll, 100)
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [farmhouse])

  const fetchAllBookedDates = async () => {
    try {
      const response = await api.get(`/farmhouses/check-availability`, {
        params: { farmhouseId: id }
      })
      if (response.data.status === 200) {
        setBookedDates(response.data.result.bookedDates.map(d => ({
          startDate: new Date(d.startDate),
          endDate: new Date(d.endDate)
        })))
      }
    } catch (error) {
      console.error('Error fetching all booked dates:', error)
    }
  }

  const checkAvailability = async () => {
    if (!dateRange[0].startDate || !dateRange[0].endDate) return
    try {
      setAvailabilityLoading(true)
      // Check specific range
      const response = await api.get(`/farmhouses/check-availability`, {
        params: {
          farmhouseId: id,
          checkInDate: format(dateRange[0].startDate, 'yyyy-MM-dd'),
          checkOutDate: format(dateRange[0].endDate, 'yyyy-MM-dd')
        }
      })

      if (response.data.status === 200) {
        setIsAvailable(response.data.result.isAvailable)
      }
    } catch (error) {
      console.error('Error checking availability:', error)
    } finally {
      setAvailabilityLoading(false)
    }
  }

  const fetchFarmhouse = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/farmhouses/public/${id}`)
      if (response.data.status === 200) {
        setFarmhouse(response.data.result.farmhouse)
      }
    } catch (error) {
      toast.error('Failed to load farmhouse details')
      navigate('/farmhouses')
    } finally {
      setLoading(false)
    }
  }

  const getTierForDate = (date) => {
    if (!farmhouse) return 'regular'
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const isFestival = farmhouse.festivalDates?.some(d =>
      format(new Date(d), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    )
    return isFestival ? 'festival' : (isWeekend ? 'weekend' : 'regular')
  }

  const calculatePrice = () => {
    if (!farmhouse) return
    const start = dateRange[0].startDate
    const end = dateRange[0].endDate
    const days = differenceInDays(end, start)

    if (days < 0) return

    // Auto-select stay type: 12h for same day, 24h for multi-day
    if (days === 0 && stayType !== 'rate12h') {
      setStayType('rate12h')
      return
    } else if (days > 0 && stayType === 'rate12h') {
      setStayType('rate24h')
      return
    }

    let total = 0
    // Iterate through each day to sum up based on tier
    for (let i = 0; i <= days; i++) {
      const current = addDays(start, i)
      const tier = getTierForDate(current)

      if (stayType === 'rate12h') {
        total += farmhouse.pricing?.[tier]?.rate12h || 0
      } else if (i < days || days === 0) {
        total += farmhouse.pricing?.[tier]?.[stayType] || 0
      }
    }

    setTotalPrice(total)
  }

  const handleBooking = () => {
    if (!isAuthenticated) {
      toast.error('Please login to book a farmhouse')
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    const start = dateRange[0].startDate
    const end = dateRange[0].endDate
    const days = differenceInDays(end, start)

    const subtotal = totalPrice
    const depositAmountValue = farmhouse.deposit?.type === 'percentage'
      ? (subtotal * farmhouse.deposit.value / 100)
      : Number(farmhouse.deposit?.value || 0)

    const bookingData = {
      farmhouse,
      checkInDate: format(start, 'yyyy-MM-dd'),
      checkOutDate: format(end, 'yyyy-MM-dd'),
      totalPrice: totalPrice,
      depositAmount: depositAmountValue,
      finalTotal: totalPrice + depositAmountValue,
      stayType
    }

    navigate(`/farmhouses/${id}/booking-summary`, { state: bookingData })
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: farmhouse.title,
        text: `Check out this farmhouse: ${farmhouse.title}`,
        url: window.location.href
      }).catch(console.error)
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  const handleEnquirySubmit = async (e) => {
    e.preventDefault()
    if (!enquiryForm.name || !enquiryForm.mobile || !enquiryForm.message) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setEnquiryLoading(true)
      const response = await api.post('/farmhouses/enquiry', {
        farmhouseId: id,
        ...enquiryForm
      })

      if (response.data.status === 201) {
        toast.success('Your enquiry has been submitted successfully! The organizer will contact you soon.')
        setEnquiryForm(prev => ({ ...prev, message: '' }))
      }
    } catch (error) {
      console.error('Error submitting enquiry:', error)
      toast.error(error.response?.data?.message || 'Failed to submit enquiry')
    } finally {
      setEnquiryLoading(false)
    }
  }

  const getImageUrl = (path) => {
    if (!path) return ''
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '')
    return `${baseUrl}${path}`
  }

  const renderDayContent = (day) => {
    const isFestival = farmhouse.festivalDates?.some(d =>
      isSameDay(new Date(d), day)
    )
    const isBooked = bookedDates.some(booking => 
      isSameDay(booking.startDate, day) || 
      isSameDay(booking.endDate, day) || 
      (day > booking.startDate && day < booking.endDate)
    )

    return (
      <div className={`relative w-full h-full flex items-center justify-center ${isBooked ? 'opacity-70' : ''}`}>
        {isFestival && (
          <span className="absolute top-1 right-1 text-[8px] text-red-500 font-bold leading-none">
            <span className="block w-1 h-1 bg-red-500 rounded-full" />
          </span>
        )}
        <span className={isBooked ? 'text-gray-400 font-medium' : ''}>
          {format(day, 'd')}
        </span>
      </div>
    )
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><Loading size="lg" text="Preparing your escape..." /></div>
  if (!farmhouse) return null

  const staticAmenities = [
    { key: 'pool', label: 'Private Pool', icon: Waves },
    { key: 'wifi', label: 'High-speed WiFi', icon: Wifi },
    { key: 'ac', label: 'Air Conditioning', icon: Wind },
    { key: 'parking', label: 'Free Parking', icon: Car },
    { key: 'musicSystem', label: 'Music System', icon: Disc },
    { key: 'tv', label: 'Smart TV', icon: Tv },
    { key: 'kitchen', label: 'Fully Equipped Kitchen', icon: Refrigerator },
    { key: 'bbq', label: 'BBQ Grill', icon: Utensils },
    { key: 'lawn', label: 'Spacious Lawn', icon: Trees },
  ].filter(amn => farmhouse.amenities?.[amn.key])

  const extraAmenities = (farmhouse.amenities?.extraAmenities || [])
    .filter(amn => amn.available && amn.name)
    .map(amn => ({ label: amn.name, icon: ShieldCheck }))

  const amenitiesList = [...staticAmenities, ...extraAmenities]

  return (
    <>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div id="desktop-hero-section" className="hidden lg:block bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header Info */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                  {farmhouse.title}
                </h1>
                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary-600" />
                    <span className="text-sm font-medium">{farmhouse.address?.city}, {farmhouse.address?.state}</span>
                    <div className="flex items-center gap-1.5 ml-3 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[10px] rounded-md font-black uppercase tracking-wider border border-green-100 dark:border-green-900/30">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold text-gray-900 dark:text-white">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>4.6</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex items-baseline gap-2">
                  {/* <span className="text-sm text-gray-400 line-through">₹6,900</span> */}
                  {/* <span className="text-3xl font-bold text-primary-600">₹{farmhouse.pricing?.[getTierForDate(dateRange[0].startDate)]?.rate12h}</span> */}
                  {/* <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <Ticket className="w-3 h-3" />
                    35% off
                  </span> */}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleShare} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-400">
                    <Share2 className="w-5 h-5" />
                  </button>
                  {/* <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-600 dark:text-gray-400">
                    <Heart className="w-5 h-5" />
                  </button> */}
                </div>
              </div>
            </div>


            {/* Image Grid + Property Details Stack */}
            <div className="grid grid-cols-4 gap-4 h-[580px] rounded-2xl overflow-hidden relative">
              {/* Left Side: 3 Image Grid */}
              <div className="col-span-3 grid grid-cols-3 grid-rows-2 gap-3 h-full">
                <div className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden rounded-l-2xl" onClick={() => setActiveImageIdx(0)}>
                  <img
                    src={getImageUrl(farmhouse.banners?.[0])}
                    alt={farmhouse.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="relative group cursor-pointer overflow-hidden" onClick={() => setActiveImageIdx(1 % (farmhouse.banners?.length || 1))}>
                  <img
                    src={getImageUrl(farmhouse.banners?.[1 % (farmhouse.banners?.length || 1)])}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="relative group cursor-pointer overflow-hidden" onClick={() => setActiveImageIdx(2 % (farmhouse.banners?.length || 1))}>
                  <img
                    src={getImageUrl(farmhouse.banners?.[2 % (farmhouse.banners?.length || 1)])}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <button 
                    onClick={() => setIsGalleryModalOpen(true)}
                    className="absolute bottom-4 right-4 bg-white/95 backdrop-blur px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-black text-gray-900 shadow-2xl flex items-center gap-2 hover:bg-white transition-all transform hover:scale-105 active:scale-95 z-10"
                  >
                    <ImageIcon className="w-4 h-4 text-primary-600" />
                    View All { (farmhouse.banners?.length || 0) + (farmhouse.farmhouseImages?.length || 0) } Photos
                  </button>
                </div>
              </div>

              {/* Right Side: Details Stack */}
              <div className="col-span-1 flex flex-col gap-3 h-full">
                <div className="flex-1 flex items-center gap-4 p-5 bg-primary-50/40 dark:bg-primary-900/10 rounded-lg border border-primary-100/50 dark:border-primary-900/20">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-primary-600 group-hover:scale-110 transition-transform">
                    <Bed className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-base font-black text-gray-900 dark:text-white leading-tight">{farmhouse.amenities?.bedrooms || 0} Bedrooms</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Private Quarters</p>
                  </div>
                </div>

                <div className="flex-1 flex items-center gap-4 p-5 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-primary-600 group-hover:scale-110 transition-transform">
                    <Bath className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-base font-black text-gray-900 dark:text-white leading-tight">{farmhouse.amenities?.bathrooms || 0} Bathrooms</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Washrooms</p>
                  </div>
                </div>

                <div className="flex-1 flex items-center gap-4 p-5 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700/50">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-primary-600 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-base font-black text-gray-900 dark:text-white leading-tight">{farmhouse.amenities?.guests || 0} Guest Capacity</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">Maximum Occupancy</p>
                  </div>
                </div>

                <div className="flex-1 flex items-center gap-4 p-5 bg-blue-50/40 dark:bg-blue-900/10 rounded-lg border border-blue-100/50 dark:border-blue-900/20">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-blue-600/60 dark:text-blue-400/60 font-black uppercase tracking-widest mb-1">Check-in</p>
                    <p className="text-base font-black text-gray-900 dark:text-white leading-none">{formatTime(farmhouse.checkInTime)}</p>
                  </div>
                </div>

                <div className="flex-1 flex items-center gap-4 p-5 bg-blue-50/40 dark:bg-blue-900/10 rounded-lg border border-blue-100/50 dark:border-blue-900/20">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-blue-600 group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-blue-600/60 dark:text-blue-400/60 font-black uppercase tracking-widest mb-1">Check-out</p>
                    <p className="text-base font-black text-gray-900 dark:text-white leading-none">{formatTime(farmhouse.checkOutTime)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Hero Section */}
        <div className="lg:hidden relative w-full h-[350px] overflow-hidden bg-gray-900">
          <img
            src={getImageUrl(farmhouse.banners[activeImageIdx])}
            alt={farmhouse.title}
            className="w-full h-full object-cover transition-all duration-500"
          />
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white text-[10px] font-black uppercase tracking-widest border border-white/10">
              {activeImageIdx + 1} / {farmhouse.banners?.length || 0}
            </div>
            <button 
              onClick={() => setIsGalleryModalOpen(true)}
              className="px-3 py-1.5 bg-white backdrop-blur-md rounded-lg text-gray-900 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl transition-all active:scale-95"
            >
              <ImageIcon className="w-3 h-3" />
              Photos
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-black/80 via-black/20 to-transparent">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">{farmhouse.title}</h1>
                <div className="flex flex-wrap items-center gap-3 md:gap-4 text-white/90">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary-400" />
                    <span className="text-sm font-medium">{farmhouse.address?.city}</span>
                    <span className="mx-1 text-white/40">•</span>
                    <ShieldCheck className="w-4 h-4 text-green-400" />
                    <span className="text-[10px] font-black uppercase text-green-400">Verified</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">{farmhouse.amenities?.guests} Guests</span>
                  </div>
                </div>
              </div>
              <button onClick={handleShare} className="flex-shrink-0 p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded border border-white/20 transition-all text-white">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Capacity Badges & Timings - Shared for Mobile (Hidden on Desktop because it's in the hero stack) */}
          <div className="flex lg:hidden flex-wrap gap-3 sm:gap-4 mb-8">
            <div className="flex flex-1 min-w-[120px] items-center gap-2 px-3 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
              <Bed className="w-4 h-4 text-primary-600" />
              <span>{farmhouse.amenities?.bedrooms || 0} Bedrooms</span>
            </div>
            <div className="flex flex-1 min-w-[120px] items-center gap-2 px-3 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
              <Bath className="w-4 h-4 text-primary-600" />
              <span>{farmhouse.amenities?.bathrooms || 0} Bathrooms</span>
            </div>
            <div className="flex flex-1 min-w-[120px] items-center gap-2 px-3 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700">
              <Users className="w-4 h-4 text-primary-600" />
              <span>{farmhouse.amenities?.guests || 0} Guests</span>
            </div>
            <div className="flex flex-1 min-w-[140px] items-center gap-2 px-3 py-3 bg-primary-50 dark:bg-primary-900/10 rounded-xl text-xs font-medium text-primary-700 dark:text-primary-300 border border-primary-100/50 dark:border-primary-900/30">
              <Clock className="w-4 h-4" />
              <span>In: {formatTime(farmhouse.checkInTime)}</span>
            </div>
            <div className="flex flex-1 min-w-[140px] items-center gap-2 px-3 py-3 bg-primary-50 dark:bg-primary-900/10 rounded-xl text-xs font-medium text-primary-700 dark:text-primary-300 border border-primary-100/50 dark:border-primary-900/30">
              <Clock className="w-4 h-4" />
              <span>Out: {formatTime(farmhouse.checkOutTime)}</span>
            </div>
          </div>

          <div className={`grid gap-8 ${showBookingCard ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {/* Left Column - Main Content */}
            <div className={`space-y-8 ${showBookingCard ? 'lg:col-span-2' : ''}`}>


              {/* Description Section */}
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About the Property</h2>
                <div className="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-base max-w-none dark:prose-invert">
                  <div
                    className={!isDescriptionExpanded ? 'line-clamp-4' : ''}
                    dangerouslySetInnerHTML={{ __html: farmhouse.description }}
                  />
                  {farmhouse.description?.length > 300 && (
                    <div className="mt-4">
                      <button
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold text-sm transition-colors flex items-center gap-1"
                      >
                        <span>{isDescriptionExpanded ? 'Show Less' : 'Read More'}</span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${isDescriptionExpanded ? 'rotate-90' : '-rotate-90'}`} />
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
                /* Fix for rich text editor content showing as black in dark mode */
                .dark .prose { color: #d1d5db !important; }
                .dark .prose * { color: inherit !important; }
              `}</style>
              </div>

              {/* Venue Location Section */}
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Venue Information</h2>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                      {farmhouse.address?.landmark || farmhouse.address?.city || 'Farmhouse Location'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                      {farmhouse.address?.fullAddress}, {farmhouse.address?.city}
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(farmhouse.address?.fullAddress + ', ' + farmhouse.address?.city)}`}
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

              {/* Amenities Section */}
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">What this place offers</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                  {amenitiesList.map((amn, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/10 rounded flex items-center justify-center text-primary-600">
                        <amn.icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{amn.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Section */}
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Pricing Information</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-gray-400 text-[10px] uppercase font-black tracking-widest">
                        <th className="pb-1 px-4">Rate Category</th>
                        <th className="pb-1 text-right">12 Hours Stay</th>
                        <th className="pb-1 px-4 text-right">24 Hours Stay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {['regular', 'weekend', 'festival'].map(tier => (
                        <tr key={tier} className="bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 transition-colors hover:bg-gray-100/50 dark:hover:bg-white/10 group">
                          <td className="py-4 px-4 rounded-l-xl font-bold capitalize flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${tier === 'festival' ? 'bg-red-500' : tier === 'weekend' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                             {tier}
                             {tier === 'festival' && <span className="ml-1.5 py-0.5 px-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] rounded-full font-black uppercase tracking-tight">Special Event</span>}
                          </td>
                          <td className="py-4 text-right font-black text-gray-900 dark:text-white">₹{farmhouse.pricing?.[tier]?.rate12h}</td>
                          <td className="py-4 px-4 text-right font-black text-primary-600 rounded-r-xl">₹{farmhouse.pricing?.[tier]?.rate24h}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Organizer Section */}
              {farmhouse.organizer && (
                <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Property Owner
                  </h2>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
                      <span className="text-lg font-semibold text-primary-600 dark:text-primary-400">
                        {farmhouse.organizer.name?.[0]?.toUpperCase() || 'O'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                        {farmhouse.organizer.name || 'Owner'}
                      </h3>
                      <div className="flex flex-col gap-1">
                        {farmhouse.organizer.contactInfo && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {farmhouse.organizer.contactInfo}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Important Notes Section */}
              {farmhouse.notes && (
                <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    Important Notes
                  </h2>
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-base max-w-none dark:prose-invert">
                    <div
                      className={!isNotesExpanded ? 'line-clamp-3' : ''}
                      dangerouslySetInnerHTML={{ __html: farmhouse.notes }}
                    />
                    {farmhouse.notes?.length > 200 && (
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
                </div>
              )}

              {/* Terms & Conditions Section */}
              {farmhouse.termsAndConditions && (
                <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    House Rules
                  </h2>
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-base max-w-none dark:prose-invert">
                    <div
                      className={!isTermsExpanded ? 'line-clamp-3' : ''}
                      dangerouslySetInnerHTML={{ __html: farmhouse.termsAndConditions }}
                    />
                    {farmhouse.termsAndConditions?.length > 200 && (
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
                </div>
              )}

              {/* Enquiry Form Section */}
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Have Questions?</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Send an enquiry to the organizer</p>
                  </div>
                </div>

                <form onSubmit={handleEnquirySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          placeholder="John Doe"
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                          value={enquiryForm.name}
                          onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mobile Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          required
                          placeholder="10-digit mobile"
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                          value={enquiryForm.mobile}
                          onChange={(e) => setEnquiryForm({ ...enquiryForm, mobile: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email (Optional)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        placeholder="john@example.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                        value={enquiryForm.email}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Message *</label>
                    <textarea
                      required
                      rows="4"
                      placeholder="Tell us about your event, number of guests, or any special requests..."
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm resize-none"
                      value={enquiryForm.message}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={enquiryLoading}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-lg shadow-primary-500/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                  >
                    {enquiryLoading ? (
                      <Loading size="sm" />
                    ) : (
                      <>
                        <span>Submit Enquiry</span>
                        <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column - Booking Card - Shows after scrolling past hero */}
            {showBookingCard && (
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-24">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
                    {/* Main Booking Content */}
                    <div className="space-y-6">
                      {/* Date Indicator */}
                       <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {format(dateRange[0].startDate, 'dd MMM')} - {format(dateRange[0].endDate, 'dd MMM')}
                            </span>
                            <span className="text-[10px] text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full w-max font-bold">
                              {differenceInDays(dateRange[0].endDate, dateRange[0].startDate) === 0 ? '1-Day' : `${differenceInDays(dateRange[0].endDate, dateRange[0].startDate)} Nights`}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => setShowCalendar(true)}
                          className="text-sm font-bold text-primary-600 hover:text-primary-700 underline underline-offset-4 decoration-primary-200 "
                        >
                          Change
                        </button>
                      </div>

                      {/* Location Chip */}
                      <div className="flex items-center gap-2 py-2 border-t border-gray-100 dark:border-gray-700">
                        <MapPin className="w-4 h-4 text-primary-500 shrink-0" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 line-clamp-1">
                          {farmhouse.address?.city}, {farmhouse.address?.state}
                        </span>
                      </div>

                      {/* Security Deposit Card */}
                      <div className="flex items-start gap-4 p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/50 shadow-sm relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                         <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <ShieldCheck className="w-6 h-6 text-blue-600" />
                         </div>
                         <div className="flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                               <span className="text-xl font-black text-gray-900 dark:text-white">₹{depositValue}</span>
                               <span className="text-[10px] font-black text-blue-600 bg-white border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Secure</span>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Refundable Security Deposit</p>
                         </div>
                      </div>

                      {/* Pricing Table View */}
                      <div className="bg-gray-50 dark:bg-black/20 rounded-lg p-5 border border-gray-100 dark:border-gray-700/50 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500 font-medium">Applied Rate Tier</span>
                          <span className="inline-block px-3 py-1 bg-primary-600 text-white text-[10px] font-black rounded uppercase tracking-wider">
                            {getTierForDate(dateRange[0].startDate)} RATE
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Accommodation Fare</span>
                            <span className="font-bold text-gray-900 dark:text-white">₹{totalPrice}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Security Deposit</span>
                            <span className="font-bold text-gray-900 dark:text-white">₹{depositValue}</span>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-dashed border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Total Amount</p>
                              <p className="text-3xl font-black text-primary-600 tracking-tight">₹{totalPrice + depositValue}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                               <span className="px-4 py-1.5 bg-primary-50 text-primary-700 text-[10px] font-black rounded-lg uppercase border border-primary-200 shadow-sm">
                                 PAY NOW
                               </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2">
                        <button
                          onClick={handleBooking}
                          disabled={bookingLoading || !isAvailable || availabilityLoading}
                          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white font-black py-3 px-4 rounded-lg transition-all transform active:scale-[0.98] text-lg shadow-lg shadow-primary-500/20"
                        >
                          {bookingLoading || availabilityLoading ? (
                             <Loading size="sm" /> 
                          ) : !isAvailable ? (
                             "Dates Unavailable"
                          ) : (
                             "Reserve Now"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Mobile Book Now Button */}
        {farmhouse && (
          <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300 ease-in-out ${showStickyButton
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-full pointer-events-none'
            }`}>
            <div className="max-w-7xl mx-auto px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-lg sm:text-xl font-bold text-primary-600 dark:text-primary-400">
                    ₹{totalPrice + depositValue}
                  </p>
                  <p className="text-[10px] text-gray-500">Includes refundable deposit</p>
                </div>
                <button
                  onClick={handleBooking}
                  disabled={bookingLoading || !isAvailable || availabilityLoading}
                  className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white font-bold py-2.5 px-6 rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400"
                >
                  {!isAvailable ? "Occupied" : "Reserve Now"}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Photos Gallery Modal */}
        {isGalleryModalOpen && (
          <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-950 overflow-y-auto animate-fadeIn">
            <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">Property Gallery</h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{farmhouse.title}</p>
              </div>
              <button 
                onClick={() => setIsGalleryModalOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            
            <div className="max-w-7xl mx-auto p-6">
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {[...(farmhouse.banners || []), ...(farmhouse.farmhouseImages || [])].map((img, idx) => (
                  <div key={idx} className="break-inside-avoid rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
                    <img 
                      src={getImageUrl(img)} 
                      alt={`Gallery ${idx}`}
                      className="w-full h-auto object-cover min-h-[200px]"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-12 text-center border-t border-gray-50 dark:border-gray-900 mt-8">
              <p className="text-sm text-gray-400 font-medium">End of Gallery • { (farmhouse.banners?.length || 0) + (farmhouse.farmhouseImages?.length || 0) } Photos</p>
            </div>
          </div>
        )}
        {/* Date Selection Modal */}
        {showCalendar && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCalendar(false)} />
            <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900 sticky top-0 z-10">
                <div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select Dates</h3>
                   <div className="flex gap-4 mt-1">
                      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-gray-400">
                        <div className="w-2 h-2 bg-gray-200 rounded-full" /> Booked
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-gray-400">
                        <div className="w-2 h-2 bg-blue-500 rounded-full opacity-30" /> Weekend
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-gray-400">
                        <div className="w-2 h-2 bg-red-500 rounded-full" /> Festival
                      </div>
                   </div>
                </div>
                <button 
                  onClick={() => setShowCalendar(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[80vh] p-4 sm:p-6 custom-scrollbar">
                <div className="flex justify-center">
                  <DateRange
                    editableDateInputs={true}
                    onChange={item => setDateRange([item.selection])}
                    moveRangeOnFirstSelection={false}
                    ranges={dateRange}
                    minDate={new Date()}
                    months={window.innerWidth > 640 ? 2 : 1}
                    direction={window.innerWidth > 640 ? "horizontal" : "vertical"}
                    disabledDates={bookedDates.flatMap(booking =>
                      eachDayOfInterval({ start: booking.startDate, end: booking.endDate })
                    )}
                    rangeColors={['#e11d48']}
                    dayContentRenderer={renderDayContent}
                    staticRanges={[]}
                    inputRanges={[]}
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                    <div className="text-center sm:text-left">
                       <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Check-in</p>
                       <p className="text-sm font-bold text-gray-900 dark:text-white">{format(dateRange[0].startDate, 'MMM dd, yyyy')}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                    <div className="text-center sm:text-left">
                       <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Check-out</p>
                       <p className="text-sm font-bold text-gray-900 dark:text-white">{format(dateRange[0].endDate, 'MMM dd, yyyy')}</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setShowCalendar(false)}
                   className="w-full sm:w-auto px-8 py-3 bg-primary-600 text-white font-black rounded-xl shadow-lg shadow-primary-500/20 active:scale-95 transition-all text-sm uppercase tracking-wider"
                 >
                   Apply Dates
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default FarmhouseDetail
