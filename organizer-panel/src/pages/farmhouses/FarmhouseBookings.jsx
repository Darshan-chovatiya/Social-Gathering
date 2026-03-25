import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import EmptyState from '../../components/common/EmptyState'
import CustomDropdown from '../../components/common/CustomDropdown'
import Pagination from '../../components/common/Pagination'
import { Home, Search, Calendar, Users, DollarSign, CheckCircle, Clock, Copy, Check, MapPin } from 'lucide-react'
import { format } from 'date-fns'

const FarmhouseBookings = () => {
  const { toast } = useToast()
  const [allBookings, setAllBookings] = useState([])
  const [farmhouses, setFarmhouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFarmhouseId, setSelectedFarmhouseId] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    fetchFarmhouses()
    fetchBookings()
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [selectedFarmhouseId])

  const fetchFarmhouses = async () => {
    try {
      const response = await api.get('/farmhouses/organizer')
      if (response.data.status === 200) {
        setFarmhouses(response.data.result.farmhouses || [])
      }
    } catch (error) {
      console.error('Error fetching farmhouses:', error)
    }
  }

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const params = selectedFarmhouseId !== 'all' ? { farmhouseId: selectedFarmhouseId } : {}
      const response = await api.get('/farmhouses/organizer/bookings', { params })
      if (response.data.status === 200) {
        setAllBookings(response.data.result.bookings || [])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = allBookings.filter(booking => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return (
      booking.bookingId?.toLowerCase().includes(lowerCaseSearchTerm) ||
      booking.userId?.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
      booking.userId?.email?.toLowerCase().includes(lowerCaseSearchTerm) ||
      booking.farmhouseId?.title?.toLowerCase().includes(lowerCaseSearchTerm)
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage)

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  if (loading && allBookings.length === 0) return <Loading size="lg" text="Loading farmhouse bookings..." />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Farmhouse Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and track farmhouse reservations and track occupancy performance</p>
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
                placeholder="Search by Booking ID, Customer, or Farmhouse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="w-full sm:w-auto min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Farmhouse</label>
            <CustomDropdown
              value={selectedFarmhouseId}
              onChange={setSelectedFarmhouseId}
              options={[
                { value: 'all', label: 'All Farmhouses' },
                ...farmhouses.map(fh => ({ value: fh._id, label: fh.title }))
              ]}
              truncateLength={25}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No bookings found"
          message="No reservations have been made for your farmhouses yet"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Farmhouse</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Stay Dates</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedBookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{booking.farmhouseId?.title || 'N/A'}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 uppercase tracking-tighter">
                          {booking.bookingId}
                        </span>
                        <button onClick={() => copyToClipboard(booking.bookingId, booking._id)} className="p-0.5 hover:bg-gray-200 rounded">
                          {copiedId === booking._id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-gray-400" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{booking.userId?.name}</div>
                      <div className="text-xs text-gray-500">{booking.userId?.email}</div>
                      <div className="text-xs text-gray-500">{booking.userId?.mobile}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {format(new Date(booking.checkInDate), 'MMM d')} - {format(new Date(booking.checkOutDate), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-blue-600 font-medium mt-1">
                        In: {booking.checkInTime} | Out: {booking.checkOutTime}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">₹{booking.totalAmount?.toLocaleString()}</div>
                      <div className="text-[10px] text-emerald-600 bg-emerald-50 inline-block px-1 rounded border border-emerald-100">Dep: ₹{booking.depositAmount}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${booking.paymentStatus === 'success' ? 'bg-emerald-100 text-emerald-800' :
                        booking.paymentStatus === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {booking.paymentStatus === 'success' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {booking.paymentStatus === 'success' ? 'Paid' : booking.paymentStatus === 'pending' ? 'Pending' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FarmhouseBookings
