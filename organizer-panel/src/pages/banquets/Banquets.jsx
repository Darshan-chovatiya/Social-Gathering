import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import EmptyState from '../../components/common/EmptyState'
import { Building2, Plus, Search, MapPin, Edit, Trash2, ExternalLink, MessageSquare } from 'lucide-react'

const Banquets = () => {
  const { toast } = useToast()
  const [banquets, setBanquets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchBanquets()
  }, [])

  const fetchBanquets = async () => {
    try {
      setLoading(true)
      const response = await api.get('/banquets/organizer')
      if (response.data.status === 200) {
        setBanquets(response.data.result.banquets || [])
      }
    } catch (error) {
      console.error('Error fetching banquets:', error)
      toast.error('Failed to fetch banquets')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this banquet?')) return
    try {
      const response = await api.delete(`/banquets/organizer/${id}`)
      if (response.data.status === 200) {
        toast.success('Banquet deleted successfully')
        setBanquets(banquets.filter(b => b._id !== id))
      }
    } catch (error) {
      console.error('Error deleting banquet:', error)
      toast.error('Failed to delete banquet')
    }
  }

  const filteredBanquets = banquets.filter(banquet =>
    banquet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    banquet.address.city.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getImageUrl = (path) => {
    if (!path) return ''
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '')
    return `${baseUrl}${path}`
  }

  if (loading && banquets.length === 0) return <Loading size="lg" text="Loading banquets..." />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Banquets</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your banquet halls and track their performance</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/banquet-enquiries"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Enquiries</span>
          </Link>
          <Link
            to="/banquets/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
          >
            <Plus className="w-5 h-5" />
            <span>Add Banquet</span>
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
        </div>
      </div>

      {filteredBanquets.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No banquets found"
          message={searchTerm ? "No banquets match your search" : "Showcase your banquet halls to thousands of potential customers"}
          action={!searchTerm ? {
            label: "Add Your First Banquet",
            onClick: () => navigate('/banquets/create')
          } : null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBanquets.map((banquet) => (
            <div key={banquet._id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <div className="relative h-48 bg-gray-100">
                {banquet.banners?.[0] ? (
                  <img
                    src={getImageUrl(banquet.banners[0])}
                    alt={banquet.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${banquet.status === 'approved' ? 'bg-emerald-500 text-white' :
                    banquet.status === 'pending' ? 'bg-amber-500 text-white' :
                      'bg-red-500 text-white'
                    }`}>
                    {banquet.status}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{banquet.title}</h3>
                  <div className="flex items-center gap-1.5 text-gray-500 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{banquet.address.city}, {banquet.address.state}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <Link
                      to={`/banquets/edit/${banquet._id}`}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(banquet._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <a
                    href={`${import.meta.env.VITE_CUSTOMER_PANEL_URL}/#/banquets/${banquet._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <span>View</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Banquets
