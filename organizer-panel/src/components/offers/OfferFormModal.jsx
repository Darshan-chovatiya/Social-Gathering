import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../common/ToastContainer'
import Modal from '../common/Modal'
import Loading from '../common/Loading'
import CustomDropdown from '../common/CustomDropdown'
import RichTextEditor from '../common/RichTextEditor'
import { X } from 'lucide-react'

const OfferFormModal = ({ isOpen, onClose, offerId, onSuccess }) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [events, setEvents] = useState([])
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'percentage',
    value: '',
    minPurchaseAmount: '',
    eventId: '',
    validFrom: '',
    validUntil: '',
    code: '',
    usageLimit: '',
    perCustomerLimit: '1',
    isActive: true,
  })

  const isEditMode = !!offerId

  useEffect(() => {
    if (isOpen) {
      setErrors({})
      fetchEvents()
      if (isEditMode) {
        fetchOffer()
      } else {
        // Reset form for create mode
        setFormData({
          title: '',
          description: '',
          type: 'percentage',
          value: '',
          minPurchaseAmount: '',
          eventId: '',
          validFrom: '',
          validUntil: '',
          code: '',
          usageLimit: '',
          perCustomerLimit: '1',
          isActive: true,
        })
      }
    }
  }, [isOpen, offerId])

  // Helper function to check if an event is past
  const isEventPast = (event) => {
    if (!event.slots || event.slots.length === 0) return true
    
    const now = new Date()
    
    // Check if all active slots are in the past
    const activeSlots = event.slots.filter(slot => slot.isActive !== false)
    if (activeSlots.length === 0) return true
    
    // An event is past if all active slots have dates in the past
    // We check the slot date + end time to see if it's completely over
    return activeSlots.every(slot => {
      if (!slot.date) return true
      const slotDate = new Date(slot.date)
      
      // If slot has end time, combine date and end time
      if (slot.endTime) {
        const [hours, minutes] = slot.endTime.split(':').map(Number)
        slotDate.setHours(hours, minutes, 0, 0)
      } else {
        // If no end time, consider the slot ends at end of day
        slotDate.setHours(23, 59, 59, 999)
      }
      
      return slotDate < now
    })
  }

  const fetchEvents = async () => {
    try {
      const response = await api.get('/organizer/events?limit=100')
      if (response.data.status === 200) {
        // Filter out past events
        const allEvents = response.data.result.events || []
        const upcomingEvents = allEvents.filter(event => !isEventPast(event))
        setEvents(upcomingEvents)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const fetchOffer = async () => {
    try {
      setFetching(true)
      const response = await api.get(`/organizer/offers?limit=100`)
      if (response.data.status === 200) {
        const offer = response.data.result.offers.find(o => o._id === offerId)
        if (offer) {
          setFormData({
            title: offer.title || '',
            description: offer.description || '',
            type: offer.type || 'percentage',
            value: offer.value?.toString() || '',
            minPurchaseAmount: offer.minPurchaseAmount?.toString() || '',
            eventId: offer.eventId?._id || offer.eventId || '',
            validFrom: offer.validFrom ? new Date(offer.validFrom).toISOString().split('T')[0] : '',
            validUntil: offer.validUntil ? new Date(offer.validUntil).toISOString().split('T')[0] : '',
            code: offer.code || '',
            usageLimit: offer.usageLimit?.toString() || '',
            perCustomerLimit: offer.perCustomerLimit?.toString() || '1',
            isActive: offer.isActive !== undefined ? offer.isActive : true,
          })
        } else {
          toast.error('Offer not found')
          onClose()
        }
      }
    } catch (error) {
      console.error('Error fetching offer:', error)
      toast.error('Failed to load offer details')
    } finally {
      setFetching(false)
    }
  }

  // Validation functions
  const validateValue = (value, type) => {
    if (!value) return 'Discount value is required'
    const num = parseFloat(value)
    if (isNaN(num) || num <= 0) return 'Discount value must be greater than 0'
    if (type === 'percentage' && num > 100) return 'Percentage cannot exceed 100%'
    return ''
  }

  const validateMaxDiscount = (value, type) => {
    if (type === 'percentage' && value) {
      const num = parseFloat(value)
      if (isNaN(num) || num <= 0) return 'Max discount must be greater than 0'
    }
    return ''
  }

  const validateDate = (dateString, fieldName, allowPast = false) => {
    if (!dateString) return `${fieldName} is required`
    if (!allowPast) {
      const selectedDate = new Date(dateString)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) return `${fieldName} cannot be in the past`
    }
    return ''
  }

  const validateDateRange = (validFrom, validUntil) => {
    if (validFrom && validUntil) {
      const from = new Date(validFrom)
      const until = new Date(validUntil)
      if (until <= from) return 'Valid until date must be after valid from date'
    }
    return ''
  }

  const validateCode = (code) => {
    if (!code || !code.trim()) return 'Offer code is required'
    if (code.trim().length < 3) return 'Offer code must be at least 3 characters'
    if (code.trim().length > 20) return 'Offer code must not exceed 20 characters'
    // Allow only alphanumeric characters and hyphens/underscores
    const codeRegex = /^[A-Z0-9_-]+$/
    if (!codeRegex.test(code.trim().toUpperCase())) return 'Offer code can only contain letters, numbers, hyphens, and underscores'
    return ''
  }

  const validateUsageLimit = (usageLimit) => {
    if (!usageLimit || !usageLimit.trim()) return 'Usage limit is required'
    const num = parseInt(usageLimit)
    if (isNaN(num) || num <= 0) return 'Usage limit must be a positive number'
    if (num > 1000000) return 'Usage limit cannot exceed 1,000,000'
    return ''
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    const newErrors = { ...errors }

    // Handle numeric inputs
    if (['value', 'minPurchaseAmount'].includes(name)) {
      const numericValue = value.replace(/[^\d.]/g, '')
      setFormData(prev => ({ ...prev, [name]: numericValue }))
      
      // Validate value
      if (name === 'value') {
        const error = validateValue(numericValue, formData.type)
        if (error) {
          newErrors.value = error
        } else {
          delete newErrors.value
        }
      }
      
      setErrors(newErrors)
      return
    }

    // Handle usageLimit (integers only)
    if (name === 'usageLimit') {
      const integerValue = value.replace(/[^\d]/g, '')
      setFormData(prev => ({ ...prev, [name]: integerValue }))
      
      // Validate usageLimit
      const error = validateUsageLimit(integerValue)
      if (error) {
        newErrors.usageLimit = error
      } else {
        delete newErrors.usageLimit
      }
      
      setErrors(newErrors)
      return
    }

    // perCustomerLimit is always 1, no need to handle changes

    // Handle code input
    if (name === 'code') {
      const upperValue = value.toUpperCase()
      setFormData(prev => ({ ...prev, [name]: upperValue }))
      
      // Validate code inline
      const error = validateCode(upperValue)
      if (error) {
        newErrors.code = error
      } else {
        delete newErrors.code
      }
      
      setErrors(newErrors)
      return
    }

    // Handle date inputs
    if (name === 'validFrom' || name === 'validUntil') {
      setFormData(prev => ({ ...prev, [name]: value }))
      
      // Validate date
      const fieldName = name === 'validFrom' ? 'Valid from date' : 'Valid until date'
      // Allow past dates for validFrom only in edit mode
      const allowPast = isEditMode && name === 'validFrom'
      const error = validateDate(value, fieldName, allowPast)
      if (error) {
        newErrors[name] = error
      } else {
        delete newErrors[name]
      }
      
      // Validate date range
      const rangeError = name === 'validUntil' 
        ? validateDateRange(formData.validFrom, value)
        : validateDateRange(value, formData.validUntil)
      if (rangeError) {
        newErrors.dateRange = rangeError
      } else {
        delete newErrors.dateRange
      }
      
      setErrors(newErrors)
      return
    }

    // Handle type change
    if (name === 'type') {
      setFormData(prev => ({
        ...prev,
        type: value
      }))
      setErrors(newErrors)
      return
    }

    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (newErrors[name]) {
      delete newErrors[name]
      setErrors(newErrors)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.type) newErrors.type = 'Discount type is required'
    
    const valueError = validateValue(formData.value, formData.type)
    if (valueError) newErrors.value = valueError
    
    // Validate code
    const codeError = validateCode(formData.code)
    if (codeError) newErrors.code = codeError
    
    // Validate usageLimit
    const usageLimitError = validateUsageLimit(formData.usageLimit)
    if (usageLimitError) newErrors.usageLimit = usageLimitError
    
    // Allow past dates for validFrom only in edit mode
    const fromError = validateDate(formData.validFrom, 'Valid from date', isEditMode)
    if (fromError) newErrors.validFrom = fromError
    
    const untilError = validateDate(formData.validUntil, 'Valid until date', false)
    if (untilError) newErrors.validUntil = untilError
    
    const rangeError = validateDateRange(formData.validFrom, formData.validUntil)
    if (rangeError) newErrors.dateRange = rangeError
    
    // perCustomerLimit is always 1, no validation needed
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting')
      return
    }
    
    setLoading(true)

    try {
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        value: parseFloat(formData.value),
        minPurchaseAmount: formData.minPurchaseAmount ? parseFloat(formData.minPurchaseAmount) : 0,
        eventId: formData.eventId || null,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
        code: formData.code.trim(),
        usageLimit: parseInt(formData.usageLimit),
        perCustomerLimit: 1, // Always 1 per customer
        isActive: formData.isActive,
      }

      const response = isEditMode
        ? await api.put(`/organizer/offers/${offerId}`, submitData)
        : await api.post('/organizer/offers', submitData)
      
      if (response.data.status === 200 || response.data.status === 201) {
        toast.success(isEditMode ? 'Offer updated successfully!' : 'Offer created successfully!')
        onSuccess?.()
        onClose()
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} offer:`, error)
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${isEditMode ? 'update' : 'create'} offer`
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const footer = (
    <div className="flex justify-end gap-3 p-6">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        disabled={loading || fetching}
      >
        Cancel
      </button>
      <button
        type="submit"
        form="offer-form"
        className="btn-primary"
        disabled={loading || fetching}
      >
        {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Offer' : 'Create Offer')}
      </button>
    </div>
  )

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditMode ? 'Edit Offer' : 'Create New Offer'} 
      size="lg"
      footer={footer}
    >
      {fetching ? (
        <Loading text="Loading offer details..." />
      ) : (
        <form id="offer-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Offer Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                required
              />
              {errors.title && (
                <p className="text-red-500 text-xs mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <RichTextEditor
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter offer description..."
                rows={3}
              />
            </div>

            {/* Event Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event (Optional)</h3>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Event
              </label>
              <CustomDropdown
                value={formData.eventId}
                onChange={(value) => handleInputChange({ target: { name: 'eventId', value } })}
                options={[
                  { value: '', label: 'All Events (Global Offer)' },
                  ...events.map((event) => ({
                    value: event._id,
                    label: event.title,
                  })),
                ]}
                placeholder="All Events (Global Offer)"
                truncateLength={30}
              />
            </div>

            {/* Row: Discount Type, Discount Value, and Minimum Purchase Amount */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type *
                </label>
                <CustomDropdown
                  value={formData.type}
                  onChange={(value) => handleInputChange({ target: { name: 'type', value } })}
                  options={[
                    { value: 'percentage', label: 'Percentage' },
                    { value: 'flat', label: 'Flat Amount' },
                  ]}
                  placeholder="Select discount type"
                  className={errors.type ? 'border-red-500' : ''}
                />
                {errors.type && (
                  <p className="text-red-500 text-xs mt-1">{errors.type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value * {formData.type === 'percentage' ? '(%)' : '(₹)'}
                </label>
                <input
                  type="text"
                  name="value"
                  value={formData.value}
                  onChange={handleInputChange}
                  placeholder={formData.type === 'percentage' ? '0-100' : '0.00'}
                  className={`input-field ${errors.value ? 'border-red-500' : ''}`}
                  required
                />
                {errors.value && (
                  <p className="text-red-500 text-xs mt-1">{errors.value}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Purchase Amount (₹)
                </label>
                <input
                  type="text"
                  name="minPurchaseAmount"
                  value={formData.minPurchaseAmount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Validity Period */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Validity Period *</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid From *
                </label>
                <input
                  type="date"
                  name="validFrom"
                  value={formData.validFrom}
                  onChange={handleInputChange}
                  min={isEditMode ? undefined : new Date().toISOString().split('T')[0]}
                  className={`input-field ${errors.validFrom ? 'border-red-500' : ''}`}
                  required
                />
                {errors.validFrom && (
                  <p className="text-red-500 text-xs mt-1">{errors.validFrom}</p>
                )}
                {isEditMode && (
                  <p className="text-xs text-gray-500 mt-1">Past dates are allowed when editing</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until *
                </label>
                <input
                  type="date"
                  name="validUntil"
                  value={formData.validUntil}
                  onChange={handleInputChange}
                  min={formData.validFrom || new Date().toISOString().split('T')[0]}
                  className={`input-field ${errors.validUntil ? 'border-red-500' : ''}`}
                  required
                />
                {errors.validUntil && (
                  <p className="text-red-500 text-xs mt-1">{errors.validUntil}</p>
                )}
              </div>
            </div>
            {errors.dateRange && (
              <p className="text-red-500 text-xs">{errors.dateRange}</p>
            )}
          </div>

          {/* Additional Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Additional Settings</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Offer Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g., SUMMER2024"
                  className={`input-field ${errors.code ? 'border-red-500' : ''}`}
                  style={{ textTransform: 'uppercase' }}
                  required
                />
                {errors.code && (
                  <p className="text-red-500 text-xs mt-1">{errors.code}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">3-20 characters, alphanumeric only</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usage Limit *
                </label>
                <input
                  type="text"
                  name="usageLimit"
                  value={formData.usageLimit}
                  onChange={handleInputChange}
                  placeholder="Enter usage limit"
                  className={`input-field ${errors.usageLimit ? 'border-red-500' : ''}`}
                  required
                />
                {errors.usageLimit && (
                  <p className="text-red-500 text-xs mt-1">{errors.usageLimit}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Total times offer can be used</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Per Customer Limit
                </label>
                <input
                  type="text"
                  name="perCustomerLimit"
                  value="1"
                  readOnly
                  className="input-field bg-gray-50 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Each customer can use this offer once</p>
              </div>
            </div>

            {isEditMode && (
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
            )}
          </div>
        </form>
      )}
    </Modal>
  )
}

export default OfferFormModal

