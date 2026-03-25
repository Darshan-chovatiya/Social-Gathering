import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  Mic2,
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Mail,
  Phone,
  Building2,
  MapPin,
} from 'lucide-react'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import EmptyState from '../../components/common/EmptyState'
import ConfirmDialog from '../../components/common/ConfirmDialog'

const initialForm = {
  fullName: '',
  email: '',
  countryCode: '+91',
  phone: '',
  organizationName: '',
  city: '',
  status: 'new',
}

const COUNTRY_OPTIONS = [
  { code: 'AF', dial: '+93', label: 'AF (+93)' },
  { code: 'AL', dial: '+355', label: 'AL (+355)' },
  { code: 'DZ', dial: '+213', label: 'DZ (+213)' },
  { code: 'AD', dial: '+376', label: 'AD (+376)' },
  { code: 'AO', dial: '+244', label: 'AO (+244)' },
  { code: 'AR', dial: '+54', label: 'AR (+54)' },
  { code: 'AM', dial: '+374', label: 'AM (+374)' },
  { code: 'AU', dial: '+61', label: 'AU (+61)' },
  { code: 'AT', dial: '+43', label: 'AT (+43)' },
  { code: 'AZ', dial: '+994', label: 'AZ (+994)' },
  { code: 'BH', dial: '+973', label: 'BH (+973)' },
  { code: 'BD', dial: '+880', label: 'BD (+880)' },
  { code: 'BY', dial: '+375', label: 'BY (+375)' },
  { code: 'BE', dial: '+32', label: 'BE (+32)' },
  { code: 'BZ', dial: '+501', label: 'BZ (+501)' },
  { code: 'BJ', dial: '+229', label: 'BJ (+229)' },
  { code: 'BT', dial: '+975', label: 'BT (+975)' },
  { code: 'BO', dial: '+591', label: 'BO (+591)' },
  { code: 'BA', dial: '+387', label: 'BA (+387)' },
  { code: 'BW', dial: '+267', label: 'BW (+267)' },
  { code: 'BR', dial: '+55', label: 'BR (+55)' },
  { code: 'BN', dial: '+673', label: 'BN (+673)' },
  { code: 'BG', dial: '+359', label: 'BG (+359)' },
  { code: 'BF', dial: '+226', label: 'BF (+226)' },
  { code: 'BI', dial: '+257', label: 'BI (+257)' },
  { code: 'KH', dial: '+855', label: 'KH (+855)' },
  { code: 'CM', dial: '+237', label: 'CM (+237)' },
  { code: 'CA', dial: '+1', label: 'CA (+1)' },
  { code: 'CV', dial: '+238', label: 'CV (+238)' },
  { code: 'CF', dial: '+236', label: 'CF (+236)' },
  { code: 'TD', dial: '+235', label: 'TD (+235)' },
  { code: 'CL', dial: '+56', label: 'CL (+56)' },
  { code: 'CN', dial: '+86', label: 'CN (+86)' },
  { code: 'CO', dial: '+57', label: 'CO (+57)' },
  { code: 'KM', dial: '+269', label: 'KM (+269)' },
  { code: 'CG', dial: '+242', label: 'CG (+242)' },
  { code: 'CR', dial: '+506', label: 'CR (+506)' },
  { code: 'HR', dial: '+385', label: 'HR (+385)' },
  { code: 'CU', dial: '+53', label: 'CU (+53)' },
  { code: 'CY', dial: '+357', label: 'CY (+357)' },
  { code: 'CZ', dial: '+420', label: 'CZ (+420)' },
  { code: 'DK', dial: '+45', label: 'DK (+45)' },
  { code: 'DJ', dial: '+253', label: 'DJ (+253)' },
  { code: 'DO', dial: '+1', label: 'DO (+1)' },
  { code: 'EC', dial: '+593', label: 'EC (+593)' },
  { code: 'EG', dial: '+20', label: 'EG (+20)' },
  { code: 'SV', dial: '+503', label: 'SV (+503)' },
  { code: 'GQ', dial: '+240', label: 'GQ (+240)' },
  { code: 'ER', dial: '+291', label: 'ER (+291)' },
  { code: 'EE', dial: '+372', label: 'EE (+372)' },
  { code: 'SZ', dial: '+268', label: 'SZ (+268)' },
  { code: 'ET', dial: '+251', label: 'ET (+251)' },
  { code: 'FJ', dial: '+679', label: 'FJ (+679)' },
  { code: 'FI', dial: '+358', label: 'FI (+358)' },
  { code: 'FR', dial: '+33', label: 'FR (+33)' },
  { code: 'GA', dial: '+241', label: 'GA (+241)' },
  { code: 'GM', dial: '+220', label: 'GM (+220)' },
  { code: 'GE', dial: '+995', label: 'GE (+995)' },
  { code: 'DE', dial: '+49', label: 'DE (+49)' },
  { code: 'GH', dial: '+233', label: 'GH (+233)' },
  { code: 'GR', dial: '+30', label: 'GR (+30)' },
  { code: 'GT', dial: '+502', label: 'GT (+502)' },
  { code: 'GN', dial: '+224', label: 'GN (+224)' },
  { code: 'GW', dial: '+245', label: 'GW (+245)' },
  { code: 'GY', dial: '+592', label: 'GY (+592)' },
  { code: 'HT', dial: '+509', label: 'HT (+509)' },
  { code: 'HN', dial: '+504', label: 'HN (+504)' },
  { code: 'HK', dial: '+852', label: 'HK (+852)' },
  { code: 'HU', dial: '+36', label: 'HU (+36)' },
  { code: 'IS', dial: '+354', label: 'IS (+354)' },
  { code: 'IN', dial: '+91', label: 'IN (+91)' },
  { code: 'ID', dial: '+62', label: 'ID (+62)' },
  { code: 'IR', dial: '+98', label: 'IR (+98)' },
  { code: 'IQ', dial: '+964', label: 'IQ (+964)' },
  { code: 'IE', dial: '+353', label: 'IE (+353)' },
  { code: 'IL', dial: '+972', label: 'IL (+972)' },
  { code: 'IT', dial: '+39', label: 'IT (+39)' },
  { code: 'JM', dial: '+1', label: 'JM (+1)' },
  { code: 'JP', dial: '+81', label: 'JP (+81)' },
  { code: 'JO', dial: '+962', label: 'JO (+962)' },
  { code: 'KZ', dial: '+7', label: 'KZ (+7)' },
  { code: 'KE', dial: '+254', label: 'KE (+254)' },
  { code: 'KI', dial: '+686', label: 'KI (+686)' },
  { code: 'KW', dial: '+965', label: 'KW (+965)' },
  { code: 'KG', dial: '+996', label: 'KG (+996)' },
  { code: 'LA', dial: '+856', label: 'LA (+856)' },
  { code: 'LV', dial: '+371', label: 'LV (+371)' },
  { code: 'LB', dial: '+961', label: 'LB (+961)' },
  { code: 'LS', dial: '+266', label: 'LS (+266)' },
  { code: 'LR', dial: '+231', label: 'LR (+231)' },
  { code: 'LY', dial: '+218', label: 'LY (+218)' },
  { code: 'LI', dial: '+423', label: 'LI (+423)' },
  { code: 'LT', dial: '+370', label: 'LT (+370)' },
  { code: 'LU', dial: '+352', label: 'LU (+352)' },
  { code: 'MO', dial: '+853', label: 'MO (+853)' },
  { code: 'MG', dial: '+261', label: 'MG (+261)' },
  { code: 'MW', dial: '+265', label: 'MW (+265)' },
  { code: 'MY', dial: '+60', label: 'MY (+60)' },
  { code: 'MV', dial: '+960', label: 'MV (+960)' },
  { code: 'ML', dial: '+223', label: 'ML (+223)' },
  { code: 'MT', dial: '+356', label: 'MT (+356)' },
  { code: 'MH', dial: '+692', label: 'MH (+692)' },
  { code: 'MR', dial: '+222', label: 'MR (+222)' },
  { code: 'MU', dial: '+230', label: 'MU (+230)' },
  { code: 'MX', dial: '+52', label: 'MX (+52)' },
  { code: 'FM', dial: '+691', label: 'FM (+691)' },
  { code: 'MD', dial: '+373', label: 'MD (+373)' },
  { code: 'MC', dial: '+377', label: 'MC (+377)' },
  { code: 'MN', dial: '+976', label: 'MN (+976)' },
  { code: 'ME', dial: '+382', label: 'ME (+382)' },
  { code: 'MA', dial: '+212', label: 'MA (+212)' },
  { code: 'MZ', dial: '+258', label: 'MZ (+258)' },
  { code: 'MM', dial: '+95', label: 'MM (+95)' },
  { code: 'NA', dial: '+264', label: 'NA (+264)' },
  { code: 'NR', dial: '+674', label: 'NR (+674)' },
  { code: 'NP', dial: '+977', label: 'NP (+977)' },
  { code: 'NL', dial: '+31', label: 'NL (+31)' },
  { code: 'NZ', dial: '+64', label: 'NZ (+64)' },
  { code: 'NI', dial: '+505', label: 'NI (+505)' },
  { code: 'NE', dial: '+227', label: 'NE (+227)' },
  { code: 'NG', dial: '+234', label: 'NG (+234)' },
  { code: 'KP', dial: '+850', label: 'KP (+850)' },
  { code: 'MK', dial: '+389', label: 'MK (+389)' },
  { code: 'NO', dial: '+47', label: 'NO (+47)' },
  { code: 'OM', dial: '+968', label: 'OM (+968)' },
  { code: 'PK', dial: '+92', label: 'PK (+92)' },
  { code: 'PW', dial: '+680', label: 'PW (+680)' },
  { code: 'PA', dial: '+507', label: 'PA (+507)' },
  { code: 'PG', dial: '+675', label: 'PG (+675)' },
  { code: 'PY', dial: '+595', label: 'PY (+595)' },
  { code: 'PE', dial: '+51', label: 'PE (+51)' },
  { code: 'PH', dial: '+63', label: 'PH (+63)' },
  { code: 'PL', dial: '+48', label: 'PL (+48)' },
  { code: 'PT', dial: '+351', label: 'PT (+351)' },
  { code: 'QA', dial: '+974', label: 'QA (+974)' },
  { code: 'RO', dial: '+40', label: 'RO (+40)' },
  { code: 'RU', dial: '+7', label: 'RU (+7)' },
  { code: 'RW', dial: '+250', label: 'RW (+250)' },
  { code: 'KN', dial: '+1', label: 'KN (+1)' },
  { code: 'LC', dial: '+1', label: 'LC (+1)' },
  { code: 'VC', dial: '+1', label: 'VC (+1)' },
  { code: 'WS', dial: '+685', label: 'WS (+685)' },
  { code: 'SM', dial: '+378', label: 'SM (+378)' },
  { code: 'ST', dial: '+239', label: 'ST (+239)' },
  { code: 'SA', dial: '+966', label: 'SA (+966)' },
  { code: 'SN', dial: '+221', label: 'SN (+221)' },
  { code: 'RS', dial: '+381', label: 'RS (+381)' },
  { code: 'SC', dial: '+248', label: 'SC (+248)' },
  { code: 'SL', dial: '+232', label: 'SL (+232)' },
  { code: 'SG', dial: '+65', label: 'SG (+65)' },
  { code: 'SK', dial: '+421', label: 'SK (+421)' },
  { code: 'SI', dial: '+386', label: 'SI (+386)' },
  { code: 'SB', dial: '+677', label: 'SB (+677)' },
  { code: 'SO', dial: '+252', label: 'SO (+252)' },
  { code: 'ZA', dial: '+27', label: 'ZA (+27)' },
  { code: 'KR', dial: '+82', label: 'KR (+82)' },
  { code: 'SS', dial: '+211', label: 'SS (+211)' },
  { code: 'ES', dial: '+34', label: 'ES (+34)' },
  { code: 'LK', dial: '+94', label: 'LK (+94)' },
  { code: 'SD', dial: '+249', label: 'SD (+249)' },
  { code: 'SR', dial: '+597', label: 'SR (+597)' },
  { code: 'SE', dial: '+46', label: 'SE (+46)' },
  { code: 'CH', dial: '+41', label: 'CH (+41)' },
  { code: 'SY', dial: '+963', label: 'SY (+963)' },
  { code: 'TW', dial: '+886', label: 'TW (+886)' },
  { code: 'TJ', dial: '+992', label: 'TJ (+992)' },
  { code: 'TZ', dial: '+255', label: 'TZ (+255)' },
  { code: 'TH', dial: '+66', label: 'TH (+66)' },
  { code: 'TL', dial: '+670', label: 'TL (+670)' },
  { code: 'TG', dial: '+228', label: 'TG (+228)' },
  { code: 'TO', dial: '+676', label: 'TO (+676)' },
  { code: 'TT', dial: '+1', label: 'TT (+1)' },
  { code: 'TN', dial: '+216', label: 'TN (+216)' },
  { code: 'TR', dial: '+90', label: 'TR (+90)' },
  { code: 'TM', dial: '+993', label: 'TM (+993)' },
  { code: 'TV', dial: '+688', label: 'TV (+688)' },
  { code: 'UG', dial: '+256', label: 'UG (+256)' },
  { code: 'UA', dial: '+380', label: 'UA (+380)' },
  { code: 'AE', dial: '+971', label: 'AE (+971)' },
  { code: 'GB', dial: '+44', label: 'GB (+44)' },
  { code: 'US', dial: '+1', label: 'US (+1)' },
  { code: 'UY', dial: '+598', label: 'UY (+598)' },
  { code: 'UZ', dial: '+998', label: 'UZ (+998)' },
  { code: 'VU', dial: '+678', label: 'VU (+678)' },
  { code: 'VA', dial: '+379', label: 'VA (+379)' },
  { code: 'VE', dial: '+58', label: 'VE (+58)' },
  { code: 'VN', dial: '+84', label: 'VN (+84)' },
  { code: 'YE', dial: '+967', label: 'YE (+967)' },
  { code: 'ZM', dial: '+260', label: 'ZM (+260)' },
  { code: 'ZW', dial: '+263', label: 'ZW (+263)' },
]

