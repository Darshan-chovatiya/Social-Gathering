import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import EmptyState from '../../components/common/EmptyState'
import SponsorFormModal from '../../components/sponsors/SponsorFormModal'
import CustomDropdown from '../../components/common/CustomDropdown'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Pagination from '../../components/common/Pagination'
import { Award, Plus, Edit, Trash2, Search, Globe, Facebook, Twitter, Instagram, Linkedin, Youtube, CheckCircle, XCircle, User } from 'lucide-react'
import { format } from 'date-fns'

const Sponsors = () => {
  const { toast } = useToast()
  const [allSponsors, setAllSponsors] = useState([])
  const [sponsors, setSponsors] = useState([])
  const [paginatedSponsors, setPaginatedSponsors] = useState([]) // Paginated sponsors for display
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [selectedSponsorId, setSelectedSponsorId] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [sponsorToDelete, setSponsorToDelete] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [imageErrors, setImageErrors] = useState({}) // Track image load errors

  useEffect(() => {
    fetchSponsors()
  }, [])

  useEffect(() => {
    filterSponsors()
  }, [searchTerm, typeFilter, statusFilter, allSponsors])

  const fetchSponsors = async () => {
    try {
      setLoading(true)
      const response = await api.get('/organizer/sponsors?limit=100&includeInactive=true')
      if (response.data.status === 200) {
        setAllSponsors(response.data.result.sponsors || [])
      }
    } catch (error) {
      console.error('Error fetching sponsors:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch sponsors')
    } finally {
      setLoading(false)
    }
  }

  const filterSponsors = () => {
    let filtered = [...allSponsors]
    
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase()
      filtered = filtered.filter(sponsor =>
        sponsor.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
        sponsor.type?.toLowerCase().includes(lowerCaseSearchTerm)
      )
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(sponsor => sponsor.type === typeFilter)
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sponsor => 
        statusFilter === 'active' ? sponsor.isActive === true : sponsor.isActive === false
      )
    }
    
    setSponsors(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  // Paginate sponsors
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedSponsors(sponsors.slice(startIndex, endIndex))
  }, [sponsors, currentPage, itemsPerPage])

  const handleToggleStatus = async (sponsorId, currentStatus) => {
    try {
      const response = await api.put(`/organizer/sponsors/${sponsorId}`, {
        isActive: !currentStatus
      })
      if (response.data.status === 200) {
        toast.success(`Sponsor ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
        fetchSponsors()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update sponsor status')
    }
  }

  const handleCreateSponsor = () => {
    setSelectedSponsorId(null)
    setFormModalOpen(true)
  }

  const handleEditSponsor = (sponsorId) => {
    setSelectedSponsorId(sponsorId)
    setFormModalOpen(true)
  }

  const handleModalSuccess = () => {
    fetchSponsors()
  }

  const handleDeleteClick = (sponsorId) => {
    setSponsorToDelete(sponsorId)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!sponsorToDelete) return
    
    try {
      const response = await api.delete(`/organizer/sponsors/${sponsorToDelete}`)
      if (response.data.status === 200) {
        toast.success('Sponsor deleted successfully')
        fetchSponsors()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete sponsor')
    } finally {
      setDeleteConfirmOpen(false)
      setSponsorToDelete(null)
    }
  }

  // Convert string to title case
  const toTitleCase = (str) => {
    if (!str) return 'N/A'
    return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const getTypeLabel = (type) => {
    const labels = {
      'sponsor': 'Sponsor',
      'co-sponsor': 'Co-Sponsor',
      'title sponsor': 'Title Sponsor',
      'supported by': 'Supported By',
      'community partner': 'Community Partner',
      'technology partner': 'Technology Partner',
      'social media partner': 'Social Media Partner',
    }
    return labels[type] || type
  }

  const getTypeColor = (type) => {
    const colors = {
      'sponsor': 'bg-blue-100 text-blue-800',
      'co-sponsor': 'bg-purple-100 text-purple-800',
      'title sponsor': 'bg-yellow-100 text-yellow-800',
      'supported by': 'bg-indigo-100 text-indigo-800',
      'community partner': 'bg-green-100 text-green-800',
      'technology partner': 'bg-orange-100 text-orange-800',
      'social media partner': 'bg-pink-100 text-pink-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <Loading size="lg" text="Loading sponsors..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sponsors</h1>
          <p className="text-sm text-gray-500 mt-1">Manage sponsors for your events</p>
        </div>
        <button
          onClick={handleCreateSponsor}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Sponsor
        </button>
      </div>

      {/* Filters & Search */}
      <div className="rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search sponsors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="w-full sm:w-auto min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <CustomDropdown
              value={typeFilter}
              onChange={setTypeFilter}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'sponsor', label: 'Sponsor' },
                { value: 'co-sponsor', label: 'Co-Sponsor' },
                { value: 'title sponsor', label: 'Title Sponsor' },
                { value: 'supported by', label: 'Supported By' },
                { value: 'community partner', label: 'Community Partner' },
                { value: 'technology partner', label: 'Technology Partner' },
                { value: 'social media partner', label: 'Social Media Partner' },
              ]}
              placeholder="All Types"
              className="w-full"
            />
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

      {/* Sponsors Table */}
      {sponsors.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No sponsors found"
          message="Create your first sponsor to get started"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Logo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created By</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Links</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedSponsors.map((sponsor) => (
                  <tr key={sponsor._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {imageErrors[sponsor._id] || !sponsor.logo ? (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Award className="w-8 h-8 text-gray-400" />
                        </div>
                      ) : (
                        <img
                          src={sponsor.logo.startsWith('http') ? sponsor.logo : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${sponsor.logo}`}
                          alt={sponsor.name}
                          className="w-16 h-16 object-contain rounded-lg border border-gray-200"
                          onError={() => setImageErrors(prev => ({ ...prev, [sponsor._id]: true }))}
                        />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{toTitleCase(sponsor.name || 'N/A')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(sponsor.type)}`}>
                        {getTypeLabel(sponsor.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(sponsor._id, sponsor.isActive)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          sponsor.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                        title={sponsor.isActive ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {sponsor.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {toTitleCase(sponsor.createdByRole || 'N/A')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Website */}
                        {sponsor.website ? (
                          <a
                            href={sponsor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Website"
                          >
                            <Globe className="w-4 h-4" />
                          </a>
                        ) : (
                          <div
                            className="p-1.5 text-gray-300 cursor-not-allowed rounded-lg"
                            title="Website not available"
                          >
                            <Globe className="w-4 h-4" />
                          </div>
                        )}
                        
                        {/* Facebook */}
                        {sponsor.socialMedia?.facebook ? (
                          <a
                            href={sponsor.socialMedia.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Facebook"
                          >
                            <Facebook className="w-4 h-4" />
                          </a>
                        ) : (
                          <div
                            className="p-1.5 text-gray-300 cursor-not-allowed rounded-lg"
                            title="Facebook not available"
                          >
                            <Facebook className="w-4 h-4" />
                          </div>
                        )}
                        
                        {/* Twitter */}
                        {sponsor.socialMedia?.twitter ? (
                          <a
                            href={sponsor.socialMedia.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-600 hover:text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Twitter"
                          >
                            <Twitter className="w-4 h-4" />
                          </a>
                        ) : (
                          <div
                            className="p-1.5 text-gray-300 cursor-not-allowed rounded-lg"
                            title="Twitter not available"
                          >
                            <Twitter className="w-4 h-4" />
                          </div>
                        )}
                        
                        {/* Instagram */}
                        {sponsor.socialMedia?.instagram ? (
                          <a
                            href={sponsor.socialMedia.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                            title="Instagram"
                          >
                            <Instagram className="w-4 h-4" />
                          </a>
                        ) : (
                          <div
                            className="p-1.5 text-gray-300 cursor-not-allowed rounded-lg"
                            title="Instagram not available"
                          >
                            <Instagram className="w-4 h-4" />
                          </div>
                        )}
                        
                        {/* LinkedIn */}
                        {sponsor.socialMedia?.linkedin ? (
                          <a
                            href={sponsor.socialMedia.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="LinkedIn"
                          >
                            <Linkedin className="w-4 h-4" />
                          </a>
                        ) : (
                          <div
                            className="p-1.5 text-gray-300 cursor-not-allowed rounded-lg"
                            title="LinkedIn not available"
                          >
                            <Linkedin className="w-4 h-4" />
                          </div>
                        )}
                        
                        {/* YouTube */}
                        {sponsor.socialMedia?.youtube ? (
                          <a
                            href={sponsor.socialMedia.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="YouTube"
                          >
                            <Youtube className="w-4 h-4" />
                          </a>
                        ) : (
                          <div
                            className="p-1.5 text-gray-300 cursor-not-allowed rounded-lg"
                            title="YouTube not available"
                          >
                            <Youtube className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditSponsor(sponsor._id)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(sponsor._id)}
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
        </div>
      )}

      {/* Sponsor Form Modal */}
      <SponsorFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false)
          setSelectedSponsorId(null)
        }}
        sponsorId={selectedSponsorId}
        onSuccess={handleModalSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false)
          setSponsorToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Sponsor"
        message="Are you sure you want to delete this sponsor? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}

export default Sponsors

