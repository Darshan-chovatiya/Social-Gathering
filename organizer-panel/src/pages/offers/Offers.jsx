import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import EmptyState from '../../components/common/EmptyState'
import OfferFormModal from '../../components/offers/OfferFormModal'
import CustomDropdown from '../../components/common/CustomDropdown'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Pagination from '../../components/common/Pagination'
import { Ticket, Plus, Edit, Trash2, Search, CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'

const Offers = () => {
  const { toast } = useToast()
  const [allOffers, setAllOffers] = useState([]) // Store all fetched offers
  const [offers, setOffers] = useState([]) // Filtered offers for display
  const [paginatedOffers, setPaginatedOffers] = useState([]) // Paginated offers for display
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [selectedOfferId, setSelectedOfferId] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [offerToDelete, setOfferToDelete] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetchOffers()
  }, [])

  // Filter offers when searchTerm or statusFilter changes
  useEffect(() => {
    filterOffers()
  }, [searchTerm, statusFilter, allOffers])

  const fetchOffers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/organizer/offers?limit=100')
      if (response.data.status === 200) {
        const fetchedOffers = response.data.result.offers || []
        setAllOffers(fetchedOffers)
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch offers')
    } finally {
      setLoading(false)
    }
  }

  // Convert string to title case
  const toTitleCase = (str) => {
    if (!str) return 'N/A'
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const filterOffers = () => {
    let filtered = [...allOffers]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(offer =>
        offer.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(offer => offer.isActive === true)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(offer => offer.isActive === false)
    }

    setOffers(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Paginate offers
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedOffers(offers.slice(startIndex, endIndex))
  }, [offers, currentPage, itemsPerPage])

  const handleCreateOffer = () => {
    setSelectedOfferId(null)
    setFormModalOpen(true)
  }

  const handleEditOffer = (offerId) => {
    setSelectedOfferId(offerId)
    setFormModalOpen(true)
  }

  const handleToggleStatus = async (offerId, currentStatus) => {
    try {
      const response = await api.put(`/organizer/offers/${offerId}`, {
        isActive: !currentStatus
      })
      if (response.data.status === 200) {
        toast.success(`Offer ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
        fetchOffers()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update offer status')
    }
  }

  const handleDeleteClick = (offerId) => {
    setOfferToDelete(offerId)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!offerToDelete) return

    try {
      const response = await api.delete(`/organizer/offers/${offerToDelete}`)
      if (response.data.status === 200) {
        toast.success('Offer deleted successfully')
        fetchOffers()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete offer')
    } finally {
      setDeleteConfirmOpen(false)
      setOfferToDelete(null)
    }
  }

  const handleModalSuccess = () => {
    fetchOffers() // Refresh offers list
  }

  if (loading) {
    return <Loading size="lg" text="Loading offers..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Offers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage promotional offers and track their performance for your events</p>
        </div>
        <button
          onClick={handleCreateOffer}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
        >
          <Plus className="w-5 h-5" />
          <span>Add Offer</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search offers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="w-full sm:w-auto min-w-[140px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <CustomDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              placeholder="All Status"
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Offers Table */}
      {offers.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No offers found"
          message="Create your first offer to attract more customers"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Offer</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Valid Period</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedOffers.map((offer) => (
                  <tr key={offer._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{toTitleCase(offer.title || 'N/A')}</div>
                        <div className="text-xs text-gray-500 mt-1">Code: {offer.code}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {offer.type === 'percentage' ? `${offer.value}%` : `₹${offer.value}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {format(new Date(offer.validFrom), 'MMM d')} - {format(new Date(offer.validUntil), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(offer._id, offer.isActive)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${offer.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        title={offer.isActive ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {offer.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {offer.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditOffer(offer._id)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(offer._id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
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
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(offers.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={offers.length}
          />
        </div>
      )}

      {/* Offer Form Modal */}
      <OfferFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false)
          setSelectedOfferId(null)
        }}
        offerId={selectedOfferId}
        onSuccess={handleModalSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false)
          setOfferToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Offer"
        message="Are you sure you want to delete this offer? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}

export default Offers

