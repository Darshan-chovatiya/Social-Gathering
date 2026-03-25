import { useState, useEffect } from 'react'
import api from '../../utils/api'
import Modal from '../common/Modal'
import Loading from '../common/Loading'
import { Calendar, MapPin, Clock, DollarSign, CheckCircle, Clock as ClockIcon, XCircle, Image as ImageIcon, User, FileText, AlertCircle, Award, Globe, Facebook, Twitter, Instagram, Linkedin, Youtube, CreditCard } from 'lucide-react'
import { format } from 'date-fns'

// Component to display ticket description with read more/less functionality
const TicketDescription = ({ description }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Strip HTML tags to get plain text for character counting
  const stripHtml = (html) => {
    if (!html) return ''
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }
  
  const plainText = stripHtml(description)
  const shouldTruncate = plainText.length > 30
  
  if (!shouldTruncate) {
    return (
      <div 
        className="text-sm text-gray-600 mt-2 rich-text-content"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    )
  }
  
  if (isExpanded) {
    return (
      <div className="mt-2">
        <div 
          className="text-sm text-gray-600 rich-text-content"
          dangerouslySetInnerHTML={{ __html: description }}
        />
        <button
          onClick={() => setIsExpanded(false)}
          className="text-xs text-primary-600 hover:text-primary-700 mt-1 font-medium"
        >
          Read less
        </button>
      </div>
    )
  }
  
  // Show truncated version (first 30 characters of plain text)
  const truncatedText = plainText.substring(0, 30) + '...'
  
  return (
    <div className="mt-2">
      <p className="text-sm text-gray-600">{truncatedText}</p>
      <button
        onClick={() => setIsExpanded(true)}
        className="text-xs text-primary-600 hover:text-primary-700 mt-1 font-medium"
      >
        Read more
      </button>
    </div>
  )
}

