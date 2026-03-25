import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../common/ToastContainer'
import Modal from '../common/Modal'
import Loading from '../common/Loading'
import { Link2, Copy, CheckCircle, Users, User, Calendar, X, Mail, Phone } from 'lucide-react'
import { format } from 'date-fns'

const AffiliateLinkModal = ({ isOpen, onClose, booking, onSuccess }) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [affiliateLink, setAffiliateLink] = useState(null)
  const [referrals, setReferrals] = useState([])
  const [copied, setCopied] = useState(false)

  // Convert string to title case
  const toTitleCase = (str) => {
    if (!str) return 'N/A'
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
  }

  // Get profile image URL
  const getProfileImageUrl = (user) => {
    if (!user) return null
    if (user.profileImage) {
      if (user.profileImage.startsWith('http')) return user.profileImage
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const baseUrl = API_BASE_URL.replace('/api', '')
      return `${baseUrl}${user.profileImage}`
    }
    if (user.profilePicture) {
      if (user.profilePicture.startsWith('http')) return user.profilePicture
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const baseUrl = API_BASE_URL.replace('/api', '')
      return `${baseUrl}${user.profilePicture}`
    }
    return null
  }

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  useEffect(() => {
    if (isOpen && booking) {
      // Reset state when modal opens
      setAffiliateLink(null)
      setReferrals([])
      
      // Only check for existing link if shouldGenerate is false (View mode)
      // If shouldGenerate is true or undefined, don't auto-fetch (user will click Generate)
      if (booking.shouldGenerate === false) {
        checkExistingAffiliateLink()
      }
    }
  }, [isOpen, booking])

  // Check if affiliate link exists (for View mode)
  const checkExistingAffiliateLink = async () => {
    if (!booking?._id || !booking?.userId || !booking?.eventId) return

    try {
      setFetching(true)
      // Use the check endpoint to see if link exists without creating
      const userId = booking.userId?._id || booking.userId
      const eventId = booking.eventId?._id || booking.eventId
      
      const checkResponse = await api.get('/organizer/affiliate-links/check', {
        params: {
          userId,
          eventId,
        },
      })

      if (checkResponse.data.status === 200 && checkResponse.data.result.exists) {
        const result = checkResponse.data.result
        const link = result.affiliateLink
        
        // Fetch detailed information including referrals
        if (link._id) {
          await fetchLinkDetails(link._id)
        } else {
          // Use basic link data if no _id
          setAffiliateLink({
            ...link,
            statistics: result.statistics,
          })
        }
      } else {
        // No link exists
        setAffiliateLink(null)
      }
    } catch (error) {
      console.error('Error checking affiliate link:', error)
      // If error, assume no link exists yet
      setAffiliateLink(null)
    } finally {
      setFetching(false)
    }
  }

  const fetchLinkDetails = async (linkId) => {
    try {
      const [detailsResponse, referralsResponse] = await Promise.all([
        api.get(`/organizer/affiliate-links/${linkId}`),
        api.get(`/organizer/affiliate-links/${linkId}/referrals`),
      ])

      if (detailsResponse.data.status === 200) {
        const result = detailsResponse.data.result
        setAffiliateLink({
          ...result.affiliateLink,
          affiliateUrl: result.affiliateLink.affiliateUrl,
          statistics: result.statistics,
        })
      }

      if (referralsResponse.data.status === 200) {
        setReferrals(referralsResponse.data.result.referrals || [])
      }
    } catch (error) {
      console.error('Error fetching link details:', error)
    }
  }

  const handleCopyLink = () => {
    if (affiliateLink?.affiliateUrl) {
      navigator.clipboard.writeText(affiliateLink.affiliateUrl)
      setCopied(true)
      toast.success('Affiliate link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleGenerateLink = async () => {
    if (!booking?._id) return

    try {
      setLoading(true)
      const response = await api.post('/organizer/affiliate-links', {
        bookingId: booking._id,
      })

      if (response.data.status === 200) {
        const linkData = response.data.result
        const link = linkData.affiliateLink
        
        // Fetch detailed information
        if (link._id) {
          await fetchLinkDetails(link._id)
        } else {
          setAffiliateLink({
            ...link,
            affiliateUrl: linkData.affiliateUrl,
          })
        }
        
        toast.success('Affiliate link generated successfully!')
        if (onSuccess) onSuccess()
      }
    } catch (error) {
      console.error('Error generating affiliate link:', error)
      toast.error(error.response?.data?.message || 'Failed to generate affiliate link')
    } finally {
      setLoading(false)
    }
  }

  // Get referrer profile image URL
  const getReferrerProfileImageUrl = (user) => {
    if (!user) return null
    if (user.profileImage) {
      if (user.profileImage.startsWith('http')) return user.profileImage
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const baseUrl = API_BASE_URL.replace('/api', '')
      return `${baseUrl}${user.profileImage}`
    }
    if (user.profilePicture) {
      if (user.profilePicture.startsWith('http')) return user.profilePicture
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
      const baseUrl = API_BASE_URL.replace('/api', '')
      return `${baseUrl}${user.profilePicture}`
    }
    return null
  }

  // Get referrer initials
  const getReferrerInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  if (!isOpen) return null

  const referrerProfileImageUrl = booking?.userId ? getReferrerProfileImageUrl(booking.userId) : null
  const referrerInitials = getReferrerInitials(booking?.userId?.name)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      customHeader={
        <div className="flex-shrink-0 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              {/* Left Side - Title and Customer Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  {/* Profile Image/Avatar */}
                  {booking?.userId && (
                    <div className="shrink-0">
                      {referrerProfileImageUrl ? (
                        <img
                          src={referrerProfileImageUrl}
                          alt={booking.userId.name || 'Referrer'}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            e.target.nextElementSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center border-2 border-gray-200 shadow-sm ${referrerProfileImageUrl ? 'hidden' : ''}`}
                      >
                        <span className="text-white font-semibold text-xs sm:text-sm">
                          {referrerInitials}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Title and Subtitle */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">Referrer Customer Details</h2>
                    {booking?.userId && (
                      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-1 sm:gap-x-4 text-xs sm:text-sm text-gray-600">
                        <span className="font-medium text-gray-900">{toTitleCase(booking.userId.name)}</span>
                        {booking.userId.email && (
                          <span className="flex items-center gap-1 break-all sm:break-normal">
                            <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                            <span className="truncate">{booking.userId.email}</span>
                          </span>
                        )}
                        {booking.userId.mobile && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                            {booking.userId.mobile}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side - Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all duration-150 active:scale-95 shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      }
    >
      {fetching ? (
        <div className="py-6 sm:py-8">
          <Loading size="md" text="Loading affiliate link..." />
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Affiliate Link Section */}
          {affiliateLink ? (
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <Link2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 shrink-0" />
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">Affiliate Link</h3>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={affiliateLink.affiliateUrl || ''}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-mono break-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-xs sm:text-sm"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
                  Share this link with others. When they book and pay successfully, they'll be tracked as referrals.
                </p>
              </div>

              {/* Referrals List */}
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 shrink-0" />
                  <span className="break-words">Customers Booked via Affiliate Links (Referrals) ({referrals.length})</span>
                </h3>
                {referrals.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 text-center">
                    <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-gray-600">No referrals yet. Share your affiliate link to get started!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 max-h-96 overflow-y-auto pr-1 sm:pr-2">
                    {referrals.map((referral) => {
                      const profileImageUrl = getProfileImageUrl(referral.user)
                      const userInitials = getUserInitials(referral.user?.name)
                      
                      return (
                        <div
                          key={referral.bookingId}
                          className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 hover:border-primary-300 hover:shadow-md transition-all duration-200"
                        >
                          {/* Profile Card Header */}
                          <div className="flex items-start gap-3 sm:gap-4">
                            {/* Profile Image */}
                            <div className="shrink-0">
                              {profileImageUrl ? (
                                <img
                                  src={profileImageUrl}
                                  alt={referral.user?.name || 'User'}
                                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gray-200 shadow-sm"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextElementSibling.style.display = 'flex'
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center border-2 border-gray-200 shadow-sm ${profileImageUrl ? 'hidden' : ''}`}
                              >
                                <span className="text-white font-semibold text-sm sm:text-lg">
                                  {userInitials}
                                </span>
                              </div>
                            </div>

                            {/* User Name, Date, and Action Icons */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 sm:gap-3 mb-1">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 truncate">
                                    {toTitleCase(referral.user?.name || 'N/A')}
                                  </h4>
                                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500">
                                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                    <span>{format(new Date(referral.createdAt), 'MMM d, yyyy')}</span>
                                  </div>
                                </div>
                                
                                {/* Action Icons - Email and Mobile */}
                                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                  {referral.user?.email && (
                                    <a
                                      href={`mailto:${referral.user.email}`}
                                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                                      title={`Email: ${referral.user.email}`}
                                    >
                                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                                    </a>
                                  )}
                                  {referral.user?.mobile && (
                                    <a
                                      href={`tel:${referral.user.mobile}`}
                                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center transition-colors"
                                      title={`Call: ${referral.user.mobile}`}
                                    >
                                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 px-2">
              <Link2 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Affiliate Link Yet</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 px-2">
                Generate an affiliate link for this customer to start tracking referrals.
              </p>
              <button
                onClick={handleGenerateLink}
                disabled={loading}
                className="btn-primary inline-flex items-center gap-2 text-xs sm:text-sm px-4 py-2 sm:px-6 sm:py-2.5"
              >
                {loading ? 'Generating...' : 'Generate Affiliate Link'}
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

export default AffiliateLinkModal

