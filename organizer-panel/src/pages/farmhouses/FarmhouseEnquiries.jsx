import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import EmptyState from '../../components/common/EmptyState'
import CustomDropdown from '../../components/common/CustomDropdown'
import Pagination from '../../components/common/Pagination'
import { MessageSquare, Search, Calendar, User, Phone, Mail, Clock, CheckCircle, Info } from 'lucide-react'
import { format } from 'date-fns'

const FarmhouseEnquiries = () => {
  const { toast } = useToast()
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [updatingId, setUpdatingId] = useState(null)

  useEffect(() => {
    fetchEnquiries()
  }, [])

  const fetchEnquiries = async () => {
    try {
      setLoading(true)
      const response = await api.get('/farmhouses/organizer/enquiries')
      if (response.data.status === 200) {
        setEnquiries(response.data.result.enquiries || [])
      }
    } catch (error) {
      console.error('Error fetching enquiries:', error)
      toast.error('Failed to fetch enquiries')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, newStatus) => {
    try {
      setUpdatingId(id)
      const response = await api.put(`/farmhouses/organizer/enquiries/${id}`, { status: newStatus })
      if (response.data.status === 200) {
        toast.success(`Enquiry marked as ${newStatus}`)
        setEnquiries(enquiries.map(enq => enq._id === id ? { ...enq, status: newStatus } : enq))
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredEnquiries = enquiries.filter(enquiry => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return (
      enquiry.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
      enquiry.mobile?.toLowerCase().includes(lowerCaseSearchTerm) ||
      enquiry.email?.toLowerCase().includes(lowerCaseSearchTerm) ||
      enquiry.farmhouseId?.title?.toLowerCase().includes(lowerCaseSearchTerm) ||
      enquiry.message?.toLowerCase().includes(lowerCaseSearchTerm)
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredEnquiries.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEnquiries = filteredEnquiries.slice(startIndex, startIndex + itemsPerPage)

  if (loading && enquiries.length === 0) return <Loading size="lg" text="Loading farmhouse enquiries..." />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Farmhouse Enquiries</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and respond to customer inquiries and track engagement</p>
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
                placeholder="Search by customer name, email, mobile or farmhouse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {filteredEnquiries.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No enquiries found"
          message="Customer enquiries will appear here once they start reaching out"
        />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Farmhouse</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Customer Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Message</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedEnquiries.map((enquiry) => (
                  <tr key={enquiry._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{enquiry.farmhouseId?.title || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {enquiry.name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {enquiry.mobile}
                        </div>
                        {enquiry.email && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            {enquiry.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 max-w-xs line-clamp-3 italic">"{enquiry.message}"</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(enquiry.createdAt), 'MMM d, yyyy')}
                      <div className="text-[10px] text-gray-400">{format(new Date(enquiry.createdAt), 'hh:mm a')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${enquiry.status === 'attended' || enquiry.status === 'replied' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                        {enquiry.status === 'attended' || enquiry.status === 'replied' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span className="capitalize">{enquiry.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {enquiry.status === 'pending' ? (
                        <button
                          onClick={() => updateStatus(enquiry._id, 'attended')}
                          disabled={updatingId === enquiry._id}
                          className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded transition-all"
                        >
                          Mark Attended
                        </button>
                      ) : (
                        <span className="text-xs font-medium text-gray-400 italic">No actions needed</span>
                      )}
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

export default FarmhouseEnquiries