const ViewEventModal = ({ isOpen, onClose, eventId }) => {
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imageErrors, setImageErrors] = useState(new Set()) // Track image load errors

  useEffect(() => {
    if (isOpen && eventId) {
      fetchEvent()
    } else {
      setEvent(null)
    }
  }, [isOpen, eventId])

  const fetchEvent = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/organizer/events/${eventId}`)
      if (response.data.status === 200) {
        setEvent(response.data.result.event)
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      approved: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Approved' },
      pending: { icon: ClockIcon, color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Pending' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' },
      draft: { icon: ClockIcon, color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Draft' },
      cancelled: { icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200', label: 'Cancelled' },
    }
    const badge = badges[status] || badges.pending
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    )
  }

  if (!isOpen) return null

  const footer = (
    <div className="flex justify-end gap-3 p-4">
      <button
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Close
      </button>
    </div>
  )

  return (
    <>
      <style>{`
        .rich-text-content b,
        .rich-text-content strong {
          font-weight: 600;
        }
        .rich-text-content i,
        .rich-text-content em {
          font-style: italic;
        }
        .rich-text-content u {
          text-decoration: underline;
        }
        .rich-text-content s,
        .rich-text-content strike {
          text-decoration: line-through;
        }
        .rich-text-content code {
          background-color: #f3f4f6;
          padding: 2px 4px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.875em;
        }
        .rich-text-content a {
          color: #3b82f6;
          text-decoration: underline;
        }
        .rich-text-content a:hover {
          color: #2563eb;
        }
        .rich-text-content ul,
        .rich-text-content ol {
          margin-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .rich-text-content ul {
          list-style-type: disc;
        }
        .rich-text-content ol {
          list-style-type: decimal;
        }
        .rich-text-content li {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }
        .rich-text-content p {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .rich-text-content p:first-child {
          margin-top: 0;
        }
        .rich-text-content p:last-child {
          margin-bottom: 0;
        }
      `}</style>
      <Modal isOpen={isOpen} onClose={onClose} title={event ? event.title : "Event Details"} size="lg" footer={footer}>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loading text="Loading event details..." />
        </div>
      ) : event ? (
        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Status:</span>
              {getStatusBadge(event.status)}
            </div>
            {event.isFeatured && (
              <span className="px-3 py-1.5 bg-primary-100 text-primary-800 border border-primary-200 rounded-lg text-sm font-semibold">
                Featured
              </span>
            )}
          </div>

          {/* Description */}
          <div className="pb-4 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
            <div 
              className="text-sm text-gray-600 leading-relaxed rich-text-content"
              dangerouslySetInnerHTML={{ __html: event.description || '' }}
            />
          </div>

          {/* Event Detail Image */}
          {event.eventDetailImage && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary-600" />
                Event Detail Image
              </h4>
              <div>
                {imageErrors.has('eventDetailImage') ? (
                  <div className="w-48 h-96 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg border border-gray-200 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-primary-600" />
                  </div>
                ) : (
                  <img
                    src={event.eventDetailImage.startsWith('http') 
                      ? event.eventDetailImage 
                      : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${event.eventDetailImage}`}
                    alt="Event Detail"
                    className="w-48 h-96 object-contain rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                    onError={() => setImageErrors(prev => new Set([...prev, 'eventDetailImage']))}
                  />
                )}
              </div>
            </div>
          )}

          {/* Banner Images */}
          {event.banners && event.banners.length > 0 && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary-600" />
                Banner Images
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {event.banners.map((banner, index) => {
                  const imageUrl = banner.startsWith('http') 
                    ? banner 
                    : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${banner}`
                  const imageKey = `banner_${index}`
                  return (
                    <div key={index} className="relative group">
                      {imageErrors.has(imageKey) ? (
                        <div className="w-full h-40 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg border border-gray-200 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-primary-600" />
                        </div>
                      ) : (
                        <img
                          src={imageUrl}
                          alt={`Banner ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                          onError={() => setImageErrors(prev => new Set([...prev, imageKey]))}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Event Images */}
          {event.eventImages && event.eventImages.length > 0 && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary-600" />
                Event Images
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {event.eventImages.map((image, index) => {
                  const imageUrl = image.startsWith('http') 
                    ? image 
                    : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${image}`
                  const imageKey = `eventImage_${index}`
                  return (
                    <div key={index} className="relative group">
                      {imageErrors.has(imageKey) ? (
                        <div className="w-full h-40 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg border border-gray-200 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-primary-600" />
                        </div>
                      ) : (
                        <img
                          src={imageUrl}
                          alt={`Event Image ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                          onError={() => setImageErrors(prev => new Set([...prev, imageKey]))}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Categories */}
          {event.categories && event.categories.length > 0 && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Categories</h4>
              <div className="flex flex-wrap gap-2">
                {event.categories.map((cat) => (
                  <span
                    key={cat._id || cat}
                    className="px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg text-sm font-medium"
                  >
                    {cat.name || cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sponsors */}
          {event.sponsors && event.sponsors.length > 0 && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-primary-600" />
                Sponsors
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.sponsors.map((sponsor) => {
                  const sponsorData = sponsor._id ? sponsor : event.sponsors.find(s => s._id === sponsor)
                  if (!sponsorData) return null
                  
                  const getTypeLabel = (type) => {
                    const labels = {
                      'sponsor': 'Sponsor',
                      'co-sponsor': 'Co-Sponsor',
                      'community partner': 'Community Partner',
                      'technology partner': 'Technology Partner',
                      'social media partner': 'Social Media Partner',
                    }
                    return labels[type] || type
                  }

                  const getTypeColor = (type) => {
                    const colors = {
                      'sponsor': 'bg-blue-100 text-blue-800 border-blue-200',
                      'co-sponsor': 'bg-purple-100 text-purple-800 border-purple-200',
                      'community partner': 'bg-green-100 text-green-800 border-green-200',
                      'technology partner': 'bg-orange-100 text-orange-800 border-orange-200',
                      'social media partner': 'bg-pink-100 text-pink-800 border-pink-200',
                    }
                    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200'
                  }

                  return (
                    <div
                      key={sponsorData._id || sponsor}
                      className="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {sponsorData.logo ? (
                          imageErrors.has(`sponsor_${sponsorData._id}`) ? (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                              <Award className="w-8 h-8 text-gray-400" />
                            </div>
                          ) : (
                            <img
                              src={sponsorData.logo.startsWith('http') 
                                ? sponsorData.logo 
                                : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${sponsorData.logo}`}
                              alt={sponsorData.name}
                              className="w-16 h-16 object-contain rounded-lg border border-gray-200 flex-shrink-0"
                              onError={() => setImageErrors(prev => new Set([...prev, `sponsor_${sponsorData._id}`]))}
                            />
                          )
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                            <Award className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-semibold text-gray-900 text-sm">{sponsorData.name}</h5>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(sponsorData.type)}`}>
                              {getTypeLabel(sponsorData.type)}
                            </span>
                          </div>
                          
                          {/* Social Media Links */}
                          {(sponsorData.website || sponsorData.socialMedia) && (
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {sponsorData.website && (
                                <a
                                  href={sponsorData.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                  title="Website"
                                >
                                  <Globe className="w-4 h-4" />
                                </a>
                              )}
                              {sponsorData.socialMedia?.facebook && (
                                <a
                                  href={sponsorData.socialMedia.facebook}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Facebook"
                                >
                                  <Facebook className="w-4 h-4" />
                                </a>
                              )}
                              {sponsorData.socialMedia?.twitter && (
                                <a
                                  href={sponsorData.socialMedia.twitter}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-600 hover:text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Twitter"
                                >
                                  <Twitter className="w-4 h-4" />
                                </a>
                              )}
                              {sponsorData.socialMedia?.instagram && (
                                <a
                                  href={sponsorData.socialMedia.instagram}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                                  title="Instagram"
                                >
                                  <Instagram className="w-4 h-4" />
                                </a>
                              )}
                              {sponsorData.socialMedia?.linkedin && (
                                <a
                                  href={sponsorData.socialMedia.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="LinkedIn"
                                >
                                  <Linkedin className="w-4 h-4" />
                                </a>
                              )}
                              {sponsorData.socialMedia?.youtube && (
                                <a
                                  href={sponsorData.socialMedia.youtube}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="YouTube"
                                >
                                  <Youtube className="w-4 h-4" />
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

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-gray-200">
            {/* Location */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <MapPin className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Location</h4>
                <p className="text-sm text-gray-600 mb-1">{event.address?.fullAddress}</p>
                <p className="text-sm text-gray-500">
                  {event.address?.city}, {event.address?.state} - {event.address?.pincode}
                </p>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="p-2 bg-white rounded-lg border border-gray-200">
                <Clock className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Duration</h4>
                <p className="text-sm text-gray-600">{event.duration} hours</p>
              </div>
            </div>
          </div>

          {/* Slots */}
          {event.slots && event.slots.length > 0 && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-600" />
                Event Slots
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {event.slots.map((slot, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900">
                        {format(new Date(slot.date), 'MMM d, yyyy')}
                      </p>
                      {slot.isActive ? (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold">
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-800 border border-gray-200 rounded-lg text-xs font-semibold">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {slot.startTime} - {slot.endTime}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ticket Types */}
          {event.ticketTypes && event.ticketTypes.length > 0 && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary-600" />
                Ticket Types
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                {event.ticketTypes.map((ticket, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors h-auto"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900">{ticket.title}</p>
                      <p className="font-bold text-primary-600 text-lg">₹{ticket.price}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm mb-2">
                      <span className="text-gray-600">
                        Available: <span className="font-medium text-gray-900">{ticket.availableQuantity}</span>
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">
                        Total: <span className="font-medium text-gray-900">{ticket.totalQuantity}</span>
                      </span>
                    </div>
                    {ticket.description && (
                      <TicketDescription description={ticket.description} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Organizer Info */}
          {event.organizer && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-primary-600" />
                Organizer Information
              </h4>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-500">Name</span>
                    <p className="text-sm text-gray-900 font-medium">{event.organizer.name}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">Contact</span>
                    <p className="text-sm text-gray-900">{event.organizer.contactInfo}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Configuration */}
          {event.paymentConfig && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary-600" />
                Payment Configuration
              </h4>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-gray-500">Gateway</span>
                    <p className="text-sm text-gray-900 font-medium capitalize">{event.paymentConfig.gateway || '—'}</p>
                  </div>
                  {event.paymentConfig.gateway === 'razorpay' && event.paymentConfig.razorpay && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Key ID</span>
                        <p className="text-sm text-gray-700 font-mono truncate" title={event.paymentConfig.razorpay.keyId}>
                          {event.paymentConfig.razorpay.keyId ? `${String(event.paymentConfig.razorpay.keyId).slice(0, 8)}••••${String(event.paymentConfig.razorpay.keyId).slice(-4)}` : '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Key Secret</span>
                        <p className="text-sm text-gray-600">••••••••</p>
                      </div>
                    </div>
                  )}
                  {event.paymentConfig.gateway === 'cashfree' && event.paymentConfig.cashfree && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                      <div>
                        <span className="text-xs font-medium text-gray-500">App ID</span>
                        <p className="text-sm text-gray-700 truncate" title={event.paymentConfig.cashfree.appId}>
                          {event.paymentConfig.cashfree.appId ? '•••••••• Configured' : '—'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Secret Key</span>
                        <p className="text-sm text-gray-600">••••••••</p>
                      </div>
                    </div>
                  )}
                  {/* CCAvenue commented out - uncomment to show in view */}
                  {/*
                  {event.paymentConfig.gateway === 'ccavenue' && event.paymentConfig.ccavenue && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                      <div>
                        <span className="text-xs font-medium text-gray-500">Merchant ID</span>
                        <p className="text-sm text-gray-700 truncate">{event.paymentConfig.ccavenue.merchantId ? '•••• Configured' : '—'}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Access Code</span>
                        <p className="text-sm text-gray-600">••••••••</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">Working Key</span>
                        <p className="text-sm text-gray-600">••••••••</p>
                      </div>
                    </div>
                  )}
                  */}
                </div>
              </div>
            </div>
          )}

          {/* Terms & Conditions */}
          {event.termsAndConditions && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-600" />
                Terms & Conditions
              </h4>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div 
                  className="text-sm text-gray-600 leading-relaxed rich-text-content"
                  dangerouslySetInnerHTML={{ __html: event.termsAndConditions || '' }}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-600" />
                Notes
              </h4>
              <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div 
                  className="text-sm text-gray-600 leading-relaxed rich-text-content"
                  dangerouslySetInnerHTML={{ __html: event.notes || '' }}
                />
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {event.status === 'rejected' && event.rejectionReason && (
            <div className="pb-4 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Rejection Reason
              </h4>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">{event.rejectionReason}</p>
              </div>
            </div>
          )}

          {/* Created Date */}
          <div className="pt-2">
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>
                Created: <span className="font-medium text-gray-700">{format(new Date(event.createdAt), 'MMM d, yyyy HH:mm')}</span>
              </span>
              {event.approvedAt && (
                <span>
                  Approved: <span className="font-medium text-gray-700">{format(new Date(event.approvedAt), 'MMM d, yyyy HH:mm')}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>Event not found</p>
        </div>
      )}
    </Modal>
    </>
  )
}

export default ViewEventModal

