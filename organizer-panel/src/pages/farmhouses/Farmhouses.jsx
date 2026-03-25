import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import EmptyState from '../../components/common/EmptyState'
import CustomDropdown from '../../components/common/CustomDropdown'
import Pagination from '../../components/common/Pagination'
import { Home, Search, Plus, Edit, Trash2, Eye, CheckCircle, Clock, XCircle, MapPin, MessageSquare } from 'lucide-react'

const Farmhouses = () => {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [farmhouses, setFarmhouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [imageErrors, setImageErrors] = useState({})

  useEffect(() => {
    fetchFarmhouses()
  }, [])

  const fetchFarmhouses = async () => {
    try {
      setLoading(true)
      const response = await api.get('/farmhouses/organizer')
      if (response.data.status === 200) {
        setFarmhouses(response.data.result.farmhouses || [])
      }
    } catch (error) {
      console.error('Error fetching farmhouses:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch farmhouses')
    } finally {
      setLoading(false)
    }
  }

  const filteredFarmhouses = farmhouses.filter(fh => {
    const matchesSearch = fh.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fh.address?.city?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || fh.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredFarmhouses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedFarmhouses = filteredFarmhouses.slice(startIndex, startIndex + itemsPerPage)

  const getStatusBadge = (status) => {
    const badges = {
      approved: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800', label: 'Approved' },
      pending: { icon: Clock, color: 'bg-amber-100 text-amber-800', label: 'Pending' },
      rejected: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejected' },
    }
    const badge = badges[status] || badges.pending
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    )
  }

  if (loading) return <Loading size="lg" text="Loading farmhouses..." />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Farmhouses</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your farmhouse listings and track their performance</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/farmhouse-enquiries"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Enquiries</span>
          </Link>
          <Link
            to="/farmhouses/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
          >
            <Plus className="w-5 h-5" />
            <span>Add Farmhouse</span>
          </Link>
        </div>
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
                placeholder="Search by title or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="w-full sm:w-auto min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <CustomDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'approved', label: 'Approved' },
                { value: 'pending', label: 'Pending' },
                { value: 'rejected', label: 'Rejected' },
              ]}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {filteredFarmhouses.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No farmhouses found"
          message="You haven't added any farmhouses yet or no farmhouses match your search."
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Farmhouse</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Location</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Pricing (24h)</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedFarmhouses.map((fh) => (
                  <tr key={fh._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {fh.banners?.[0] ? (
                            <img
                              src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}${fh.banners[0]}`}
                              alt={fh.title}
                              className="w-full h-full object-cover"
                              onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=No+Image'}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary-50">
                              <Home className="w-6 h-6 text-primary-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{fh.title}</div>
                          <div className="text-xs text-gray-500">{fh.amenities?.bedrooms} Bedrooms • {fh.amenities?.guests} Guests</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-3.5 h-3.5" />
                        {fh.address?.city}, {fh.address?.state}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">₹{fh.pricing?.regular?.rate24h || 0}</div>
                      <div className="text-xs text-gray-500">Regular Rate</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(fh.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/farmhouses/edit/${fh._id}`)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { }} // Handle delete
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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

export default Farmhouses
