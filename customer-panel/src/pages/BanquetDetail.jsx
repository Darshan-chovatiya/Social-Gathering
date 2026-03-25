import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import Loading from '../components/common/Loading'
import { useToast } from '../components/common/ToastContainer'
import { useAuthStore } from '../store/authStore'
import {
  Building2, MapPin, Users, Star, Share2, Heart, ArrowRight, X,
  ChevronRight, Lightbulb, Info, ImageIcon, Mail, Phone,
  MessageSquare, Send, Layout, ShieldCheck, User, ChevronLeft, Car
} from 'lucide-react'

const BanquetDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuthStore()

  const [banquet, setBanquet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [enquiryLoading, setEnquiryLoading] = useState(false)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [isTermsExpanded, setIsTermsExpanded] = useState(false)
  const [isNotesExpanded, setIsNotesExpanded] = useState(false)
  const [showStickyButton, setShowStickyButton] = useState(true)

  const [enquiryForm, setEnquiryForm] = useState({
    name: '',
    mobile: '',
    email: '',
    message: ''
  })

  useEffect(() => {
    fetchBanquet()
  }, [id])

  useEffect(() => {
    if (user) {
      setEnquiryForm(prev => ({
        ...prev,
        name: user.name || '',
        mobile: user.mobile || '',
        email: user.email || ''
      }))
    }
  }, [user])

  // Scroll detection for sticky button
  useEffect(() => {
    if (!banquet) return

    const handleScroll = () => {
      if (window.innerWidth < 1024) {
        const scrollPosition = window.scrollY + window.innerHeight
        const documentHeight = document.documentElement.scrollHeight
        // Show sticky button except when at the very bottom (where the form is)
        setShowStickyButton(scrollPosition < documentHeight - 100)
      } else {
        setShowStickyButton(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [banquet])

  const fetchBanquet = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/banquets/public/${id}`)
      if (response.data.status === 200) {
        setBanquet(response.data.result.banquet)
      }
    } catch (error) {
      toast.error('Failed to load banquet details')
      navigate('/banquets')
    } finally {
      setLoading(false)
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
      const response = await api.post('/banquets/enquiry', {
        banquetId: id,
        ...enquiryForm
      })

      if (response.data.status === 201) {
        toast.success('Your enquiry has been submitted successfully!')
        setEnquiryForm(prev => ({ ...prev, message: '' }))
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit enquiry')
    } finally {
      setEnquiryLoading(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: banquet.title,
        text: `Check out this venue: ${banquet.title}`,
        url: window.location.href
      }).catch(console.error)
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  const getImageUrl = (path) => {
    if (!path) return ''
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '')
    return `${baseUrl}${path}`
  }

  if (!banquet) return null

  const allImages = [...(banquet.banners || []), ...(banquet.banquetImages || [])]
  const seatingCapacities = banquet.venues?.map(v => parseInt(v.seatingCapacity) || 0) || []
  const maxSeating = seatingCapacities.length > 0 ? Math.max(...seatingCapacities) : null
  const parkingAmenity = banquet.amenities?.find(a => a.name.toLowerCase().includes('parking') || a.name.toLowerCase().includes('valet'))

  const nextImage = (e) => {
    e?.stopPropagation()
    setActiveImageIdx((prev) => (prev + 1) % allImages.length)
  }
  const prevImage = (e) => {
    e?.stopPropagation()
    setActiveImageIdx((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Hero Section - Redesigned to match reference */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-gray-500 mb-6 uppercase tracking-wider">
          <span onClick={() => navigate('/')} className="hover:text-primary-600 cursor-pointer transition-colors">Home</span>
          <ChevronRight className="w-3 h-3" />
          <span onClick={() => navigate('/banquets')} className="hover:text-primary-600 cursor-pointer transition-colors">Banquets</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 dark:text-gray-300 truncate">{banquet.title}</span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col lg:flex-row transition-all duration-300">
          {/* Left: Image Carousel Section */}
          <div className="lg:w-[58%] relative group aspect-[4/3] lg:aspect-auto h-[300px] sm:h-[400px] lg:h-[550px] overflow-hidden bg-gray-900">
            <img
              src={getImageUrl(allImages[activeImageIdx])}
              alt={banquet.title}
              className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
            />
            
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            {/* Navigation Arrows */}
            <button 
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/50 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all z-10 hidden md:block"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/50 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-all z-10 hidden md:block"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Rating Badge (Bottom Left) */}
            <div className="absolute bottom-6 left-6 flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-black shadow-lg">
              <Star className="w-4 h-4 fill-white" />
              <span>4.9</span>
            </div>

            {/* Count Badge (Bottom Right) */}
            <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10">
              {activeImageIdx + 1} / {allImages.length}+
            </div>

            {/* Indicators (Dots) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
              {allImages.slice(0, Math.min(allImages.length, 6)).map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setActiveImageIdx(idx); }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${activeImageIdx === idx ? 'bg-white w-5' : 'bg-white/40 hover:bg-white/60'}`}
                />
              ))}
            </div>
          </div>

          {/* Right: Details Section */}
          <div className="lg:w-[42%] p-6 md:p-10 flex flex-col h-full">
            <div className="flex-1">
              <div className="flex justify-between items-start gap-4 mb-6">
                <div>
                  <span className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border border-primary-100 dark:border-primary-900/30">Premium Venue</span>
                </div>
                <div className="flex gap-2">
                  {/* <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-gray-700 dark:text-gray-200 transition-all shadow-sm group">
                    <Heart className="w-4 h-4 group-hover:fill-primary-500 group-hover:text-primary-500 transition-colors" />
                    <span className="text-xs font-bold hidden sm:inline">Shortlist</span>
                  </button> */}
                  <button onClick={handleShare} className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl text-gray-700 dark:text-gray-200 transition-all shadow-sm">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 dark:text-white mb-4 leading-tight uppercase tracking-tighter">
                {banquet.title}
              </h1>
              
              <div className="space-y-4 mb-8">
                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  {banquet.address?.fullAddress}
                </p>
                
                <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-sm hover:underline cursor-pointer group">
                  <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>{banquet.address?.city}</span>
                </div>
              </div>

              {/* Pricing - Using dynamic field if exists or consistent style */}
              {banquet.pricing && (
                <div className="mb-8 p-4 bg-primary-50/30 dark:bg-primary-900/10 rounded-2xl border border-primary-50 dark:border-primary-900/20">
                  <span className="text-3xl font-black text-gray-900 dark:text-white">₹{banquet.pricing}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm ml-2 font-medium">per plate</span>
                </div>
              )}

              {/* Highlight Pills */}
              <div className="flex flex-wrap gap-4 mb-8">
                {maxSeating && (
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 flex-1 min-w-[150px]">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-gray-500">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white leading-none mb-1.5">{maxSeating} Hall Capacity</p>
                      <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-none">Seating Available</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700 flex-1 min-w-[150px]">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm text-gray-500">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white leading-none mb-1.5">{parkingAmenity ? 'Ample Parking' : 'Street Parking'}</p>
                    <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-none">Parking Facility</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <button 
                onClick={() => document.getElementById('enquiry-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary-500/25 transition-all flex items-center justify-center gap-3 active:scale-95 transform"
              >
                <span>Send Enquiry Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Gallery Section */}
            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Gallery</h2>
                <div className="text-xs font-black text-gray-400">
                  {activeImageIdx + 1} / {allImages.length}
                </div>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-40 h-32 md:w-56 md:h-40 rounded-xl flex-shrink-0 overflow-hidden border-2 transition-all snap-start ${activeImageIdx === idx ? 'border-primary-600 scale-95 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={getImageUrl(img)} className="w-full h-full object-cover" alt="Venue" />
                  </button>
                ))}
              </div>
            </div>

            {/* Description Section */}
            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-tight">About Venue</h2>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-base max-w-none dark:prose-invert">
                <div
                  className={!isDescriptionExpanded ? 'line-clamp-4' : ''}
                  dangerouslySetInnerHTML={{ __html: banquet.description }}
                />
                {banquet.description?.length > 300 && (
                  <button
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="mt-4 text-primary-600 font-bold text-sm flex items-center gap-1 hover:underline"
                  >
                    <span>{isDescriptionExpanded ? 'Show Less' : 'Read More'}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isDescriptionExpanded ? 'rotate-90' : '-rotate-90'}`} />
                  </button>
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

            {/* Venues Section */}
            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-tight">Available Venues</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {banquet.venues?.map((venue, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start gap-4">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 flex-shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{venue.name}</h3>
                      <div className="flex gap-4 mt-1">
                        <p className="text-xs text-gray-500 font-medium">Seating: <span className="text-gray-900 dark:text-white font-bold">{venue.seatingCapacity}</span></p>
                        <p className="text-xs text-gray-500 font-medium">Floating: <span className="text-gray-900 dark:text-white font-bold">{venue.floatingCapacity}</span></p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities Section */}
            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-tight text-primary-600">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {banquet.amenities?.filter(a => a.available).map((amn, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg flex items-center justify-center text-emerald-600">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{amn.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rules & Notes Stack */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary-600" /> Venue Policies
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed prose prose-base max-w-none dark:prose-invert">
                  <div
                    className={!isTermsExpanded ? 'line-clamp-4' : ''}
                    dangerouslySetInnerHTML={{ __html: banquet.termsAndConditions }}
                  />
                  {banquet.termsAndConditions?.length > 200 && (
                    <button onClick={() => setIsTermsExpanded(!isTermsExpanded)} className="mt-2 text-primary-600 font-bold">
                      {isTermsExpanded ? 'Show Less' : 'Read More'}
                    </button>
                  )}
                </div>
              </div>

              {banquet.notes && (
                <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-500" /> Important Notes
                  </h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed prose prose-base max-w-none dark:prose-invert">
                    <div
                      className={!isNotesExpanded ? 'line-clamp-4' : ''}
                      dangerouslySetInnerHTML={{ __html: banquet.notes }}
                    />
                    {banquet.notes?.length > 200 && (
                      <button onClick={() => setIsNotesExpanded(!isNotesExpanded)} className="mt-2 text-primary-600 font-bold">
                        {isNotesExpanded ? 'Show Less' : 'Read More'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Address Information */}
            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-tight">Location</h2>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-600 flex-shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{banquet.address?.city}, {banquet.address?.state}</h3>
                  <p className="text-sm text-gray-500 mb-4">{banquet.address?.fullAddress} - {banquet.address?.pincode}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(banquet.title + ' ' + banquet.address?.fullAddress)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary-600 font-bold text-sm hover:underline"
                  >
                    View Directions <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Booking Card Style Enquiry */}
          <div className="lg:col-span-1" id="enquiry-section">
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                  <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-600">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">Express Inquiry</h2>
                    <p className="text-xs text-gray-500 font-medium">Fast response from organizer</p>
                  </div>
                </div>

                <form onSubmit={handleEnquirySubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text" required value={enquiryForm.name}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Mobile Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel" required value={enquiryForm.mobile}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, mobile: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="10-digit mobile"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email" value={enquiryForm.email}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Detailed Message</label>
                    <textarea
                      required rows="4" value={enquiryForm.message}
                      onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                      placeholder="Event type, date, number of guests..."
                    ></textarea>
                  </div>

                  <button
                    type="submit" disabled={enquiryLoading}
                    className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-primary-500/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                  >
                    {enquiryLoading ? <Loading size="sm" /> : (
                      <>
                        <span>Submit Enquiry</span>
                        <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Organizer Info Card */}
              <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 flex-shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Venue Managed By</h3>
                  <p className="text-sm font-bold text-gray-900 dark:text-white uppercase">{banquet.organizer.name}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Sticky Mobile Enquiry Button */}
      {banquet && (
        <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl transition-all duration-300 ease-in-out ${showStickyButton
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-full pointer-events-none'
          }`}>
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">{banquet.title}</h4>
                <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest">{banquet.venues?.length} Event Spaces Available</p>
              </div>
              <button
                onClick={() => document.getElementById('enquiry-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest text-[10px] py-3 px-6 rounded-xl shadow-lg shadow-primary-500/30 transition-all flex items-center gap-2"
              >
                <span>Send Enquiry</span>
                <MessageSquare className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BanquetDetail
