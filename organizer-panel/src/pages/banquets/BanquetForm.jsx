import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import { useAuthStore } from '../../store/authStore'
import Loading from '../../components/common/Loading'
import CustomDropdown from '../../components/common/CustomDropdown'
import RichTextEditor from '../../components/common/RichTextEditor'
import {
  Building2, Plus, Trash2, Image as ImageIcon, MapPin,
  Info, Sparkles, Layout, ChevronLeft, ChevronRight, Save, X, ShieldCheck
} from 'lucide-react'

import { State, City } from 'country-state-city'

const BanquetForm = () => {
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
    amenities: [
      { name: 'Bridal Room', available: true },
      { name: 'Stage', available: true },
      { name: 'DJ', available: true },
      { name: 'Generator', available: true },
      { name: 'Pool', available: false }
    ],
    venues: [
      { name: 'Main Hall', seatingCapacity: 0, floatingCapacity: 0 }
    ],
    address: {
      fullAddress: '',
      city: '',
      state: '',
      pincode: '',
    },
    organizer: {
      name: user?.name || '',
      contactInfo: user?.mobile || user?.email || '',
    }
  })

  const [bannerFiles, setBannerFiles] = useState([])
  const [bannerPreviews, setBannerPreviews] = useState([])
  const [banquetImageFiles, setBanquetImageFiles] = useState([])
  const [banquetImagePreviews, setBanquetImagePreviews] = useState([])
  const [existingBanners, setExistingBanners] = useState([])
  const [existingBanquetImages, setExistingBanquetImages] = useState([])

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
      fetchBanquet()
    }
  }, [id])

  const fetchBanquet = async () => {
    try {
      const response = await api.get(`/banquets/public/${id}`)
      if (response.data.status === 200) {
        const banquet = response.data.result.banquet
        setFormData({
          title: banquet.title || '',
          description: banquet.description || '',
          termsAndConditions: banquet.termsAndConditions || '',
          notes: banquet.notes || '',
          amenities: banquet.amenities || [],
          venues: banquet.venues || [],
          address: banquet.address || { fullAddress: '', city: '', state: '', pincode: '' },
          organizer: banquet.organizer || { name: user?.name || '', contactInfo: user?.mobile || '' }
        })
        setExistingBanners(banquet.banners || [])
        setExistingBanquetImages(banquet.banquetImages || [])
      }
    } catch (error) {
      console.error('Error fetching banquet:', error)
      toast.error('Failed to load banquet details')
      navigate('/banquets')
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
    const pinError = validatePincode(formData.address.pincode)
    if (pinError) newErrors.pincode = pinError

    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const validateVenuesTab = () => {
    const newErrors = {}
    if (!formData.venues || formData.venues.length === 0) {
      newErrors.venues = 'At least one venue is required'
    } else {
      formData.venues.forEach((v, i) => {
        if (!v.name?.trim()) newErrors[`venue_${i}_name`] = 'Venue name is required'
      })
    }
    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const validateAmenitiesTab = () => {
    const newErrors = {}
    if (!formData.amenities || formData.amenities.length === 0) {
      newErrors.amenities = 'At least one amenity is required'
    } else {
      formData.amenities.forEach((a, i) => {
        if (!a.name?.trim()) newErrors[`amenity_${i}_name`] = 'Amenity name is required'
      })
    }
    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const validatePoliciesTab = () => {
    const newErrors = {}
    if (!formData.termsAndConditions?.trim() || formData.termsAndConditions === '<p><br></p>') {
      newErrors.termsAndConditions = 'Terms & Conditions are required'
    }
    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const validateForm = () => {
    const b = validateBasicInfoTab()
    const v = validateVenuesTab()
    const a = validateAmenitiesTab()
    const p = validatePoliciesTab()
    return b && v && a && p
  }

  const handleTabChange = (targetTab) => {
    const tabs = ['basic', 'venues', 'amenities', 'policies', 'media']
    const currIdx = tabs.indexOf(activeTab)
    const targetIdx = tabs.indexOf(targetTab)

    if (targetIdx > currIdx) {
      let isValid = false
      let msg = ''
      if (activeTab === 'basic') { isValid = validateBasicInfoTab(); msg = 'Please fill Basic info' }
      else if (activeTab === 'venues') { isValid = validateVenuesTab(); msg = 'Please fill Venues' }
      else if (activeTab === 'amenities') { isValid = validateAmenitiesTab(); msg = 'Please fill Amenities' }
      else if (activeTab === 'policies') { isValid = validatePoliciesTab(); msg = 'Please fill Policies' }
      else { isValid = true }

      if (isValid) setActiveTab(targetTab)
      else toast.error(msg)
    } else {
      setActiveTab(targetTab)
    }
  }

  const handleNextTab = () => {
    const tabs = ['basic', 'venues', 'amenities', 'policies', 'media']
    const nextIdx = tabs.indexOf(activeTab) + 1
    if (nextIdx < tabs.length) {
      handleTabChange(tabs[nextIdx])
    }
  }

  const handlePreviousTab = () => {
    const tabs = ['basic', 'venues', 'amenities', 'policies', 'media']
    const prevIdx = tabs.indexOf(activeTab) - 1
    if (prevIdx >= 0) {
      setActiveTab(tabs[prevIdx])
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    const newErrors = { ...errors }

    if (name.startsWith('address.')) {
      const field = name.split('.')[1]
      const newAddr = { ...formData.address, [field]: value }
      if (field === 'state') { newAddr.city = ''; delete newErrors.city; delete newErrors.state }
      if (field === 'city') delete newErrors.city
      if (field === 'pincode') {
        const pin = value.replace(/\D/g, '')
        newAddr.pincode = pin
        const err = validatePincode(pin)
        if (err) newErrors.pincode = err; else delete newErrors.pincode
      }
      if (field === 'fullAddress') { if (value.trim()) delete newErrors.fullAddress }

      setFormData(prev => ({ ...prev, address: newAddr }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
      if (name === 'title' && value.trim()) delete newErrors.title
      if (name === 'description' && value.trim() && value !== '<p><br></p>') delete newErrors.description
      if (name === 'termsAndConditions' && value.trim() && value !== '<p><br></p>') delete newErrors.termsAndConditions
    }
    setErrors(newErrors)
  }

  const addAmenity = () => {
    setFormData(prev => ({
      ...prev,
      amenities: [...prev.amenities, { name: '', available: true }]
    }))
  }

  const removeAmenity = (index) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }))
  }

  const updateAmenity = (index, field, value) => {
    const newAmenities = [...formData.amenities]
    newAmenities[index][field] = value
    setFormData(prev => ({ ...prev, amenities: newAmenities }))
    if (field === 'name' && value.trim()) {
      setErrors(prev => {
        const e = { ...prev }; delete e[`amenity_${index}_name`]; return e
      })
    }
  }

  const addVenue = () => {
    setFormData(prev => ({
      ...prev,
      venues: [...prev.venues, { name: '', seatingCapacity: 0, floatingCapacity: 0 }]
    }))
  }

  const removeVenue = (index) => {
    setFormData(prev => ({
      ...prev,
      venues: prev.venues.filter((_, i) => i !== index)
    }))
  }

  const updateVenue = (index, field, value) => {
    const newVenues = [...formData.venues]
    newVenues[index][field] = value
    setFormData(prev => ({ ...prev, venues: newVenues }))
    if (field === 'name' && value.trim()) {
      setErrors(prev => {
        const e = { ...prev }; delete e[`venue_${index}_name`]; return e
      })
    }
  }

  const handleBannerChange = (e) => {
    const files = Array.from(e.target.files)
    setBannerFiles(prev => [...prev, ...files])
    const pre = files.map(f => URL.createObjectURL(f))
    setBannerPreviews(prev => [...prev, ...pre])
  }

  const handleBanquetImageChange = (e) => {
    const files = Array.from(e.target.files)
    setBanquetImageFiles(prev => [...prev, ...files])
    const pre = files.map(f => URL.createObjectURL(f))
    setBanquetImagePreviews(prev => [...prev, ...pre])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Please fix validation errors')
      return
    }

    try {
      setSaving(true)
      const submitData = new FormData()

      Object.keys(formData).forEach(key => {
        if (['amenities', 'venues', 'address', 'organizer'].includes(key)) {
          submitData.append(key, JSON.stringify(formData[key]))
        } else {
          submitData.append(key, formData[key])
        }
      })

      if (isEdit) {
        submitData.append('existingBanners', JSON.stringify(existingBanners))
        submitData.append('existingBanquetImages', JSON.stringify(existingBanquetImages))
      }

      bannerFiles.forEach(file => submitData.append('banners', file))
      banquetImageFiles.forEach(file => submitData.append('banquetImages', file))

      const response = isEdit
        ? await api.put(`/banquets/organizer/${id}`, submitData)
        : await api.post('/banquets/organizer', submitData)

      if (response.data.status === 200 || response.data.status === 201) {
        toast.success(`Banquet ${isEdit ? 'updated' : 'created'} successfully`)
        navigate('/banquets')
      }
    } catch (error) {
      console.error('Error saving banquet:', error)
      toast.error(error.response?.data?.message || 'Failed to save banquet')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-lg"><Loading text="Loading details..." /></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/banquets')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Back to Banquets"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isEdit ? 'Edit Banquet' : 'Create New Banquet'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEdit ? 'Update your banquet hall details' : 'Fill in the details to list your banquet hall'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-white">
            <div className="px-6 overflow-x-auto">
              <nav className="flex space-x-1 min-w-max" aria-label="Tabs">
                {[
                  { id: 'basic', label: 'Basic Info', icon: Info },
                  { id: 'venues', label: 'Venues', icon: Layout },
                  { id: 'amenities', label: 'Amenities', icon: Sparkles },
                  { id: 'policies', label: 'Policies', icon: ShieldCheck },
                  { id: 'media', label: 'Media', icon: ImageIcon }
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTabChange(t.id)}
                    className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === t.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 capitalize flex items-center gap-2">
                    <Info className="w-5 h-5 text-primary-500" />
                    Basic Information
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banquet Title *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                      placeholder="e.g. Grand Regency Ballroom"
                    />
                    {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <RichTextEditor
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your banquet hall..."
                    />
                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary-500" />
                      Location Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                        <CustomDropdown
                          value={formData.address.state}
                          onChange={(v) => {
                            handleInputChange({ target: { name: 'address.state', value: v } });
                            if (v !== formData.address.state) {
                              handleInputChange({ target: { name: 'address.city', value: '' } });
                            }
                          }}
                          options={[
                            { value: '', label: 'Select State' },
                            ...states
                          ]}
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
                        <input
                          type="text"
                          name="address.pincode"
                          value={formData.address.pincode}
                          onChange={handleInputChange}
                          maxLength={6}
                          className={`input-field ${errors.pincode ? 'border-red-500' : ''}`}
                          placeholder="6 digits"
                        />
                        {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Address *</label>
                        <textarea
                          name="address.fullAddress"
                          value={formData.address.fullAddress}
                          onChange={handleInputChange}
                          rows={2}
                          className={`input-field ${errors.fullAddress ? 'border-red-500' : ''}`}
                          placeholder="Street, area, and nearby landmarks"
                        />
                        {errors.fullAddress && <p className="text-red-500 text-xs mt-1">{errors.fullAddress}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'venues' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Layout className="w-5 h-5 text-primary-500" />
                    Venues & Capacities *
                  </h3>
                  <button
                    type="button"
                    onClick={addVenue}
                    className="btn-secondary py-2 px-4 text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Venue
                  </button>
                </div>

                <div className="grid gap-4">
                  {formData.venues.map((venue, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl relative group">
                      {formData.venues.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVenue(idx)}
                          className="absolute -top-2 -right-2 p-1.5 bg-white border border-red-100 text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-black uppercase text-gray-400 mb-1 tracking-tighter">Venue Name *</label>
                          <input
                            type="text"
                            value={venue.name}
                            onChange={(e) => updateVenue(idx, 'name', e.target.value)}
                            className={`input-field py-2 text-sm ${errors[`venue_${idx}_name`] ? 'border-red-500' : ''}`}
                            placeholder="e.g. Main Hall"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black uppercase text-gray-400 mb-1 tracking-tighter">Seating Capacity</label>
                          <input
                            type="number"
                            value={venue.seatingCapacity}
                            onChange={(e) => updateVenue(idx, 'seatingCapacity', parseInt(e.target.value))}
                            className="input-field py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-black uppercase text-gray-400 mb-1 tracking-tighter">Floating Capacity</label>
                          <input
                            type="number"
                            value={venue.floatingCapacity}
                            onChange={(e) => updateVenue(idx, 'floatingCapacity', parseInt(e.target.value))}
                            className="input-field py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {errors.venues && <p className="text-red-500 text-xs mt-1">{errors.venues}</p>}
                </div>
              </div>
            )}

            {activeTab === 'amenities' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary-500" />
                    Amenities & Facilities *
                  </h3>
                  <button
                    type="button"
                    onClick={addAmenity}
                    className="btn-secondary py-2 px-4 text-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Amenity
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formData.amenities.map((amn, idx) => (
                    <div key={idx} className={`flex items-center gap-3 p-3 border rounded-xl transition-all ${amn.available ? 'bg-primary-50/30 border-primary-100' : 'bg-gray-50 border-gray-200'}`}>
                      <input
                        type="checkbox"
                        checked={amn.available}
                        onChange={(e) => updateAmenity(idx, 'available', e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <input
                        type="text"
                        value={amn.name}
                        onChange={(e) => updateAmenity(idx, 'name', e.target.value)}
                        className={`flex-1 bg-transparent border-none outline-none text-sm font-medium ${errors[`amenity_${idx}_name`] ? 'text-red-500 italic' : 'text-gray-700'}`}
                        placeholder="e.g. WiFi"
                      />
                      <button
                        type="button"
                        onClick={() => removeAmenity(idx)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {errors.amenities && <p className="text-red-500 text-xs mt-1 col-span-full">{errors.amenities}</p>}
                </div>
              </div>
            )}

            {activeTab === 'policies' && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-primary-500" />
                  Rules & Policies
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions *</label>
                  <RichTextEditor
                    name="termsAndConditions"
                    value={formData.termsAndConditions}
                    onChange={handleInputChange}
                    placeholder="Specify booking rules, cancellation policy, etc."
                  />
                  {errors.termsAndConditions && <p className="text-red-500 text-xs mt-1">{errors.termsAndConditions}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                  <RichTextEditor
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Any other important info..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-8 animate-fadeIn">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5 text-primary-500" />
                  Media & Gallery
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Banner Images */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-gray-700">Banner Images</label>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-black uppercase">Max 10</span>
                    </div>
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-primary-300 transition-colors relative">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleBannerChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-600">Click or drag banners here</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (Max 5MB each)</p>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {existingBanners.map((url, idx) => (
                        <div key={`eb-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-emerald-100 group shadow-sm">
                          <img src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}${url}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setExistingBanners(p => p.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-all scale-75">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {bannerPreviews.map((url, idx) => (
                        <div key={`nb-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-blue-100 group shadow-sm">
                          <img src={url} className="w-full h-full object-cover" />
                          <div className="absolute top-1 left-1 bg-blue-500 text-white text-[8px] px-1 rounded font-bold">NEW</div>
                          <button type="button" onClick={() => {
                            setBannerFiles(p => p.filter((_, i) => i !== idx))
                            setBannerPreviews(p => p.filter((_, i) => i !== idx))
                          }} className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-all scale-75">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gallery Images */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-gray-700">Gallery Images</label>
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-black uppercase">Max 20</span>
                    </div>
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-primary-300 transition-colors relative">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleBanquetImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-600">Upload hall or property photos</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP (Max 5MB each)</p>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {existingBanquetImages.map((url, idx) => (
                        <div key={`ei-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-emerald-100 group shadow-sm">
                          <img src={`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}${url}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setExistingBanquetImages(p => p.filter((_, i) => i !== idx))} className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-all scale-75">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {banquetImagePreviews.map((url, idx) => (
                        <div key={`ni-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-blue-100 group shadow-sm">
                          <img src={url} className="w-full h-full object-cover" />
                          <div className="absolute top-1 left-1 bg-blue-500 text-white text-[8px] px-1 rounded font-bold">NEW</div>
                          <button type="button" onClick={() => {
                            setBanquetImageFiles(p => p.filter((_, i) => i !== idx))
                            setBanquetImagePreviews(p => p.filter((_, i) => i !== idx))
                          }} className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-all scale-75">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex gap-3 order-2 sm:order-1">
              <button type="button" onClick={() => navigate('/banquets')} className="px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-white transition-all">Cancel</button>
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
                  {isEdit ? 'Update Banquet' : 'Publish Banquet'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BanquetForm