const ArtistInquiries = () => {
  const { toast } = useToast()
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [formData, setFormData] = useState(initialForm)
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchInquiries()
  }, [])

  const fetchInquiries = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/artist-inquiries')
      if (response.data.status === 200) {
        setInquiries(response.data.result.inquiries || [])
      }
    } catch (error) {
      console.error('Error fetching artist inquiries:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch artist inquiries')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setFormData(initialForm)
    setFormErrors({})
    setShowAddModal(true)
  }

  const handleEdit = (inquiry) => {
    setSelectedInquiry(inquiry)
    setFormData({
      fullName: inquiry.fullName || '',
      email: inquiry.email || '',
      countryCode: inquiry.countryCode || '+91',
      phone: inquiry.phone || '',
      organizationName: inquiry.organizationName || '',
      city: inquiry.city || '',
      status: inquiry.status || 'new',
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  const handleDelete = (inquiry) => {
    setSelectedInquiry(inquiry)
    setShowDeleteModal(true)
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.fullName.trim()) errors.fullName = 'Full name is required'
    if (!formData.email.trim()) errors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errors.email = 'Please enter a valid email'
    if (!formData.phone.trim()) errors.phone = 'Phone number is required'
    else if (!/^[0-9]{7,15}$/.test(formData.phone.trim())) errors.phone = 'Phone number must be 7-15 digits'
    if (!formData.organizationName.trim()) errors.organizationName = 'Organisation name is required'
    if (!/^\+?[1-9]\d{0,3}$/.test(formData.countryCode.trim())) errors.countryCode = 'Invalid country code'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        countryCode: formData.countryCode.trim(),
        phone: formData.phone.trim(),
        organizationName: formData.organizationName.trim(),
        city: formData.city.trim(),
        status: formData.status,
      }

      const response = showEditModal
        ? await api.put(`/admin/artist-inquiries/${selectedInquiry._id}`, payload)
        : await api.post('/admin/artist-inquiries', payload)

      if (response.data.status === 200 || response.data.status === 201) {
        toast.success(`Artist inquiry ${showEditModal ? 'updated' : 'created'} successfully`)
        setShowAddModal(false)
        setShowEditModal(false)
        setFormData(initialForm)
        if (!showEditModal) {
          setSearchTerm('')
          setStatusFilter('all')
        }
        fetchInquiries()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${showEditModal ? 'update' : 'create'} artist inquiry`)
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    try {
      const response = await api.delete(`/admin/artist-inquiries/${selectedInquiry._id}`)
      if (response.data.status === 200) {
        toast.success('Artist inquiry deleted successfully')
        setShowDeleteModal(false)
        fetchInquiries()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete artist inquiry')
    }
  }

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      inquiry.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.city?.toLowerCase().includes(searchTerm.toLowerCase())

    if (statusFilter === 'all') return matchesSearch
    return matchesSearch && inquiry.status === statusFilter
  })

  const getStatusClass = (status) => {
    if (status === 'new') return 'bg-blue-100 text-blue-800'
    if (status === 'read') return 'bg-emerald-100 text-emerald-800'
    return 'bg-gray-200 text-gray-700'
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            Artist Inquiries
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base font-medium">Manage artist inquiries from customers</p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Add Inquiry
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search inquiries..."
              autoComplete="off"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field sm:w-44">
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : filteredInquiries.length === 0 ? (
        <EmptyState
          icon={Mic2}
          title="No artist inquiries found"
          message={searchTerm ? 'No inquiries match your search.' : 'Artist inquiries submitted by users will appear here.'}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Artist</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Organisation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Submitted</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInquiries.map((inquiry) => (
                  <tr key={inquiry._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{inquiry.fullName}</p>
                        {inquiry.city && (
                          <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {inquiry.city}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-700 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {inquiry.email}
                        </p>
                        <p className="text-sm text-gray-700 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {`${inquiry.countryCode || ''} ${inquiry.phone || ''}`.trim()}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        {inquiry.organizationName || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusClass(inquiry.status)}`}>
                        {inquiry.status || 'new'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {inquiry.createdAt ? format(new Date(inquiry.createdAt), 'MMM dd, yyyy') : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(inquiry)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(inquiry)}
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

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-gray-200/60 animate-scale-in">
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10 rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">
                {showEditModal ? 'Edit Artist Inquiry' : 'Add New Artist Inquiry'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                  setFormErrors({})
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <form id="artist-inquiry-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className={`input-field ${formErrors.fullName ? 'border-red-500' : ''}`}
                    />
                    {formErrors.fullName && <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`input-field ${formErrors.email ? 'border-red-500' : ''}`}
                    />
                    {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country Code *</label>
                    <select
                      value={formData.countryCode}
                      onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                      className={`input-field ${formErrors.countryCode ? 'border-red-500' : ''}`}
                    >
                      {COUNTRY_OPTIONS.map((country) => (
                        <option key={country.code} value={country.dial}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.countryCode && <p className="text-red-500 text-xs mt-1">{formErrors.countryCode}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 15) })}
                      className={`input-field ${formErrors.phone ? 'border-red-500' : ''}`}
                    />
                    {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organisation Name *</label>
                    <input
                      type="text"
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      className={`input-field ${formErrors.organizationName ? 'border-red-500' : ''}`}
                    />
                    {formErrors.organizationName && <p className="text-red-500 text-xs mt-1">{formErrors.organizationName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="flex-shrink-0 border-t border-gray-200 bg-white sticky bottom-0 z-10 rounded-b-2xl">
              <div className="flex gap-3 p-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                    setFormErrors({})
                  }}
                  className="btn-secondary flex-1"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" form="artist-inquiry-form" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  ) : showEditModal ? (
                    'Update'
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Artist Inquiry"
        message={`Are you sure you want to delete inquiry from "${selectedInquiry?.fullName}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  )
}

export default ArtistInquiries
