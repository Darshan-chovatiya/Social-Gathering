import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import { useAuthStore } from '../../store/authStore'
import Loading from '../../components/common/Loading'
import CustomDropdown from '../../components/common/CustomDropdown'
import RichTextEditor from '../../components/common/RichTextEditor'
import { Plus, X, Image as ImageIcon, Check, Info, Home, MapPin, DollarSign, List, ArrowLeft, Save, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react'

import { State, City } from 'country-state-city'

const FarmhouseForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuthStore()
  const isEdit = !!id

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [errors, setErrors] = useState({})

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    termsAndConditions: '',
    notes: '',
    amenities: {
      guests: 0,
      bedrooms: 0,
      bathrooms: 0,
      pool: false,
      lawn: false,
      bbq: false,
      ac: false,
      wifi: false,
      parking: false,
      kitchen: false,
      tv: false,
      musicSystem: false,
      extraAmenities: []
    },
    pricing: {
      regular: { rate12h: 0, rate24h: 0, perNight: 0 },
      weekend: { rate12h: 0, rate24h: 0, perNight: 0 },
      festival: { rate12h: 0, rate24h: 0, perNight: 0 }
    },
    festivalDates: [],
    deposit: {
      description: '',
      type: 'percentage',
      value: 0
    },
    checkInTime: '14:00',
    checkOutTime: '11:00',
    address: {
      fullAddress: '',
      city: '',
      state: '',
      pincode: ''
    },
    organizer: {
      name: user?.name || '',
      contactInfo: user?.mobile || user?.email || '',
    },
    paymentConfig: {
      gateway: 'razorpay',
      razorpay: { keyId: '', keySecret: '' },
      cashfree: { appId: '', secretKey: '' },
      ccavenue: { merchantId: '', accessCode: '', workingKey: '' }
    }
  })

  const [bannerFiles, setBannerFiles] = useState([])
  const [bannerPreviews, setBannerPreviews] = useState([])
  const [existingBanners, setExistingBanners] = useState([])

  const states = State.getStatesOfCountry('IN').map(s => ({
    value: s.name,
    label: s.name,
    isoCode: s.isoCode
  }))

  const getCities = (stateName) => {
    if (!stateName) return []
    const state = states.find(s => s.value === stateName)
    if (!state) return []
    return City.getCitiesOfState('IN', state.isoCode).map(c => ({
      value: c.name,
      label: c.name
    }))
  }

  useEffect(() => {
    if (isEdit) {
      fetchFarmhouse()
    }
  }, [id])

  const fetchFarmhouse = async () => {
    try {
      const response = await api.get(`/farmhouses/public/${id}`)
      if (response.data.status === 200) {
        const fh = response.data.result.farmhouse
        const defaultPaymentConfig = {
          gateway: 'razorpay',
          razorpay: { keyId: '', keySecret: '' },
          cashfree: { appId: '', secretKey: '' },
          ccavenue: { merchantId: '', accessCode: '', workingKey: '' }
        }
        setFormData({
          ...fh,
          festivalDates: (fh.festivalDates || []).map(d => new Date(d).toISOString().split('T')[0]),
          paymentConfig: { ...defaultPaymentConfig, ...(fh.paymentConfig || {}) }
        })
        setExistingBanners(fh.banners || [])
      }
    } catch (error) {
      toast.error('Failed to fetch farmhouse details')
      navigate('/farmhouses')
    } finally {
      setLoading(false)
    }
  }

  const validatePincode = (value) => {
    if (!value) return 'Pincode is required'
    const numericValue = value.replace(/\D/g, '')
    if (numericValue.length !== 6) return 'Pincode must be exactly 6 digits'
    return ''
  }

  const validateBasicInfoTab = () => {
    const newErrors = {}
    if (!formData.title?.trim()) newErrors.title = 'Title is required'
    if (!formData.description?.trim() || formData.description === '<p><br></p>') newErrors.description = 'Description is required'
    if (!formData.address.fullAddress?.trim()) newErrors.fullAddress = 'Address is required'
    if (!formData.address.state) newErrors.state = 'State is required'
    if (!formData.address.city) newErrors.city = 'City is required'
    const pinErr = validatePincode(formData.address.pincode)
    if (pinErr) newErrors.pincode = pinErr
    if (!formData.checkInTime) newErrors.checkInTime = 'Check-in time is required'
    if (!formData.checkOutTime) newErrors.checkOutTime = 'Check-out time is required'

    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const validatePricingTab = () => {
    const newErrors = {}
    if (formData.pricing.regular.rate24h <= 0) newErrors.pricing = 'Please set regular 24h rate'
    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const validatePaymentTab = () => {
    const newErrors = {}
    const gw = formData.paymentConfig.gateway
    if (gw === 'razorpay') {
      if (!formData.paymentConfig.razorpay.keyId?.trim()) newErrors.razorpayKeyId = 'Key ID is required'
      if (!formData.paymentConfig.razorpay.keySecret?.trim()) newErrors.razorpayKeySecret = 'Key Secret is required'
    } else if (gw === 'cashfree') {
      if (!formData.paymentConfig.cashfree.appId?.trim()) newErrors.cashfreeAppId = 'App ID is required'
      if (!formData.paymentConfig.cashfree.secretKey?.trim()) newErrors.cashfreeSecretKey = 'Secret Key is required'
    }
    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const handleTabChange = (targetTab) => {
    const tabs = ['basic', 'amenities', 'pricing', 'payment', 'media']
    const currIdx = tabs.indexOf(activeTab)
    const targetIdx = tabs.indexOf(targetTab)

    if (targetIdx > currIdx) {
      let isValid = false
      if (activeTab === 'basic') isValid = validateBasicInfoTab()
      else if (activeTab === 'pricing') isValid = validatePricingTab()
      else if (activeTab === 'payment') isValid = validatePaymentTab()
      else isValid = true

      if (isValid) setActiveTab(targetTab)
      else toast.error('Please fix validation errors')
    } else {
      setActiveTab(targetTab)
    }
  }

  const handleNextTab = () => {
    const tabs = ['basic', 'amenities', 'pricing', 'payment', 'media']
    const nextIdx = tabs.indexOf(activeTab) + 1
    if (nextIdx < tabs.length) {
      handleTabChange(tabs[nextIdx])
    }
  }

  const handlePreviousTab = () => {
    const tabs = ['basic', 'amenities', 'pricing', 'payment', 'media']
    const prevIdx = tabs.indexOf(activeTab) - 1
    if (prevIdx >= 0) {
      setActiveTab(tabs[prevIdx])
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.includes('.')) {
      const parts = name.split('.')
      if (parts.length === 3) {
        const [p1, p2, p3] = parts
        setFormData(prev => ({
          ...prev,
          [p1]: { ...prev[p1], [p2]: { ...prev[p1][p2], [p3]: value } }
        }))
      } else {
        const [p, c] = parts
        setFormData(prev => ({
          ...prev,
          [p]: { ...prev[p], [c]: value }
        }))
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    const field = name.split('.').pop()
    if (errors[field]) {
      setErrors(prev => {
        const e = { ...prev }; delete e[field]; return e
      })
    }
  }

  const handleAmenityChange = (name, val) => {
    setFormData(prev => ({
      ...prev,
      amenities: { ...prev.amenities, [name]: val }
    }))
  }

  const addExtraAmenity = () => {
    setFormData(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        extraAmenities: [...(prev.amenities.extraAmenities || []), { name: '', available: true }]
      }
    }))
  }

  const removeExtraAmenity = (index) => {
    setFormData(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        extraAmenities: prev.amenities.extraAmenities.filter((_, i) => i !== index)
      }
    }))
  }

  const updateExtraAmenity = (index, field, value) => {
    const newExtras = [...(formData.amenities.extraAmenities || [])]
    newExtras[index][field] = value
    setFormData(prev => ({
      ...prev,
      amenities: { ...prev.amenities, extraAmenities: newExtras }
    }))
  }

  const handlePricingChange = (tier, type, val) => {
    setFormData(prev => ({
      ...prev,
      pricing: { ...prev.pricing, [tier]: { ...prev.pricing[tier], [type]: Number(val) } }
    }))
  }

  const handleAddFestivalDate = (val) => {
    if (!val || formData.festivalDates.includes(val)) return
    setFormData(prev => ({ ...prev, festivalDates: [...prev.festivalDates, val] }))
  }

  const handleBannerChange = (e) => {
    const files = Array.from(e.target.files)
    setBannerFiles(prev => [...prev, ...files])
    const pre = files.map(f => URL.createObjectURL(f))
    setBannerPreviews(prev => [...prev, ...pre])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateBasicInfoTab() || !validatePricingTab() || !validatePaymentTab()) {
      toast.error('Please fix validation errors')
      return
    }

    try {
      setSaving(true)
      const data = new FormData()
      Object.keys(formData).forEach(k => {
        if (['amenities', 'pricing', 'deposit', 'address', 'organizer', 'paymentConfig', 'festivalDates'].includes(k)) {
          data.append(k, JSON.stringify(formData[k]))
        } else if (!['banners'].includes(k)) {
          data.append(k, formData[k])
        }
      })
      data.append('existingBanners', JSON.stringify(existingBanners))
      bannerFiles.forEach(f => data.append('banners', f))

      const url = isEdit ? `/farmhouses/organizer/${id}` : '/farmhouses/organizer'
      const method = isEdit ? 'put' : 'post'
      const response = await api[method](url, data)

      if (response.data.status === 200 || response.data.status === 201) {
        toast.success(isEdit ? 'Farmhouse updated' : 'Farmhouse created')
        navigate('/farmhouses')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-lg"><Loading text="Loading details..." /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/farmhouses')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Back to Farmhouses">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{isEdit ? 'Edit Farmhouse' : 'Create New Farmhouse'}</h1>
          <p className="text-sm text-gray-500 mt-1">Provide details about your farmhouse</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-gray-200 bg-white">
            <div className="px-6 overflow-x-auto">
              <nav className="flex space-x-1 min-w-max" aria-label="Tabs">
                {[
                  { id: 'basic', label: 'Basic Info', icon: Info },
                  { id: 'amenities', label: 'Amenities', icon: List },
                  { id: 'pricing', label: 'Pricing', icon: DollarSign },
                  { id: 'payment', label: 'Payment', icon: CreditCard },
                  { id: 'media', label: 'Media', icon: ImageIcon }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTabChange(t.id)}
                    className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === t.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <t.icon className="w-4 h-4" />
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'basic' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                      placeholder="e.g. Dream Valley Farmhouse"
                    />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <RichTextEditor name="description" value={formData.description} onChange={handleInputChange} />
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                  </div>
                  <div className="col-span-2 pt-4 border-t border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary-500" /> Location Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                        <CustomDropdown
                          value={formData.address.state}
                          onChange={(v) => {
                            handleInputChange({ target: { name: 'address.state', value: v } });
                            handleInputChange({ target: { name: 'address.city', value: v === formData.address.state ? formData.address.city : '' } });
                          }}
                          options={[{ value: '', label: 'Select State' }, ...states]}
                          searchable={true}
                          className={errors.state ? 'border-red-500' : ''}
                        />
                        {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                        <CustomDropdown
                          value={formData.address.city}
                          onChange={(v) => handleInputChange({ target: { name: 'address.city', value: v } })}
                          options={[{ value: '', label: 'Select City' }, ...getCities(formData.address.state)]}
                          searchable={true}
                          disabled={!formData.address.state}
                          className={errors.city ? 'border-red-500' : ''}
                        />
                        {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                        <input type="text" name="address.pincode" value={formData.address.pincode} onChange={handleInputChange} maxLength={6} className={`input-field ${errors.pincode ? 'border-red-500' : ''}`} placeholder="6 digits" />
                        {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Address *</label>
                        <textarea name="address.fullAddress" value={formData.address.fullAddress} onChange={handleInputChange} rows={2} className={`input-field ${errors.fullAddress ? 'border-red-500' : ''}`} placeholder="Street, area, landmarks" />
                        {errors.fullAddress && <p className="text-red-500 text-xs mt-1">{errors.fullAddress}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100 col-span-2 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Time *</label>
                      <input type="time" name="checkInTime" value={formData.checkInTime} onChange={handleInputChange} className={`input-field ${errors.checkInTime ? 'border-red-500' : ''}`} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Time *</label>
                      <input type="time" name="checkOutTime" value={formData.checkOutTime} onChange={handleInputChange} className={`input-field ${errors.checkOutTime ? 'border-red-500' : ''}`} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'amenities' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Guest Capacity</label>
                    <input type="number" value={formData.amenities.guests} onChange={(e) => handleAmenityChange('guests', e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                    <input type="number" value={formData.amenities.bedrooms} onChange={(e) => handleAmenityChange('bedrooms', e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                    <input type="number" value={formData.amenities.bathrooms} onChange={(e) => handleAmenityChange('bathrooms', e.target.value)} className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-50">
                  {['pool', 'lawn', 'bbq', 'ac', 'wifi', 'parking', 'kitchen', 'tv', 'musicSystem'].map(amn => (
                    <label key={amn} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${formData.amenities[amn] ? 'bg-primary-50 border-primary-200' : 'bg-gray-50 border-gray-200'}`}>
                      <input type="checkbox" checked={formData.amenities[amn]} onChange={(e) => handleAmenityChange(amn, e.target.checked)} className="w-5 h-5 text-primary-600 rounded" />
                      <span className="text-sm font-medium capitalize">{amn}</span>
                    </label>
                  ))}
                </div>

                <div className="pt-6 border-t border-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      Dynamic Amenities
                    </h3>
                    <button
                      type="button"
                      onClick={addExtraAmenity}
                      className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg text-sm font-semibold hover:bg-primary-200 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Amenity
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(formData.amenities.extraAmenities || []).map((amn, idx) => (
                      <div key={idx} className={`flex items-center gap-3 p-3 border rounded-xl transition-all ${amn.available ? 'bg-primary-50/30 border-primary-100' : 'bg-gray-50 border-gray-200'}`}>
                        <input
                          type="checkbox"
                          checked={amn.available}
                          onChange={(e) => updateExtraAmenity(idx, 'available', e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <input
                          type="text"
                          value={amn.name}
                          onChange={(e) => updateExtraAmenity(idx, 'name', e.target.value)}
                          className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-gray-700"
                          placeholder="e.g. WiFi Name"
                        />
                        <button
                          type="button"
                          onClick={() => removeExtraAmenity(idx)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="space-y-8 animate-fadeIn">
                {['regular', 'weekend', 'festival'].map(tier => (
                  <div key={tier} className="space-y-4">
                    <h3 className="text-lg font-semibold capitalize border-l-4 border-primary-500 pl-3">{tier} Rates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {['rate12h', 'rate24h', 'perNight'].map(type => (
                        <div key={type}>
                          <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-tighter">{type.replace('rate', '')} Rate</label>
                          <input type="number" value={formData.pricing[tier][type]} onChange={(e) => handlePricingChange(tier, type, e.target.value)} className="input-field" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {errors.pricing && <p className="text-red-500 text-xs">{errors.pricing}</p>}

                <div className="pt-6 border-t border-gray-100 space-y-4">
                  <h3 className="text-lg font-semibold">Festival Dates</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.festivalDates.map(date => (
                      <div key={date} className="flex items-center gap-2 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg border border-primary-100 text-sm">
                        {new Date(date).toLocaleDateString()}
                        <button type="button" onClick={() => setFormData(p => ({ ...p, festivalDates: p.festivalDates.filter(d => d !== date) }))} className="p-0.5 hover:bg-primary-100 rounded-full"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 max-w-xs">
                    <input type="date" onChange={(e) => { handleAddFestivalDate(e.target.value); e.target.value = '' }} className="input-field" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-8 animate-fadeIn">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-700">Configure your payment gateway. These details will be used to process bookings for this farmhouse.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Gateway</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['razorpay', 'cashfree', 'ccavenue'].map(gw => (
                      <button
                        key={gw}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, paymentConfig: { ...p.paymentConfig, gateway: gw } }))}
                        className={`p-4 border-2 rounded-xl text-center font-bold capitalize transition-all ${formData.paymentConfig.gateway === gw ? 'border-primary-600 bg-primary-50 text-primary-600' : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        {gw}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.paymentConfig.gateway === 'razorpay' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Key ID</label>
                      <input type="text" name="paymentConfig.razorpay.keyId" value={formData.paymentConfig.razorpay.keyId} onChange={handleInputChange} className={`input-field ${errors.razorpayKeyId ? 'border-red-500' : ''}`} />
                      {errors.razorpayKeyId && <p className="text-red-500 text-xs mt-1">{errors.razorpayKeyId}</p>}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Key Secret</label>
                      <input type="password" name="paymentConfig.razorpay.keySecret" value={formData.paymentConfig.razorpay.keySecret} onChange={handleInputChange} className={`input-field ${errors.razorpayKeySecret ? 'border-red-500' : ''}`} />
                      {errors.razorpayKeySecret && <p className="text-red-500 text-xs mt-1">{errors.razorpayKeySecret}</p>}
                    </div>
                  </div>
                )}

                {formData.paymentConfig.gateway === 'cashfree' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">App ID</label>
                      <input type="text" name="paymentConfig.cashfree.appId" value={formData.paymentConfig.cashfree.appId} onChange={handleInputChange} className={`input-field ${errors.cashfreeAppId ? 'border-red-500' : ''}`} />
                      {errors.cashfreeAppId && <p className="text-red-500 text-xs mt-1">{errors.cashfreeAppId}</p>}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Secret Key</label>
                      <input type="password" name="paymentConfig.cashfree.secretKey" value={formData.paymentConfig.cashfree.secretKey} onChange={handleInputChange} className={`input-field ${errors.cashfreeSecretKey ? 'border-red-500' : ''}`} />
                      {errors.cashfreeSecretKey && <p className="text-red-500 text-xs mt-1">{errors.cashfreeSecretKey}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center relative hover:border-primary-300 transition-colors">
                  <input type="file" multiple onChange={handleBannerChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                  <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-600">Click or drag banner photos here</p>
                  <p className="text-xs text-gray-400 mt-1">Recommended: 1920x1080px (Max 10MB each)</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {existingBanners.map((url, idx) => (
                    <div key={`idx-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-emerald-100 shadow-sm group">
                      <img src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}${url}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setExistingBanners(p => p.filter((_, i) => i !== idx))} className="absolute top-1.5 right-1.5 p-1 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                  {bannerPreviews.map((url, idx) => (
                    <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-blue-100 shadow-sm group">
                      <img src={url} className="w-full h-full object-cover" />
                      <div className="absolute top-1 left-1 bg-blue-500 text-white text-[8px] px-1 rounded font-bold">NEW</div>
                      <button type="button" onClick={() => { setBannerFiles(p => p.filter((_, i) => i !== idx)); setBannerPreviews(p => p.filter((_, i) => i !== idx)) }} className="absolute top-1.5 right-1.5 p-1 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex gap-3 order-2 sm:order-1">
              <button type="button" onClick={() => navigate('/farmhouses')} className="px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-white transition-all">Cancel</button>
              {activeTab !== 'basic' && (
                <button type="button" onClick={handlePreviousTab} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
              )}
            </div>
            <div className="flex gap-3 order-1 sm:order-2">
              {activeTab !== 'media' ? (
                <button type="button" onClick={handleNextTab} className="px-8 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 flex items-center gap-2">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button type="submit" disabled={saving} className="px-10 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2 disabled:opacity-50">
                  {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                  {isEdit ? 'Update Farmhouse' : 'Publish Farmhouse'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FarmhouseForm
