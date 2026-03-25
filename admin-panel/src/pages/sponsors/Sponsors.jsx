import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import EmptyState from '../../components/common/EmptyState'
import SponsorFormModal from '../../components/sponsors/SponsorFormModal'
import { Award, Plus, Edit, Trash2, Search, Globe, Facebook, Twitter, Instagram, Linkedin, Youtube, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

const Sponsors = () => {
  const { toast } = useToast()
  const [allSponsors, setAllSponsors] = useState([])
  const [sponsors, setSponsors] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [updating, setUpdating] = useState(null)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [selectedSponsorId, setSelectedSponsorId] = useState(null)

  useEffect(() => {
    fetchSponsors()
  }, [])

  useEffect(() => {
    filterSponsors()
  }, [searchTerm, typeFilter, statusFilter, allSponsors])

  const fetchSponsors = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/sponsors?limit=100&includeInactive=true')
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
  }

  const handleToggleStatus = async (sponsorId, currentStatus) => {
    try {
      setUpdating(sponsorId)
      const response = await api.put(`/admin/sponsors/${sponsorId}`, {
        isActive: !currentStatus
      })
      if (response.data.status === 200) {
        toast.success('Sponsor status updated successfully')
        fetchSponsors()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update sponsor status')
    } finally {
      setUpdating(null)
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

  const handleDelete = async (sponsorId) => {
    if (!window.confirm('Are you sure you want to delete this sponsor?')) return
    
    try {
      const response = await api.delete(`/admin/sponsors/${sponsorId}`)
      if (response.data.status === 200) {
        toast.success('Sponsor deleted successfully')
        fetchSponsors()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete sponsor')
    }
  }

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
      'sponsor': 'bg-blue-100 text-blue-800',
      'co-sponsor': 'bg-purple-100 text-purple-800',
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
          <p className="text-sm text-gray-500 mt-1">Manage all sponsors</p>
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
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sponsors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          >
            <option value="all">All Types</option>
            <option value="sponsor">Sponsor</option>
            <option value="co-sponsor">Co-Sponsor</option>
            <option value="community partner">Community Partner</option>
            <option value="technology partner">Technology Partner</option>
            <option value="social media partner">Social Media Partner</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sponsors.map((sponsor) => (
                  <tr key={sponsor._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      {sponsor.logo ? (
                        <img
                          src={sponsor.logo.startsWith('http') ? sponsor.logo : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${sponsor.logo}`}
                          alt={sponsor.name}
                          className="w-16 h-16 object-contain rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Award className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{sponsor.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(sponsor.type)}`}>
                        {getTypeLabel(sponsor.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {updating === sponsor._id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(sponsor._id, sponsor.isActive)}
                          disabled={updating === sponsor._id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all duration-150 hover:scale-105 active:scale-95 ${
                            sponsor.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {sponsor.isActive ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {sponsor.isActive ? 'Active' : 'Inactive'}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {sponsor.createdBy?.name || 'N/A'}
                        <span className="text-xs text-gray-500 ml-1">({sponsor.createdByRole})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {sponsor.website && (
                          <a
                            href={sponsor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Website"
                          >
                            <Globe className="w-4 h-4" />
                          </a>
                        )}
                        {sponsor.socialMedia?.facebook && (
                          <a
                            href={sponsor.socialMedia.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Facebook"
                          >
                            <Facebook className="w-4 h-4" />
                          </a>
                        )}
                        {sponsor.socialMedia?.twitter && (
                          <a
                            href={sponsor.socialMedia.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-600 hover:text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Twitter"
                          >
                            <Twitter className="w-4 h-4" />
                          </a>
                        )}
                        {sponsor.socialMedia?.instagram && (
                          <a
                            href={sponsor.socialMedia.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                            title="Instagram"
                          >
                            <Instagram className="w-4 h-4" />
                          </a>
                        )}
                        {sponsor.socialMedia?.linkedin && (
                          <a
                            href={sponsor.socialMedia.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="LinkedIn"
                          >
                            <Linkedin className="w-4 h-4" />
                          </a>
                        )}
                        {sponsor.socialMedia?.youtube && (
                          <a
                            href={sponsor.socialMedia.youtube}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="YouTube"
                          >
                            <Youtube className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditSponsor(sponsor._id)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sponsor._id)}
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
        isAdmin={true}
      />
    </div>
  )
}

export default Sponsors

