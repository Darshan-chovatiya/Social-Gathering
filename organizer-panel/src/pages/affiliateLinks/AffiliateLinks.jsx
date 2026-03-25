import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import EmptyState from '../../components/common/EmptyState'
import AffiliateLinkModal from '../../components/bookings/AffiliateLinkModal'
import Modal from '../../components/common/Modal'
import CustomDropdown from '../../components/common/CustomDropdown'
import Pagination from '../../components/common/Pagination'
import { Link2, Search, Users, CheckCircle, Copy, Eye, User } from 'lucide-react'

const AffiliateLinks = () => {
  const { toast } = useToast()
  const [customers, setCustomers] = useState([]) // Grouped customer+event combinations
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [paginatedCustomers, setPaginatedCustomers] = useState([]) // Paginated customers for display
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEventId, setSelectedEventId] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [referralCustomerFilter, setReferralCustomerFilter] = useState('all') // 'all', 'yes', 'no'
  const [affiliateLinkModalOpen, setAffiliateLinkModalOpen] = useState(false)
  const [selectedBookingForAffiliate, setSelectedBookingForAffiliate] = useState(null)
  const [affiliateLinksMap, setAffiliateLinksMap] = useState({}) // Map to store affiliate link data
  const [customerDetailsModalOpen, setCustomerDetailsModalOpen] = useState(false)
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetchEvents()
    fetchBookings()
  }, [])

  useEffect(() => {
    filterCustomers()
  }, [customers, selectedEventId, searchTerm, referralCustomerFilter])

  const filterCustomers = () => {
    let filtered = customers

    // Filter by event if not "all"
    if (selectedEventId !== 'all') {
      filtered = filtered.filter(
        (customer) => customer.eventId === selectedEventId || customer.event?._id === selectedEventId
      )
    }

    // Filter by referral customer status
    if (referralCustomerFilter !== 'all') {
      filtered = filtered.filter((customer) => {
        if (referralCustomerFilter === 'yes') {
          return customer.isReferralCustomer === true
        } else if (referralCustomerFilter === 'no') {
          return customer.isReferralCustomer !== true
        }
        return true
      })
    }

    // Filter by search term
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (customer) =>
          customer.user?.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
          customer.user?.email?.toLowerCase().includes(lowerCaseSearchTerm) ||
          customer.event?.title?.toLowerCase().includes(lowerCaseSearchTerm)
      )
    }

    setFilteredCustomers(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Paginate customers
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedCustomers(filteredCustomers.slice(startIndex, endIndex))
  }, [filteredCustomers, currentPage, itemsPerPage])

  // Helper function to check if an event is past
  const isEventPast = (event) => {
    if (!event.slots || event.slots.length === 0) return true
    
    const now = new Date()
    
    // Check if all active slots are in the past
    const activeSlots = event.slots.filter(slot => slot.isActive !== false)
    if (activeSlots.length === 0) return true
    
    // An event is past if all active slots have dates in the past
    // We check the slot date + end time to see if it's completely over
    return activeSlots.every(slot => {
      if (!slot.date) return true
      const slotDate = new Date(slot.date)
      
      // If slot has end time, combine date and end time
      if (slot.endTime) {
        const [hours, minutes] = slot.endTime.split(':').map(Number)
        slotDate.setHours(hours, minutes, 0, 0)
      } else {
        // If no end time, consider the slot ends at end of day
        slotDate.setHours(23, 59, 59, 999)
      }
      
      return slotDate < now
    })
  }

  const fetchEvents = async () => {
    try {
      const response = await api.get('/organizer/events?limit=100')
      if (response.data.status === 200) {
        // Filter out past events
        const allEvents = response.data.result.events || []
        const upcomingEvents = allEvents.filter(event => !isEventPast(event))
        setEvents(upcomingEvents)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to fetch events')
    }
  }

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/organizer/bookings?limit=1000')

      if (response.data.status === 200) {
        const bookings = response.data.result.bookings || []
        
        // Filter only successful bookings
        const successfulBookings = bookings.filter(
          (booking) => booking.status === 'confirmed' && booking.paymentStatus === 'success'
        )

        // Group by customer (userId) and event (eventId)
        const customerEventMap = new Map()

        successfulBookings.forEach((booking) => {
          const userId = booking.userId?._id || booking.userId
          const eventId = booking.eventId?._id || booking.eventId
          const key = `${userId}_${eventId}`

          if (!customerEventMap.has(key)) {
            customerEventMap.set(key, {
              userId,
              eventId,
              user: booking.userId,
              event: booking.eventId,
              bookings: [],
              totalAmount: 0,
              firstBookingDate: booking.createdAt,
              isAffiliateCustomer: false, // Track if customer used affiliate link
              isReferralCustomer: false, // Track if this customer used an affiliate link for their booking
            })
          }

          const customerData = customerEventMap.get(key)
          customerData.bookings.push(booking)
          customerData.totalAmount += booking.totalAmount || 0
          
          // Check if this booking used an affiliate link
          // affiliateLinkId can be an ObjectId string or populated object
          const hasAffiliateLink = booking.affiliateLinkId && (
            typeof booking.affiliateLinkId === 'string' || 
            booking.affiliateLinkId._id ||
            booking.affiliateLinkId
          )
          if (hasAffiliateLink) {
            customerData.isReferralCustomer = true
          }
          
          // Keep track of earliest booking date
          if (new Date(booking.createdAt) < new Date(customerData.firstBookingDate)) {
            customerData.firstBookingDate = booking.createdAt
          }
        })

        // Convert map to array
        const customersArray = Array.from(customerEventMap.values())

        // Check for existing affiliate links (without creating new ones)
        // This will also update isAffiliateCustomer for customers whose affiliate links have referrals
        await checkExistingAffiliateLinks(customersArray)
        
        setCustomers(customersArray)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch bookings')
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  // Check for existing affiliate links without creating new ones
  const checkExistingAffiliateLinks = async (customersArray) => {
    const linksMap = {}
    
    // Check affiliate link existence for each customer+event combination
    try {
      const checkPromises = customersArray.map(async (customer) => {
        try {
          const response = await api.get('/organizer/affiliate-links/check', {
            params: {
              userId: customer.userId,
              eventId: customer.eventId,
            },
          })

          if (response.data.status === 200 && response.data.result.exists) {
            const key = `${customer.userId}_${customer.eventId}`
            linksMap[key] = {
              ...response.data.result.affiliateLink,
              statistics: response.data.result.statistics,
            }
            
            // Update isAffiliateCustomer based on whether their affiliate link has referrals
            // This means someone used their affiliate link to make a booking
            if (response.data.result.statistics && response.data.result.statistics.totalReferrals > 0) {
              customer.isAffiliateCustomer = true
            }
          }
        } catch (error) {
          // Link doesn't exist or error occurred, skip
          console.error(`Error checking link for customer ${customer.userId}:`, error)
        }
      })

      await Promise.all(checkPromises)
    } catch (error) {
      console.error('Error checking affiliate links:', error)
    }
    
    setAffiliateLinksMap(linksMap)
    return linksMap
  }

  // Refresh affiliate link statistics for a specific customer
  const refreshAffiliateLinkStats = async (customer) => {
    try {
      const response = await api.get('/organizer/affiliate-links/check', {
        params: {
          userId: customer.userId,
          eventId: customer.eventId,
        },
      })

      if (response.data.status === 200 && response.data.result.exists) {
        const key = `${customer.userId}_${customer.eventId}`
        const statistics = response.data.result.statistics
        
        setAffiliateLinksMap((prev) => ({
          ...prev,
          [key]: {
            ...response.data.result.affiliateLink,
            statistics: statistics,
          },
        }))
        
        // Update isAffiliateCustomer based on referrals
        setCustomers((prevCustomers) => {
          return prevCustomers.map((c) => {
            if (c.userId === customer.userId && c.eventId === customer.eventId) {
              return {
                ...c,
                isAffiliateCustomer: statistics && statistics.totalReferrals > 0,
              }
            }
            return c
          })
        })
      }
    } catch (error) {
      console.error('Error refreshing affiliate link stats:', error)
    }
  }

  // Fetch affiliate link for a specific customer+event (called when viewing)
  const fetchAffiliateLinkForCustomer = async (customer) => {
    try {
      const firstBooking = customer.bookings[0]
      if (!firstBooking?._id) return null

      // Try to get existing link (this will return existing if it exists, but won't create if it doesn't)
      // Actually, the POST endpoint creates if it doesn't exist, so we need a different approach
      // We'll check in the modal instead, and update the map after successful creation/view
      return null
    } catch (error) {
      console.error('Error checking affiliate link:', error)
      return null
    }
  }

  const handleGenerateOrViewAffiliateLink = async (customer, shouldGenerate = false) => {
    // Use the first booking for this customer+event combination
    const booking = customer.bookings[0]
    if (booking) {
      setSelectedBookingForAffiliate({ ...booking, shouldGenerate })
      setAffiliateLinkModalOpen(true)
    }
  }

  // Update affiliate link data after successful generation/viewing
  const handleAffiliateLinkSuccess = async (booking) => {
    if (!booking) return

    // Find the customer for this booking
    const customer = customers.find(
      (c) =>
        (c.userId === booking.userId?._id || c.userId === booking.userId) &&
        (c.eventId === booking.eventId?._id || c.eventId === booking.eventId)
    )

    if (!customer) return

    // Refresh the affiliate link data and also refresh all stats
    await refreshAffiliateLinkStats(customer)
    
    // Also refresh bookings to get updated affiliate customer status
    await fetchBookings()
  }

  const handleCopyLink = (affiliateUrl) => {
    if (affiliateUrl) {
      navigator.clipboard.writeText(affiliateUrl)
      toast.success('Affiliate link copied to clipboard!')
    }
  }

  const getAffiliateLinkData = (customer) => {
    const key = `${customer.userId}_${customer.eventId}`
    return affiliateLinksMap[key] || null
  }

  // Convert string to title case
  const toTitleCase = (str) => {
    if (!str) return 'N/A'
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
  }

  if (loading && customers.length === 0) {
    return <Loading size="lg" text="Loading customers..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Affiliate Links</h1>
        <p className="text-sm text-gray-500 mt-1">Manage affiliate links for customers with successful payments</p>
      </div>

      {/* Filters */}
      <div className="rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer name, email, or event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
          {/* Custom Event Dropdown */}
          <div className="w-full sm:w-auto min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Event</label>
            <CustomDropdown
              value={selectedEventId}
              onChange={setSelectedEventId}
              options={[
                { value: 'all', label: 'All Events' },
                ...events.map((event) => ({
                  value: event._id,
                  label: event.title,
                })),
              ]}
              placeholder="All Events"
              className="w-full"
              truncateLength={20}
            />
          </div>

          {/* Custom Referral Customer Dropdown */}
          <div className="w-full sm:w-auto min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
            <CustomDropdown
              value={referralCustomerFilter}
              onChange={setReferralCustomerFilter}
              options={[
                { value: 'all', label: 'All Customers' },
                { value: 'yes', label: 'Referral Customers' },
                { value: 'no', label: 'Normal Customers' },
              ]}
              placeholder="All Customers"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Customers Table */}
      {filteredCustomers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          message={
            searchTerm || selectedEventId !== 'all'
              ? 'No customers match your search criteria'
              : 'No customers with successful payments found'
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-visible">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Affiliate Link
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Referrals
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Referral Customer
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedCustomers.map((customer) => {
                  const affiliateLink = getAffiliateLinkData(customer)
                  const hasLink = !!affiliateLink

                  return (
                    <tr key={`${customer.userId}_${customer.eventId}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <button
                            onClick={() => {
                              setSelectedCustomerDetails(customer)
                              setCustomerDetailsModalOpen(true)
                            }}
                            className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors cursor-pointer text-left"
                          >
                            {toTitleCase(customer.user?.name)}
                          </button>
                          {customer.user?.mobile && (
                            <div className="text-xs text-gray-500 mt-1">
                              {customer.user.mobile}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div 
                          className="text-sm font-medium text-gray-900 cursor-help"
                          title={customer.event?.title || 'N/A'}
                        >
                          {customer.event?.title 
                            ? (customer.event.title.length > 30 
                                ? `${customer.event.title.substring(0, 30)}...` 
                                : customer.event.title)
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        {hasLink ? (
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-mono text-gray-600 truncate max-w-[120px]">
                              {affiliateLink.affiliateCode || 'N/A'}
                            </div>
                            <button
                              onClick={() => handleCopyLink(affiliateLink.affiliateUrl)}
                              className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors flex-shrink-0"
                              title="Copy link"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not generated</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {hasLink && affiliateLink.statistics ? affiliateLink.statistics.totalReferrals || 0 : 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {customer.isReferralCustomer ? (
                          <div className="flex items-center justify-center gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-blue-600 font-medium">Yes</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center justify-center">
                          {hasLink ? (
                            <button
                              onClick={() => handleGenerateOrViewAffiliateLink(customer, false)}
                              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="View Affiliate Link"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleGenerateOrViewAffiliateLink(customer, true)}
                              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Generate Affiliate Link"
                            >
                              <Link2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredCustomers.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredCustomers.length}
          />
        </div>
      )}

      {/* Affiliate Link Modal */}
      {selectedBookingForAffiliate && (
        <AffiliateLinkModal
          isOpen={affiliateLinkModalOpen}
          onClose={() => {
            setAffiliateLinkModalOpen(false)
            setSelectedBookingForAffiliate(null)
          }}
          booking={selectedBookingForAffiliate}
          onSuccess={() => {
            // Update affiliate link data after successful generation/viewing
            handleAffiliateLinkSuccess(selectedBookingForAffiliate)
          }}
        />
      )}

      {/* Customer Details Modal */}
      <Modal
        isOpen={customerDetailsModalOpen}
        onClose={() => {
          setCustomerDetailsModalOpen(false)
          setSelectedCustomerDetails(null)
        }}
        title="Customer Details"
        size="sm"
      >
        {selectedCustomerDetails && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {toTitleCase(selectedCustomerDetails.user?.name)}
                </h3>
                {selectedCustomerDetails.isReferralCustomer && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 mt-1">
                    Referral Customer
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Email
                </label>
                <p className="mt-1 text-sm text-gray-900 break-all">
                  {selectedCustomerDetails.user?.email || 'N/A'}
                </p>
              </div>
              
              {selectedCustomerDetails.user?.mobile && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Mobile
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedCustomerDetails.user.mobile}
                  </p>
                </div>
              )}
              
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Event
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedCustomerDetails.event?.title || 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Total Bookings
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedCustomerDetails.bookings?.length || 0}
                </p>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Total Amount
                </label>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  ₹{selectedCustomerDetails.totalAmount?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AffiliateLinks

