import { useState, useEffect } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { Link2, Copy, Users, Calendar, Ticket, Check, ExternalLink, ChevronDown, ChevronUp, Home, ChevronRight,X } from 'lucide-react'
import api from '../utils/api'
import Loading from '../components/common/Loading'
import EmptyState from '../components/common/EmptyState'

const AffiliateLinks = () => {
  const navigate = useNavigate()
  const [affiliateLinks, setAffiliateLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expandedLinks, setExpandedLinks] = useState({})
  const [copiedLinkId, setCopiedLinkId] = useState(null)
  const [referralsModalOpen, setReferralsModalOpen] = useState(false)
  const [selectedLinkId, setSelectedLinkId] = useState(null)
  const [selectedLinkReferralsCount, setSelectedLinkReferralsCount] = useState(0)

  useEffect(() => {
    fetchAffiliateLinks()
  }, [])

  const fetchAffiliateLinks = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/users/affiliate-links/my-links')
      
      if (response.data.status === 200) {
        setAffiliateLinks(response.data.result?.affiliateLinks || [])
      } else {
        setError(response.data.message || 'Failed to fetch affiliate links')
      }
    } catch (err) {
      console.error('Error fetching affiliate links:', err)
      setError(err.response?.data?.message || 'Failed to load affiliate links')
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (linkId, referralsCount = 0) => {
    // For desktop: keep inline expansion
    if (window.innerWidth >= 768) {
      setExpandedLinks(prev => ({
        ...prev,
        [linkId]: !prev[linkId]
      }))
    } else {
      // For mobile: open bottom modal
      setSelectedLinkId(linkId)
      setSelectedLinkReferralsCount(referralsCount)
      setReferralsModalOpen(true)
    }
  }

  const handleCloseReferralsModal = () => {
    setReferralsModalOpen(false)
    setSelectedLinkId(null)
    setSelectedLinkReferralsCount(0)
  }

  const copyToClipboard = async (text, linkId) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedLinkId(linkId)
      setTimeout(() => setCopiedLinkId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString('en-IN') || '0'}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loading size="lg" text="Loading affiliate links..." />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            icon={Link2}
            title="Error Loading Affiliate Links"
            message={error}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <NavLink
            to="/"
            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </NavLink>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <span className="text-gray-900 dark:text-white font-medium">My Affiliate Links</span>
        </nav>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Affiliate Links
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share your affiliate links and earn rewards when others book tickets
          </p>
        </div>

        {/* Affiliate Links List */}
        {affiliateLinks.length === 0 ? (
          <EmptyState
            icon={Link2}
            title="No Affiliate Links Yet"
            message="Affiliate links are created by organizers for your bookings. Once an organizer creates an affiliate link for your booking, it will appear here."
          />
        ) : (
          <div className="space-y-4">
            {affiliateLinks.map((link) => {
              const isExpanded = expandedLinks[link._id]
              const isCopied = copiedLinkId === link._id
              const eventId = link.eventId?._id || link.eventId
              const eventTitle = link.eventId?.title || 'Event'
              const stats = link.statistics || { totalReferrals: 0, totalRevenue: 0 }

              return (
                <div
                  key={link._id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Main Link Card */}
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left Side - Link Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                            <Link2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
                              {eventTitle}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-mono font-semibold">
                                {link.affiliateCode}
                              </span>
                              {link.bookingId && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Booking: {link.bookingId?.bookingId || 'N/A'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 flex-wrap mt-3">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {stats.totalReferrals}
                              </span> Referral{stats.totalReferrals !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {link.createdAt && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Created {formatDate(link.createdAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Side - Actions */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:flex-shrink-0">
                        {/* Copy Link Button */}
                        <button
                          onClick={() => copyToClipboard(link.affiliateUrl, link._id)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600 text-gray-900 rounded-lg text-sm font-semibold transition-colors"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy Link
                            </>
                          )}
                        </button>

                        {/* View Referrals Button */}
                        {stats.totalReferrals > 0 && (
                          <button
                            onClick={() => toggleExpand(link._id, stats.totalReferrals)}
                            className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-primary-600 text-primary-600 dark:text-primary-400 rounded-lg text-sm font-semibold hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                Hide Referrals
                                <ChevronUp className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                View Referrals ({stats.totalReferrals})
                                <ChevronDown className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Affiliate URL Display */}
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                          Affiliate Link:
                        </span>
                        <a
                          href={link.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-sm text-primary-600 dark:text-primary-400 hover:underline truncate"
                        >
                          {link.affiliateUrl}
                        </a>
                        <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Referrals Section - Desktop Only */}
                  {isExpanded && stats.totalReferrals > 0 && (
                    <div className="hidden md:block border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                      <ReferralsList linkId={link._id} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Mobile Referrals Modal - Bottom Slide Up */}
        {referralsModalOpen && selectedLinkId && (
          <>
            <div 
              className="md:hidden fixed inset-0 z-[100] bg-black/50 backdrop-blur-md animate-fade-in" 
              onClick={handleCloseReferralsModal}
              style={{ backdropFilter: 'blur(8px)' }}
            />
            <div 
              className="md:hidden fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-gray-800 w-full flex flex-col rounded-t-2xl shadow-2xl animate-slide-up" 
              style={{ 
                margin: 0, 
                padding: 0, 
                bottom: 0,
                height: selectedLinkReferralsCount > 1 ? '70vh' : 'auto',
                maxHeight: selectedLinkReferralsCount > 1 ? '70vh' : 'none'
              }}
            >
              {/* Drag Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-16 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  Referrals
                </h2>
                <button
                  onClick={handleCloseReferralsModal}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              
              {/* Content - Scrollable */}
              <div 
                className={`flex-1 overflow-y-auto px-4 ${selectedLinkReferralsCount > 1 ? 'py-4' : 'py-2'}`} 
                style={{ minHeight: 0, maxHeight: selectedLinkReferralsCount > 1 ? 'calc(70vh - 140px)' : 'none' }}
              >
                <ReferralsList linkId={selectedLinkId} />
              </div>
              
              {/* Footer - Always visible at bottom */}
              <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCloseReferralsModal}
                  className="w-full bg-primary-500 hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-600 text-gray-900 font-semibold py-2.5 px-4 rounded-lg transition-all duration-200"
                >
                  Okay, Got It
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Separate component for referrals list
const ReferralsList = ({ linkId }) => {
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchReferrals()
  }, [linkId])

  const fetchReferrals = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/users/affiliate-links/${linkId}/referrals`)
      
      if (response.data.status === 200) {
        setReferrals(response.data.result?.referrals || [])
      } else {
        setError(response.data.message || 'Failed to fetch referrals')
      }
    } catch (err) {
      console.error('Error fetching referrals:', err)
      setError(err.response?.data?.message || 'Failed to load referrals')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString('en-IN') || '0'}`
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loading size="sm" text="Loading referrals..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (referrals.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">No referrals yet</p>
      </div>
    )
  }

  return (
    <div>
      {/* Title only shown on desktop (when expanded inline) */}
      <h4 className="hidden md:block text-base font-bold text-gray-900 dark:text-white mb-4 px-4 sm:px-6 pt-4 sm:pt-6">
        Referrals ({referrals.length})
      </h4>
      <div className="space-y-3 md:px-4 md:pb-4 pb-0">
        {referrals.map((referral) => {
          const user = referral.user || referral.userId
          const userName = user?.name || 'Unknown User'
          const userEmail = user?.email || 'N/A'
          const userMobile = user?.mobile || 'N/A'

          return (
            <div
              key={referral.bookingId}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {userName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {userEmail}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {userMobile}
                      </p>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AffiliateLinks

