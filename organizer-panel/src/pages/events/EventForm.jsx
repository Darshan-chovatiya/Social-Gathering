import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import { useAuthStore } from '../../store/authStore'
import Loading from '../../components/common/Loading'
import CustomDropdown from '../../components/common/CustomDropdown'
import RichTextEditor from '../../components/common/RichTextEditor'
import SponsorFormModal from '../../components/sponsors/SponsorFormModal'
import { Plus, X, ChevronDown, Check, Image as ImageIcon, Globe, Facebook, Twitter, Instagram, Linkedin, Youtube, Award, Edit2, Trash2, Info, Calendar, Ticket, Users, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'

import { State, City } from 'country-state-city'

const EventForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const eventId = id // For edit mode, id will be the eventId from route
  const { toast } = useToast()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [categories, setCategories] = useState([])
  const [sponsors, setSponsors] = useState([])
  const [errors, setErrors] = useState({})
  const [sponsorModalOpen, setSponsorModalOpen] = useState(false)
  const [editingSponsorId, setEditingSponsorId] = useState(null)
  const bannerFileInputRef = useRef(null)
  const eventImageFileInputRef = useRef(null)
  const [existingBanners, setExistingBanners] = useState([]) // For existing banners in edit mode
  const [newBannerPreviews, setNewBannerPreviews] = useState([]) // For preview URLs of new files
  const [newBannerFiles, setNewBannerFiles] = useState([]) // Track new files separately
  const [existingEventImages, setExistingEventImages] = useState([]) // For existing event images in edit mode
  const [newEventImagePreviews, setNewEventImagePreviews] = useState([]) // For preview URLs of new event image files
  const [newEventImageFiles, setNewEventImageFiles] = useState([]) // Track new event image files separately
  const [existingEventDetailImage, setExistingEventDetailImage] = useState(null) // For existing event detail image in edit mode
  const [newEventDetailImageFile, setNewEventDetailImageFile] = useState(null) // Track new event detail image file
  const [newEventDetailImagePreview, setNewEventDetailImagePreview] = useState(null) // Preview URL for new event detail image
  const [imageErrors, setImageErrors] = useState(new Set()) // Track image load errors
  const [activeTab, setActiveTab] = useState('basic') // Tab state: 'basic', 'slots', 'tickets', 'sponsors'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categories: [],
    sponsors: [],
    duration: '',
    address: {
      fullAddress: '',
      city: '',
      state: '',
      pincode: '',
    },
    organizer: {
      name: user?.name || '',
      email: user?.email || '',
      mobile: user?.mobile || '',
      contactInfo: user?.email || user?.mobile || '', // Will be sent to backend
    },
    termsAndConditions: '',
    notes: '',
    slots: [{ date: '', startTime: '', endTime: '', isActive: true }],
    ticketTypes: [{ title: '', price: '', totalQuantity: '', availableQuantity: '', slotId: '', description: '' }],
    banners: [],
    eventImages: [],
    paymentConfig: {
      gateway: 'razorpay',
      razorpay: { keyId: '', keySecret: '' },
      cashfree: { appId: '', secretKey: '' },
      ccavenue: { merchantId: '', accessCode: '', workingKey: '' }
    }
  })

  const isEditMode = !!eventId

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
    setErrors({}) // Reset errors
    setActiveTab('basic') // Reset to first tab
    fetchCategories()
    fetchSponsors()
    if (isEditMode) {
      fetchEvent()
    } else {
        // Reset form for create mode
        setFormData({
          title: '',
          description: '',
          categories: [],
          sponsors: [],
          duration: '',
          address: { fullAddress: '', city: '', state: '', pincode: '' },
          organizer: { 
            name: user?.name || '', 
            email: user?.email || '',
            mobile: user?.mobile || '',
            contactInfo: user?.email || user?.mobile || ''
          },
          termsAndConditions: '',
          notes: '',
          slots: [{ date: '', startTime: '', endTime: '', isActive: true }],
          ticketTypes: [{ title: '', price: '', totalQuantity: '', availableQuantity: '', slotId: '', description: '' }],
          banners: [],
          eventImages: [],
          paymentConfig: {
            gateway: 'razorpay',
            razorpay: { keyId: '', keySecret: '' },
            cashfree: { appId: '', secretKey: '' },
            ccavenue: { merchantId: '', accessCode: '', workingKey: '' }
          }
        })
        setNewBannerFiles([])
        setExistingBanners([])
        setNewBannerPreviews([])
        setNewBannerFiles([])
        setExistingEventImages([])
        setNewEventImagePreviews([])
        setNewEventImageFiles([])
        setExistingEventDetailImage(null)
        setNewEventDetailImageFile(null)
        setNewEventDetailImagePreview(null)
        // Reset sponsor modal
        setSponsorModalOpen(false)
        setEditingSponsorId(null)
      }
  }, [eventId])

  // Clear eventDetailImage error when existing image is present
  useEffect(() => {
    if (isEditMode && existingEventDetailImage) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.eventDetailImage
        return newErrors
      })
    }
  }, [isEditMode, existingEventDetailImage])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories')
      if (response.data.status === 200) {
        setCategories(response.data.result?.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchSponsors = async () => {
    try {
      // Only fetch active sponsors for event form
      const response = await api.get('/organizer/sponsors?limit=100')
      if (response.data.status === 200) {
        // Filter to only show active sponsors (backend already filters, but double-check)
        const activeSponsors = (response.data.result?.sponsors || []).filter(sponsor => sponsor.isActive !== false)
        setSponsors(activeSponsors)
      }
    } catch (error) {
      console.error('Error fetching sponsors:', error)
    }
  }

  const fetchEvent = async () => {
    try {
      setFetching(true)
      const response = await api.get(`/organizer/events/${eventId}`)
      if (response.data.status === 200) {
        const event = response.data.result.event
        
        const formattedSlots = event.slots?.map(slot => ({
          _id: slot._id, // Keep _id for existing slots
          date: slot.date ? new Date(slot.date).toISOString().split('T')[0] : '',
          startTime: slot.startTime || '',
          endTime: slot.endTime || '',
          isActive: slot.isActive !== undefined ? slot.isActive : true,
        })) || [{ date: '', startTime: '', endTime: '', isActive: true }]

        setFormData({
          title: event.title || '',
          description: event.description || '',
          categories: event.categories?.map(c => c._id || c) || [],
          sponsors: event.sponsors?.map(s => s._id || s) || [],
          duration: event.duration || '',
          address: event.address || { fullAddress: '', city: '', state: '', pincode: '' },
          organizer: {
            name: event.organizer?.name || user?.name || '',
            email: user?.email || '',
            mobile: user?.mobile || '',
            contactInfo: event.organizer?.contactInfo || user?.email || user?.mobile || '',
          },
          termsAndConditions: event.termsAndConditions || '',
          notes: event.notes || '',
          slots: formattedSlots,
          ticketTypes: event.ticketTypes?.length > 0 ? event.ticketTypes.map(tt => ({
            _id: tt._id, // Keep _id for existing ticket types
            title: tt.title || '',
            price: tt.price?.toString() || '',
            totalQuantity: tt.totalQuantity?.toString() || '',
            availableQuantity: tt.availableQuantity?.toString() || tt.totalQuantity?.toString() || '',
            description: tt.description || '',
            isActive: tt.isActive !== undefined ? tt.isActive : true,
          })) : [{ title: '', price: '', totalQuantity: '', availableQuantity: '', slotId: '', description: '' }],
          banners: [],
          eventImages: [],
          paymentConfig: {
            gateway: event.paymentConfig?.gateway || 'razorpay',
            razorpay: {
              keyId: event.paymentConfig?.razorpay?.keyId || '',
              keySecret: event.paymentConfig?.razorpay?.keySecret || ''
            },
            cashfree: {
              appId: event.paymentConfig?.cashfree?.appId || '',
              secretKey: event.paymentConfig?.cashfree?.secretKey || ''
            },
            ccavenue: {
              merchantId: event.paymentConfig?.ccavenue?.merchantId || '',
              accessCode: event.paymentConfig?.ccavenue?.accessCode || '',
              workingKey: event.paymentConfig?.ccavenue?.workingKey || ''
            }
          }
        })
        
        // Set existing banners for preview
        if (event.banners && event.banners.length > 0) {
          setExistingBanners(event.banners)
        } else {
          setExistingBanners([])
        }
        setNewBannerPreviews([])
        setNewBannerFiles([])
        
        // Set existing event images for preview
        if (event.eventImages && event.eventImages.length > 0) {
          setExistingEventImages(event.eventImages)
        } else {
          setExistingEventImages([])
        }
        setNewEventImagePreviews([])
        setNewEventImageFiles([])
        
        // Set existing event detail image for preview
        if (event.eventDetailImage) {
          setExistingEventDetailImage(event.eventDetailImage)
          // Clear error if existing image is present
          setErrors(prev => {
            const newErrors = { ...prev }
            delete newErrors.eventDetailImage
            return newErrors
          })
        } else {
          setExistingEventDetailImage(null)
        }
        setNewEventDetailImageFile(null)
        setNewEventDetailImagePreview(null)
      }
    } catch (error) {
      console.error('Error fetching event:', error)
      toast.error('Failed to load event details')
    } finally {
      setFetching(false)
    }
  }

  // Validation functions
  const validateDuration = (value) => {
    const num = parseFloat(value)
    if (!value) return 'Duration is required'
    if (isNaN(num) || num < 1 || num > 24) return 'Duration must be between 1 and 24 hours'
    return ''
  }

  const validateEmail = (value) => {
    if (!value) return 'Contact Info (Email) is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address'
    }
    return ''
  }

  const validateDate = (dateString) => {
    if (!dateString) return 'Date is required'
    const selectedDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDate < today) return 'Date cannot be in the past'
    return ''
  }

  const validatePincode = (value) => {
    if (!value) return 'Pincode is required'
    const numericValue = value.replace(/\D/g, '')
    if (numericValue.length !== 6) return 'Pincode must be exactly 6 digits'
    return ''
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    const newErrors = { ...errors }

    // Validate duration
    if (name === 'duration') {
      const error = validateDuration(value)
      if (error) {
        newErrors.duration = error
      } else {
        delete newErrors.duration
      }
    }

    // Contact info is readonly, no need to handle changes

    if (name.startsWith('address.')) {
      const field = name.split('.')[1]
      const newAddress = { ...formData.address, [field]: value }
      
      // If state changes, reset city
      if (field === 'state') {
        newAddress.city = ''
        // Clear city error if state changes
        delete newErrors.city
      }
      
      // Validate pincode
      if (field === 'pincode') {
        const numericValue = value.replace(/\D/g, '')
        const error = validatePincode(numericValue)
        if (error) {
          newErrors.pincode = error
        } else {
          delete newErrors.pincode
        }
        newAddress.pincode = numericValue
      }
      
      // Validate state and city
      if (field === 'state' && !value) {
        newErrors.state = 'State is required'
      } else if (field === 'state') {
        delete newErrors.state
      }
      
      if (field === 'city' && !value) {
        newErrors.city = 'City is required'
      } else if (field === 'city') {
        delete newErrors.city
      }
      
      setFormData(prev => ({
        ...prev,
        address: newAddress
      }))
    } else if (name.startsWith('organizer.')) {
      const field = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        organizer: { ...prev.organizer, [field]: value }
      }))
    } else if (name.startsWith('paymentConfig.')) {
      const parts = name.split('.')
      const gateway = parts[1]
      const field = parts[2]
      
      if (parts.length === 2) {
        // Just setting gateway
        setFormData(prev => ({
          ...prev,
          paymentConfig: { ...(prev.paymentConfig || {}), gateway: value }
        }))
        // Clear gateway error when user selects one
        if (value && ['razorpay', 'cashfree' /* , 'ccavenue' */].includes(value)) {
          delete newErrors.paymentGateway
        }
      } else {
        // Setting nested field like paymentConfig.cashfree.appId
        setFormData(prev => ({
          ...prev,
          paymentConfig: {
            ...(prev.paymentConfig || {}),
            [gateway]: { ...(prev.paymentConfig?.[gateway] || {}), [field]: value }
          }
        }))
        // Inline validation for payment fields (clear error when valid)
        if (gateway === 'razorpay') {
          if (field === 'keyId') value?.trim() ? delete newErrors.paymentRazorpayKeyId : (newErrors.paymentRazorpayKeyId = 'Key ID is required')
          if (field === 'keySecret') value?.trim() ? delete newErrors.paymentRazorpayKeySecret : (newErrors.paymentRazorpayKeySecret = 'Key Secret is required')
        } else if (gateway === 'cashfree') {
          if (field === 'appId') value?.trim() ? delete newErrors.paymentCashfreeAppId : (newErrors.paymentCashfreeAppId = 'App ID is required')
          if (field === 'secretKey') value?.trim() ? delete newErrors.paymentCashfreeSecretKey : (newErrors.paymentCashfreeSecretKey = 'Secret Key is required')
        } /* CCAvenue commented out
        else if (gateway === 'ccavenue') {
          if (field === 'merchantId') value?.trim() ? delete newErrors.paymentCcavenueMerchantId : (newErrors.paymentCcavenueMerchantId = 'Merchant ID is required')
          if (field === 'accessCode') value?.trim() ? delete newErrors.paymentCcavenueAccessCode : (newErrors.paymentCcavenueAccessCode = 'Access Code is required')
          if (field === 'workingKey') value?.trim() ? delete newErrors.paymentCcavenueWorkingKey : (newErrors.paymentCcavenueWorkingKey = 'Working Key is required')
        }
        */
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
      
      // Validate termsAndConditions inline
      if (name === 'termsAndConditions') {
        if (!value || !value.trim() || value === '<div><br></div>' || value === '<p><br></p>') {
          newErrors.termsAndConditions = 'Terms & Conditions are required'
        } else {
          delete newErrors.termsAndConditions
        }
      }
    }
    setErrors(newErrors)
  }

  // Handle numeric input only (for duration, price, quantity)
  const handleNumericInput = (e, field, index = null) => {
    const value = e.target.value
    // Allow only numbers and decimal point
    const numericValue = value.replace(/[^\d.]/g, '')
    
    if (index !== null) {
      // For array fields (ticketTypes)
      if (field.startsWith('ticketTypes.')) {
        const childField = field.split('.')[1]
        handleTicketTypeChange(index, childField, numericValue)
      }
    } else {
      // For direct fields
      setFormData(prev => ({ ...prev, [field]: numericValue }))
      if (field === 'duration') {
        const error = validateDuration(numericValue)
        setErrors(prev => ({
          ...prev,
          duration: error || undefined
        }))
      }
    }
  }

  const handleCategoryChange = (categoryId) => {
    const newCategories = formData.categories.includes(categoryId)
      ? formData.categories.filter(id => id !== categoryId)
      : [...formData.categories, categoryId]
    
    setFormData(prev => ({
      ...prev,
      categories: newCategories
    }))
    
    // Validate categories inline
    const newErrors = { ...errors }
    if (newCategories.length === 0) {
      newErrors.categories = 'At least one category is required'
    } else {
      delete newErrors.categories
    }
    setErrors(newErrors)
  }


  const handleSlotChange = (index, field, value) => {
    const newSlots = [...formData.slots]
    newSlots[index] = { ...newSlots[index], [field]: value }
    setFormData(prev => ({ ...prev, slots: newSlots }))
    
    // Validate date
    if (field === 'date') {
      const error = validateDate(value)
      setErrors(prev => ({
        ...prev,
        [`slot_${index}_date`]: error || undefined
      }))
    }
  }

  const addSlot = () => {
    setFormData(prev => ({
      ...prev,
      slots: [...prev.slots, { date: '', startTime: '', endTime: '', isActive: true }]
    }))
  }

  const removeSlot = (index) => {
    setFormData(prev => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index)
    }))
  }

  const handleTicketTypeChange = (index, field, value) => {
    const newTicketTypes = [...formData.ticketTypes]
    newTicketTypes[index] = { ...newTicketTypes[index], [field]: value }
    
    // Validate availableQuantity against totalQuantity
    if (field === 'availableQuantity') {
      const totalQty = parseInt(newTicketTypes[index].totalQuantity) || 0
      const availableQty = parseInt(value) || 0
      if (totalQty > 0 && availableQty > totalQty) {
        setErrors(prev => ({
          ...prev,
          [`ticket_${index}_availableQuantity`]: `Available quantity cannot exceed total quantity (${totalQty})`
        }))
      } else {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[`ticket_${index}_availableQuantity`]
          return newErrors
        })
      }
    }
    
    // If totalQuantity changes, update availableQuantity if it exceeds
    if (field === 'totalQuantity') {
      const totalQty = parseInt(value) || 0
      const currentAvailable = parseInt(newTicketTypes[index].availableQuantity) || 0
      if (currentAvailable > totalQty) {
        newTicketTypes[index].availableQuantity = totalQty > 0 ? totalQty.toString() : ''
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[`ticket_${index}_availableQuantity`]
          return newErrors
        })
      }
    }
    
    setFormData(prev => ({ ...prev, ticketTypes: newTicketTypes }))
  }

  const addTicketType = () => {
    setFormData(prev => ({
      ...prev,
      ticketTypes: [...prev.ticketTypes, { title: '', price: '', totalQuantity: '', availableQuantity: '', slotId: '', description: '' }]
    }))
  }

  const removeTicketType = (index) => {
    setFormData(prev => ({
      ...prev,
      ticketTypes: prev.ticketTypes.filter((_, i) => i !== index)
    }))
  }

  // Validate image dimensions (minimum 1600x900 for banners)
  const validateImageDimensions = (file, minWidth = 1600, minHeight = 900) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        if (img.width >= minWidth && img.height >= minHeight) {
          resolve(true)
        } else {
          reject(new Error(`Image dimensions must be at least ${minWidth}x${minHeight}px. Current dimensions: ${img.width}x${img.height}px`))
        }
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Failed to load image'))
      }
      
      img.src = objectUrl
    })
  }

  // Validate event detail image dimensions (portrait orientation - height > width)
  const validateEventDetailImageDimensions = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        // Check if image is portrait (height > width)
        if (img.height > img.width) {
          resolve(true)
        } else {
          reject(new Error(`Event detail image must be in portrait orientation (height > width). Current dimensions: ${img.width}x${img.height}px`))
        }
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Failed to load image'))
      }
      
      img.src = objectUrl
    })
  }

  const handleBannerFileChange = async (e) => {
    const files = Array.from(e.target.files)
    
    if (files.length === 0) return
    
    // Validate each banner image dimension
    const validFiles = []
    const invalidFiles = []
    
    for (const file of files) {
      try {
        await validateImageDimensions(file, 1600, 900)
        validFiles.push(file)
      } catch (error) {
        invalidFiles.push({ file, error: error.message })
      }
    }
    
    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ file, error }) => {
        toast.error(`${file.name}: ${error}`)
      })
    }
    
    // Only add valid files
    if (validFiles.length > 0) {
      const previews = validFiles.map(file => URL.createObjectURL(file))
      setNewBannerFiles(prev => [...prev, ...validFiles])
      setNewBannerPreviews(prev => [...prev, ...previews])
      // Clear banner error when files are added
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.banners
        return newErrors
      })
    }
  }

  const handleEventImageFileChange = (e) => {
    const files = Array.from(e.target.files)
    
    // Create preview URLs for new files
    const previews = files.map(file => URL.createObjectURL(file))
    
    setNewEventImageFiles(prev => [...prev, ...files])
    setNewEventImagePreviews(prev => [...prev, ...previews])
  }

  const handleEventDetailImageChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.')
      return
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }
    
    // Validate image dimensions (exactly 300x400px)
    try {
      await validateEventDetailImageDimensions(file)
      // Create preview URL
      const preview = URL.createObjectURL(file)
      setNewEventDetailImageFile(file)
      setNewEventDetailImagePreview(preview)
      
      // Clear error when file is added
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.eventDetailImage
        return newErrors
      })
    } catch (error) {
      toast.error(error.message)
      // Reset input to allow selecting the same file again
      e.target.value = ""
    }
  }

  const removeExistingEventDetailImage = () => {
    setExistingEventDetailImage(null)
  }

  const removeNewEventDetailImage = () => {
    if (newEventDetailImagePreview) {
      URL.revokeObjectURL(newEventDetailImagePreview)
    }
    setNewEventDetailImageFile(null)
    setNewEventDetailImagePreview(null)
  }

  const removeExistingBanner = (index) => {
    const newExistingBanners = existingBanners.filter((_, i) => i !== index)
    setExistingBanners(newExistingBanners)
    // Clear banner error if there are still banners remaining
    if (newExistingBanners.length > 0 || newBannerFiles.length > 0) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.banners
        return newErrors
      })
    }
  }

  const removeNewBanner = (index) => {
    // Revoke the object URL to free memory
    if (newBannerPreviews[index]) {
      URL.revokeObjectURL(newBannerPreviews[index])
    }
    
    const updatedBannerFiles = newBannerFiles.filter((_, i) => i !== index)
    const updatedBannerPreviews = newBannerPreviews.filter((_, i) => i !== index)
    setNewBannerFiles(updatedBannerFiles)
    setNewBannerPreviews(updatedBannerPreviews)
    // Clear banner error if there are still banners remaining
    if (existingBanners.length > 0 || updatedBannerFiles.length > 0) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.banners
        return newErrors
      })
    }
  }

  const removeExistingEventImage = (index) => {
    setExistingEventImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeNewEventImage = (index) => {
    // Revoke the object URL to free memory
    if (newEventImagePreviews[index]) {
      URL.revokeObjectURL(newEventImagePreviews[index])
    }
    
    setNewEventImageFiles(prev => prev.filter((_, i) => i !== index))
    setNewEventImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      newBannerPreviews.forEach(url => URL.revokeObjectURL(url))
      newEventImagePreviews.forEach(url => URL.revokeObjectURL(url))
      if (newEventDetailImagePreview) {
        URL.revokeObjectURL(newEventDetailImagePreview)
      }
    }
  }, [newBannerPreviews, newEventImagePreviews, newEventDetailImagePreview])

  // Sponsor management functions
  const handleAddSponsor = () => {
    setEditingSponsorId(null)
    setSponsorModalOpen(true)
  }

  const handleEditSponsor = (sponsorId) => {
    setEditingSponsorId(sponsorId)
    setSponsorModalOpen(true)
  }

  const handleSponsorModalSuccess = async (sponsorId) => {
    // Refresh sponsors list
    await fetchSponsors()
    
    // If we just created/updated a sponsor, add it to the event's sponsor list
    if (sponsorId) {
      setFormData(prev => {
        const sponsorIdStr = sponsorId?.toString() || sponsorId
        const existingIds = prev.sponsors.map(id => id?.toString() || id)
        
        if (!existingIds.includes(sponsorIdStr)) {
          // Add new sponsor to the event
          return {
            ...prev,
            sponsors: [...prev.sponsors, sponsorId]
          }
        }
        return prev
      })
    }
    
    // Close modal
    setSponsorModalOpen(false)
    setEditingSponsorId(null)
  }

  const handleRemoveSponsor = (sponsorId) => {
    setFormData(prev => ({
      ...prev,
      sponsors: prev.sponsors.filter(id => id !== sponsorId)
    }))
  }

  // Tab-specific validation functions
  const validateBasicInfoTab = () => {
    const newErrors = {}
    
    // Validate title
    if (!formData.title || !formData.title.trim()) {
      newErrors.title = 'Event title is required'
    }
    
    // Validate description
    if (!formData.description || !formData.description.trim() || 
        formData.description === '<div><br></div>' || 
        formData.description === '<p><br></p>') {
      newErrors.description = 'Description is required'
    }
    
    // Validate categories
    if (!formData.categories || formData.categories.length === 0) {
      newErrors.categories = 'At least one category is required'
    }
    
    // Validate duration
    const durationError = validateDuration(formData.duration)
    if (durationError) newErrors.duration = durationError
    
    // Validate address fields
    if (!formData.address.fullAddress || !formData.address.fullAddress.trim()) {
      newErrors.fullAddress = 'Full address is required'
    }
    if (!formData.address.state) newErrors.state = 'State is required'
    if (!formData.address.city) newErrors.city = 'City is required'
    const pincodeError = validatePincode(formData.address.pincode)
    if (pincodeError) newErrors.pincode = pincodeError
    
    // Validate event detail image is required
    const hasExistingImage = isEditMode && existingEventDetailImage && existingEventDetailImage !== null && existingEventDetailImage !== ''
    const hasNewImage = newEventDetailImageFile !== null && newEventDetailImageFile !== undefined
    if (!hasExistingImage && !hasNewImage) {
      newErrors.eventDetailImage = 'Event detail image is required'
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const validateSlotsTab = () => {
    const newErrors = {}
    
    // Validate slots
    if (!formData.slots || formData.slots.length === 0) {
      newErrors.slots = 'At least one slot is required'
    } else {
      formData.slots.forEach((slot, index) => {
        const dateError = validateDate(slot.date)
        if (dateError) newErrors[`slot_${index}_date`] = dateError
        if (!slot.startTime) {
          newErrors[`slot_${index}_startTime`] = 'Start time is required'
        }
        if (!slot.endTime) {
          newErrors[`slot_${index}_endTime`] = 'End time is required'
        }
      })
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const validateTicketsTab = () => {
    const newErrors = {}
    
    // Validate ticket types
    if (!formData.ticketTypes || formData.ticketTypes.length === 0) {
      newErrors.ticketTypes = 'At least one ticket type is required'
    } else {
      formData.ticketTypes.forEach((ticket, index) => {
        if (!ticket.title || !ticket.title.trim()) {
          newErrors[`ticket_${index}_title`] = 'Ticket title is required'
        }
        if (!ticket.price || parseFloat(ticket.price) <= 0) {
          newErrors[`ticket_${index}_price`] = 'Ticket price is required and must be greater than 0'
        }
        if (!ticket.totalQuantity || parseInt(ticket.totalQuantity) <= 0) {
          newErrors[`ticket_${index}_totalQuantity`] = 'Total quantity is required and must be greater than 0'
        }
        const totalQty = parseInt(ticket.totalQuantity) || 0
        const availableQty = parseInt(ticket.availableQuantity) || 0
        if (totalQty > 0 && availableQty > totalQty) {
          newErrors[`ticket_${index}_availableQuantity`] = `Available quantity cannot exceed total quantity (${totalQty})`
        }
        if (!ticket.availableQuantity && totalQty > 0) {
          newErrors[`ticket_${index}_availableQuantity`] = 'Available quantity is required'
        }
      })
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const validateSponsorsTab = () => {
    const newErrors = {}
    
    // Validate termsAndConditions
    if (!formData.termsAndConditions || !formData.termsAndConditions.trim() || 
        formData.termsAndConditions === '<div><br></div>' || 
        formData.termsAndConditions === '<p><br></p>') {
      newErrors.termsAndConditions = 'Terms & Conditions are required'
    }
    
    // Validate notes
    if (!formData.notes || !formData.notes.trim()) {
      newErrors.notes = 'Notes are required'
    }
    
    // No need to validate sponsor form since it's now in a modal
    
    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const validatePaymentTab = () => {
    const gateways = ['razorpay', 'cashfree' /* , 'ccavenue' */]
    const gateway = formData.paymentConfig?.gateway
    const newErrors = { ...errors }

    // Clear previous payment-related errors
    ;['paymentGateway', 'paymentRazorpayKeyId', 'paymentRazorpayKeySecret', 'paymentCashfreeAppId', 'paymentCashfreeSecretKey', 'paymentCcavenueMerchantId', 'paymentCcavenueAccessCode', 'paymentCcavenueWorkingKey'].forEach(k => delete newErrors[k])

    let isValid = true

    if (!gateway || !gateways.includes(gateway)) {
      newErrors.paymentGateway = 'Please select one payment gateway'
      isValid = false
    }

    if (gateway === 'razorpay') {
      if (!formData.paymentConfig?.razorpay?.keyId?.trim()) {
        newErrors.paymentRazorpayKeyId = 'Key ID is required'
        isValid = false
      }
      if (!formData.paymentConfig?.razorpay?.keySecret?.trim()) {
        newErrors.paymentRazorpayKeySecret = 'Key Secret is required'
        isValid = false
      }
    } else if (gateway === 'cashfree') {
      if (!formData.paymentConfig?.cashfree?.appId?.trim()) {
        newErrors.paymentCashfreeAppId = 'App ID is required'
        isValid = false
      }
      if (!formData.paymentConfig?.cashfree?.secretKey?.trim()) {
        newErrors.paymentCashfreeSecretKey = 'Secret Key is required'
        isValid = false
      }
    }
    /* CCAvenue commented out
    } else if (gateway === 'ccavenue') {
      if (!formData.paymentConfig?.ccavenue?.merchantId?.trim()) {
        newErrors.paymentCcavenueMerchantId = 'Merchant ID is required'
        isValid = false
      }
      if (!formData.paymentConfig?.ccavenue?.accessCode?.trim()) {
        newErrors.paymentCcavenueAccessCode = 'Access Code is required'
        isValid = false
      }
      if (!formData.paymentConfig?.ccavenue?.workingKey?.trim()) {
        newErrors.paymentCcavenueWorkingKey = 'Working Key is required'
        isValid = false
      }
    }
    */

    setErrors(prev => ({ ...prev, ...newErrors }))
    return isValid
  }

  const validateForm = () => {
    const basicValid = validateBasicInfoTab()
    const slotsValid = validateSlotsTab()
    const ticketsValid = validateTicketsTab()
    const sponsorsValid = validateSponsorsTab()
    const paymentValid = validatePaymentTab()
    
    return basicValid && slotsValid && ticketsValid && sponsorsValid && paymentValid
  }

  // Tab navigation handlers
  const handleTabChange = (targetTab) => {
    // Allow navigation backward without validation
    const tabOrder = ['basic', 'slots', 'tickets', 'sponsors', 'payment']
    const currentIndex = tabOrder.indexOf(activeTab)
    const targetIndex = tabOrder.indexOf(targetTab)
    
    // If navigating forward, validate current tab first
    if (targetIndex > currentIndex) {
      let isValid = false
      let errorMessage = ''
      
      switch (activeTab) {
        case 'basic':
          isValid = validateBasicInfoTab()
          errorMessage = 'Please fill all required fields in Basic Information tab'
          break
        case 'slots':
          isValid = validateSlotsTab()
          errorMessage = 'Please fill all required fields in Event Slots tab'
          break
        case 'tickets':
          isValid = validateTicketsTab()
          errorMessage = 'Please fill all required fields in Tickets tab'
          break
        default:
          isValid = true
          break
      }
      
      if (isValid) {
        setActiveTab(targetTab)
      } else {
        toast.error(errorMessage)
      }
    } else {
      // Navigating backward - allow without validation
      setActiveTab(targetTab)
    }
  }

  const handleNextTab = () => {
    let isValid = false
    let nextTab = ''
    let errorMessage = ''
    
    switch (activeTab) {
      case 'basic':
        isValid = validateBasicInfoTab()
        nextTab = 'slots'
        errorMessage = 'Please fill all required fields in Basic Information tab'
        break
      case 'slots':
        isValid = validateSlotsTab()
        nextTab = 'tickets'
        errorMessage = 'Please fill all required fields in Event Slots tab'
        break
      case 'tickets':
        isValid = validateTicketsTab()
        nextTab = 'sponsors'
        errorMessage = 'Please fill all required fields in Tickets tab'
        break
      case 'sponsors':
        isValid = validateSponsorsTab()
        nextTab = 'payment'
        errorMessage = 'Please fill all required fields in Sponsors tab'
        break
      default:
        return
    }
    
    if (isValid) {
      setActiveTab(nextTab)
    } else {
      toast.error(errorMessage)
    }
  }

  const handlePreviousTab = () => {
    switch (activeTab) {
      case 'slots':
        setActiveTab('basic')
        break
      case 'tickets':
        setActiveTab('slots')
        break
      case 'sponsors':
        setActiveTab('tickets')
        break
      case 'payment':
        setActiveTab('sponsors')
        break
      default:
        break
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form before submission
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting')
      return
    }

    // No need to validate sponsor form since it's now in a modal
    
    setLoading(true)

    try {
      // Build finalSponsorIds from formData.sponsors
      // All sponsors should already be created/updated through the modal
      const finalSponsorIds = [...formData.sponsors]
      
      // Note: Sponsors are now created/updated through the SponsorFormModal
      // All sponsors in formData.sponsors should already exist in the database

      // Now submit the event with final sponsor IDs
      const submitData = new FormData()
      
          submitData.append('title', formData.title)
          submitData.append('description', formData.description)
          submitData.append('categories', JSON.stringify(formData.categories))
          submitData.append('sponsors', JSON.stringify(finalSponsorIds.filter(id => !id.toString().startsWith('temp_'))))
          submitData.append('duration', formData.duration)
      submitData.append('address', JSON.stringify(formData.address))
      
      // Organizer - only send name and contactInfo, not organizerId (backend sets it from req.user)
      // Prefer email over mobile for contactInfo
      const contactInfo = formData.organizer.email || formData.organizer.mobile || formData.organizer.contactInfo
      submitData.append('organizer', JSON.stringify({
        name: formData.organizer.name,
        contactInfo: contactInfo
      }))
      
      submitData.append('termsAndConditions', formData.termsAndConditions)
      if (formData.notes) submitData.append('notes', formData.notes)
      
      // Payment Config
      submitData.append('paymentConfig', JSON.stringify(formData.paymentConfig))
      
      // Slots - format properly for backend
      submitData.append('slots', JSON.stringify(formData.slots.map(slot => ({
        date: new Date(slot.date).toISOString(),
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: slot.isActive !== undefined ? slot.isActive : true
      }))))
      
      // Ticket Types - format properly, preserve availableQuantity for existing tickets
      submitData.append('ticketTypes', JSON.stringify(formData.ticketTypes.map(tt => ({
        title: tt.title,
        price: parseFloat(tt.price),
        totalQuantity: parseInt(tt.totalQuantity),
        availableQuantity: tt.availableQuantity 
          ? parseInt(tt.availableQuantity) 
          : parseInt(tt.totalQuantity),
        description: tt.description || '',
        isActive: tt.isActive !== undefined ? tt.isActive : true
      }))))

      // Append new banner files
      newBannerFiles.forEach((file) => {
        submitData.append('banners', file)
      })
      
      // Append existing banners as JSON string (if any, for edit mode)
      if (isEditMode && existingBanners.length > 0) {
        submitData.append('existingBanners', JSON.stringify(existingBanners))
      }
      
      // Append new event image files
      newEventImageFiles.forEach((file) => {
        submitData.append('eventImages', file)
      })
      
      // Append existing event images as JSON string (if any, for edit mode)
      if (isEditMode && existingEventImages.length > 0) {
        submitData.append('existingEventImages', JSON.stringify(existingEventImages))
      }

      // Append event detail image file (single file)
      if (newEventDetailImageFile) {
        submitData.append('eventDetailImage', newEventDetailImageFile)
      }
      
      // Append existing event detail image as JSON string (if any, for edit mode)
      if (isEditMode && existingEventDetailImage && !newEventDetailImageFile) {
        submitData.append('existingEventDetailImage', existingEventDetailImage)
      }

      const response = isEditMode
        ? await api.put(`/organizer/events/${eventId}`, submitData)
        : await api.post('/organizer/events', submitData)
      
      if (response.data.status === 200 || response.data.status === 201) {
        // Refresh sponsors list to include newly created sponsors
        await fetchSponsors()
        
        // Reset sponsor modal state
        setSponsorModalOpen(false)
        setEditingSponsorId(null)
        
        toast.success(isEditMode ? 'Event updated successfully!' : 'Event created successfully! Waiting for admin approval.')
        navigate('/events')
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} event:`, error)
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${isEditMode ? 'update' : 'create'} event`
      toast.error(errorMessage, 'Error')
    } finally {
      setLoading(false)
    }
  }

  // Check if all tabs are validated (without setting errors)
  const areAllTabsValid = () => {
    // Check basic info
    let basicValid = true
    if (!formData.title || !formData.title.trim()) basicValid = false
    if (!formData.description || !formData.description.trim() || 
        formData.description === '<div><br></div>' || 
        formData.description === '<p><br></p>') basicValid = false
    if (!formData.categories || formData.categories.length === 0) basicValid = false
    if (validateDuration(formData.duration)) basicValid = false
    if (!formData.address.fullAddress || !formData.address.fullAddress.trim()) basicValid = false
    if (!formData.address.state) basicValid = false
    if (!formData.address.city) basicValid = false
    if (validatePincode(formData.address.pincode)) basicValid = false
    const hasExistingImage = isEditMode && existingEventDetailImage && existingEventDetailImage !== null && existingEventDetailImage !== ''
    const hasNewImage = newEventDetailImageFile !== null && newEventDetailImageFile !== undefined
    if (!hasExistingImage && !hasNewImage) basicValid = false
    
    // Check slots
    let slotsValid = true
    if (!formData.slots || formData.slots.length === 0) {
      slotsValid = false
    } else {
      for (const slot of formData.slots) {
        if (validateDate(slot.date) || !slot.startTime || !slot.endTime) {
          slotsValid = false
          break
        }
      }
    }
    
    // Check tickets
    let ticketsValid = true
    if (!formData.ticketTypes || formData.ticketTypes.length === 0) {
      ticketsValid = false
    } else {
      for (const ticket of formData.ticketTypes) {
        if (!ticket.title || !ticket.title.trim()) {
          ticketsValid = false
          break
        }
        if (!ticket.price || parseFloat(ticket.price) <= 0) {
          ticketsValid = false
          break
        }
        if (!ticket.totalQuantity || parseInt(ticket.totalQuantity) <= 0) {
          ticketsValid = false
          break
        }
        const totalQty = parseInt(ticket.totalQuantity) || 0
        const availableQty = parseInt(ticket.availableQuantity) || 0
        if (totalQty > 0 && availableQty > totalQty) {
          ticketsValid = false
          break
        }
        if (!ticket.availableQuantity && totalQty > 0) {
          ticketsValid = false
          break
        }
      }
    }
    
    // Check sponsors tab
    let sponsorsValid = true
    if (!formData.termsAndConditions || !formData.termsAndConditions.trim() || 
        formData.termsAndConditions === '<div><br></div>' || 
        formData.termsAndConditions === '<p><br></p>') {
      sponsorsValid = false
    }
    if (!formData.notes || !formData.notes.trim()) {
      sponsorsValid = false
    }
    // No need to validate sponsor form since it's now in a modal
    
    // Check payment config (require one gateway and its fields)
    let paymentValid = true
    const gw = formData.paymentConfig?.gateway
    if (!gw || !['razorpay', 'cashfree' /* , 'ccavenue' */].includes(gw)) {
      paymentValid = false
    } else if (gw === 'razorpay') {
      if (!formData.paymentConfig?.razorpay?.keyId?.trim() || !formData.paymentConfig?.razorpay?.keySecret?.trim()) paymentValid = false
    } else if (gw === 'cashfree') {
      if (!formData.paymentConfig?.cashfree?.appId?.trim() || !formData.paymentConfig?.cashfree?.secretKey?.trim()) paymentValid = false
    } /* CCAvenue commented out
    else if (gw === 'ccavenue') {
      if (!formData.paymentConfig?.ccavenue?.merchantId?.trim() || !formData.paymentConfig?.ccavenue?.accessCode?.trim() || !formData.paymentConfig?.ccavenue?.workingKey?.trim()) paymentValid = false
    }
    */
    
    return basicValid && slotsValid && ticketsValid && sponsorsValid && paymentValid
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/events')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Back to Events"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Event' : 'Create New Event'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEditMode ? 'Update your event details' : 'Fill in the details to create a new event'}
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {fetching ? (
          <div className="p-12">
            <Loading text="Loading event details..." />
          </div>
        ) : (
          <form id="event-form" onSubmit={handleSubmit} className="space-y-0 flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-white">
            <div className="px-6">
              <nav className="flex space-x-1" aria-label="Tabs">
                <button
                  type="button"
                  onClick={() => handleTabChange('basic')}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'basic'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Info className="w-4 h-4" />
                  Basic Information
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('slots')}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'slots'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Event Slots
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('tickets')}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'tickets'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  Tickets
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('sponsors')}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'sponsors'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Sponsors & Organization
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange('payment')}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'payment'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  Payment Config
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="px-6 py-6">
            {/* Basic Information Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6 pb-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title *
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
                Description *
              </label>
              <RichTextEditor
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter event description..."
                rows={4}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categories *
              </label>
              <div className={`grid grid-cols-4 gap-2 mt-2 ${errors.categories ? 'border border-red-500 rounded-lg p-3' : ''}`}>
                {categories.map((cat) => (
                  <label key={cat._id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.categories.includes(cat._id)}
                      onChange={() => handleCategoryChange(cat._id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{cat.name}</span>
                  </label>
                ))}
              </div>
              {errors.categories && (
                <p className="text-red-500 text-xs mt-1">{errors.categories}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (hours) *
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={(e) => handleNumericInput(e, 'duration')}
                placeholder="1-24 hours"
                className={`input-field ${errors.duration ? 'border-red-500' : ''}`}
                required
              />
              {errors.duration && (
                <p className="text-red-500 text-xs mt-1">{errors.duration}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Location</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Address *
              </label>
              <textarea
                name="address.fullAddress"
                value={formData.address.fullAddress}
                onChange={handleInputChange}
                rows={2}
                className={`input-field ${errors.fullAddress ? 'border-red-500' : ''}`}
                required
              />
              {errors.fullAddress && (
                <p className="text-red-500 text-xs mt-1">{errors.fullAddress}</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
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
                  placeholder="Select State"
                  searchable={true}
                  className={errors.state ? 'border-red-500' : ''}
                />
                {errors.state && (
                  <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <CustomDropdown
                  value={formData.address.city}
                  onChange={(value) => handleInputChange({ target: { name: 'address.city', value } })}
                  options={[{ value: '', label: 'Select City' }, ...getCities(formData.address.state)]}
                  placeholder="Select City"
                  searchable={true}
                  disabled={!formData.address.state}
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && (
                  <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                )}
                {!formData.address.state && (
                  <p className="text-gray-500 text-xs mt-1">Please select a state first</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  name="address.pincode"
                  value={formData.address.pincode}
                  onChange={handleInputChange}
                  placeholder="6 digits"
                  maxLength={6}
                  className={`input-field ${errors.pincode ? 'border-red-500' : ''}`}
                  required
                />
                {errors.pincode && (
                  <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>
                )}
              </div>
            </div>

            {/* Event Detail Image - Single Row */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Detail Image * (Single Image - Portrait Orientation)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEventDetailImageChange}
                  className={`input-field ${errors.eventDetailImage ? 'border-red-500' : ''}`}
                  required={!isEditMode || (!existingEventDetailImage && !newEventDetailImageFile)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a single portrait image (height &gt; width) - PNG, JPG, GIF, WEBP (MAX. 10MB)
                </p>
                {errors.eventDetailImage && (
                  <p className="text-red-500 text-xs mt-1">{errors.eventDetailImage}</p>
                )}
              </div>

              {/* Existing Event Detail Image Preview (Edit Mode) */}
              {isEditMode && existingEventDetailImage && !newEventDetailImagePreview && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Event Detail Image
                  </label>
                  <div className="relative group inline-block">
                    {imageErrors.has('eventDetailImage') ? (
                      <div className="w-full h-64 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg border border-gray-200 flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-primary-600" />
                      </div>
                    ) : (
                      <img
                        src={existingEventDetailImage.startsWith('http') 
                          ? existingEventDetailImage 
                          : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${existingEventDetailImage}`}
                        alt="Existing event detail image"
                        className="w-full h-64 object-contain rounded-lg border border-gray-200"
                        onError={() => setImageErrors(prev => new Set([...prev, 'eventDetailImage']))}
                      />
                    )}
                    <button
                      type="button"
                      onClick={removeExistingEventDetailImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 rounded-b-lg">
                      Current
                    </div>
                  </div>
                </div>
              )}

              {/* New Event Detail Image Preview */}
              {newEventDetailImagePreview && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Event Detail Image
                  </label>
                  <div className="relative group inline-block w-full">
                    {imageErrors.has('newEventDetailImage') ? (
                      <div className="w-full h-64 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg border border-gray-200 flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-primary-600" />
                      </div>
                    ) : (
                      <img
                        src={newEventDetailImagePreview}
                        alt="New event detail image"
                        className="w-full h-64 object-contain rounded-lg border border-gray-200"
                        onError={() => setImageErrors(prev => new Set([...prev, 'newEventDetailImage']))}
                      />
                    )}
                    <button
                      type="button"
                      onClick={removeNewEventDetailImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-green-600/50 text-white text-xs px-2 py-1 rounded-b-lg">
                      New
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Banner Images */}
            <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banner Images (Optional - Minimum 1600x900px)
                  </label>
                  <input
                    ref={bannerFileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleBannerFileChange}
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {isEditMode ? 'You can upload additional images' : 'You can upload multiple images'} - Minimum size: 1600x900 pixels (larger images allowed)
                  </p>
                  {errors.banners && (
                    <p className="text-red-500 text-xs mt-1">{errors.banners}</p>
                  )}
                </div>

                {/* Existing Banners Preview (Edit Mode) */}
                {isEditMode && existingBanners.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Existing Banner Images
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {existingBanners.map((banner, index) => {
                        const imageUrl = banner.startsWith('http') 
                          ? banner 
                          : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${banner}`
                        return (
                          <div key={index} className="relative group">
                            {imageErrors.has(`banner_${index}`) ? (
                              <div className="w-full h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg border border-gray-200 flex items-center justify-center">
                                <ImageIcon className="w-6 h-6 text-primary-600" />
                              </div>
                            ) : (
                              <img
                                src={imageUrl}
                                alt={`Existing banner ${index + 1}`}
                                className="w-full h-20 object-cover rounded-lg border border-gray-200"
                                onError={() => setImageErrors(prev => new Set([...prev, `banner_${index}`]))}
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => removeExistingBanner(index)}
                              className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Remove image"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* New Banners Preview */}
                {newBannerPreviews.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Banner Images
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {newBannerPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          {imageErrors.has(`newBanner_${index}`) ? (
                            <div className="w-full h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg border border-gray-200 flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-primary-600" />
                            </div>
                          ) : (
                            <img
                              src={preview}
                              alt={`New banner ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg border border-gray-200"
                              onError={() => setImageErrors(prev => new Set([...prev, `newBanner_${index}`]))}
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => removeNewBanner(index)}
                            className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-green-600/50 text-white text-xs px-1 py-0.5 rounded-b-lg">
                            New
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add More Banner Images Button */}
                {(existingBanners.length > 0 || newBannerPreviews.length > 0) && (
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    className="btn-secondary text-xs inline-flex items-center gap-1 w-full"
                  >
                    <Plus className="w-3 h-3" />
                    Add More Banner Images
                  </button>
                )}
            </div>
                </div>
              </div>
            </div>
            )}

            {/* Event Slots Tab */}
            {activeTab === 'slots' && (
              <div className="space-y-6 pb-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Event Slots *</h3>
              <button
                type="button"
                onClick={addSlot}
                className="btn-secondary text-sm inline-flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Slot
              </button>
            </div>

            {formData.slots.map((slot, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Slot {index + 1}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slot.isActive !== undefined ? slot.isActive : true}
                        onChange={(e) => handleSlotChange(index, 'isActive', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-xs font-medium">
                        {slot.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                    {formData.slots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSlot(index)}
                        className="text-red-600 hover:text-red-700"
                        title="Remove slot"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={slot.date}
                      onChange={(e) => handleSlotChange(index, 'date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={`input-field ${errors[`slot_${index}_date`] ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors[`slot_${index}_date`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`slot_${index}_date`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Time *</label>
                    <input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleSlotChange(index, 'startTime', e.target.value)}
                      className={`input-field ${errors[`slot_${index}_startTime`] ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors[`slot_${index}_startTime`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`slot_${index}_startTime`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">End Time *</label>
                    <input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) => handleSlotChange(index, 'endTime', e.target.value)}
                      className={`input-field ${errors[`slot_${index}_endTime`] ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors[`slot_${index}_endTime`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`slot_${index}_endTime`]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {errors.slots && (
              <p className="text-red-500 text-xs mt-1">{errors.slots}</p>
            )}
                </div>
              </div>
            )}

            {/* Tickets Tab */}
            {activeTab === 'tickets' && (
              <div className="space-y-6 pb-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Ticket Types *</h3>
              <button
                type="button"
                onClick={addTicketType}
                className="btn-secondary text-sm inline-flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Ticket Type
              </button>
            </div>

            {formData.ticketTypes.map((ticket, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Ticket Type {index + 1}</span>
                  {formData.ticketTypes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTicketType(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={ticket.title}
                      onChange={(e) => handleTicketTypeChange(index, 'title', e.target.value)}
                      className={`input-field ${errors[`ticket_${index}_title`] ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors[`ticket_${index}_title`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`ticket_${index}_title`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price (₹) *</label>
                    <input
                      type="text"
                      value={ticket.price}
                      onChange={(e) => handleNumericInput(e, 'ticketTypes.price', index)}
                      placeholder="0.00"
                      className={`input-field ${errors[`ticket_${index}_price`] ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors[`ticket_${index}_price`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`ticket_${index}_price`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="text"
                      value={ticket.totalQuantity}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^\d]/g, '')
                        handleTicketTypeChange(index, 'totalQuantity', numericValue)
                        // Update availableQuantity if it exceeds new totalQuantity
                        const newTotal = parseInt(numericValue) || 0
                        const currentAvailable = parseInt(ticket.availableQuantity) || 0
                        if (currentAvailable > newTotal && newTotal > 0) {
                          handleTicketTypeChange(index, 'availableQuantity', newTotal.toString())
                        }
                      }}
                      placeholder="1"
                      className={`input-field ${errors[`ticket_${index}_totalQuantity`] ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors[`ticket_${index}_totalQuantity`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`ticket_${index}_totalQuantity`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Available *</label>
                    <input
                      type="text"
                      value={ticket.availableQuantity || ''}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^\d]/g, '')
                        handleTicketTypeChange(index, 'availableQuantity', numericValue)
                      }}
                      placeholder="0"
                      className={`input-field ${errors[`ticket_${index}_availableQuantity`] ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors[`ticket_${index}_availableQuantity`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`ticket_${index}_availableQuantity`]}</p>
                    )}
                    {ticket.totalQuantity && (
                      <p className="text-xs text-gray-500 mt-1">Max: {ticket.totalQuantity}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <RichTextEditor
                    name={`ticketTypes.${index}.description`}
                    value={ticket.description || ''}
                    onChange={(e) => {
                      handleTicketTypeChange(index, 'description', e.target.value)
                    }}
                    placeholder="Enter ticket description..."
                    rows={2}
                  />
                </div>
              </div>
            ))}
            {errors.ticketTypes && (
              <p className="text-red-500 text-xs mt-1">{errors.ticketTypes}</p>
            )}
                </div>
              </div>
            )}

            {/* Sponsors & Organization Tab */}
            {activeTab === 'sponsors' && (
              <div className="space-y-6 pb-6">
                {/* Sponsors Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Sponsors</h3>
                    <button
                      type="button"
                      onClick={handleAddSponsor}
                      className="btn-secondary text-sm inline-flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Sponsor
                    </button>
                  </div>

                  {/* Selected Sponsors List */}
                  {formData.sponsors.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {formData.sponsors.map((sponsorId) => {
                        // Find sponsor by comparing IDs as strings to handle type mismatches
                        const sponsorIdStr = sponsorId?.toString() || sponsorId
                        const sponsor = sponsors.find(s => {
                          const sId = s._id?.toString() || s._id
                          return sId === sponsorIdStr
                        })
                        
                        if (!sponsor) {
                          // Show loading state if sponsor not found yet (might be loading)
                          return (
                            <div
                              key={sponsorId}
                              className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
                                <div className="flex-1">
                                  <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        
                        // Use fetched sponsor data
                        const sponsorName = sponsor?.name
                        const sponsorType = sponsor?.type
                        const sponsorLogo = sponsor?.logo && sponsor.logo.startsWith('http') 
                          ? sponsor.logo 
                          : sponsor?.logo 
                            ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${sponsor.logo}`
                            : null
                        return (
                          <div
                            key={sponsorId}
                            className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              {sponsorLogo && (
                                <img
                                  src={sponsorLogo}
                                  alt={sponsorName}
                                  className="w-10 h-10 object-contain rounded"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                  }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{sponsorName}</p>
                                <p className="text-xs text-gray-500">{sponsorType}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditSponsor(sponsorId)}
                                className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Edit sponsor"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveSponsor(sponsorId)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove sponsor"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                </div>

                {/* Organizer Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Organizer Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organizer Name *
                </label>
                <input
                  type="text"
                  name="organizer.name"
                  value={formData.organizer.name}
                  readOnly
                  className="input-field bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div>
                {/* <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Info *
                </label> */}
                <div className="grid grid-cols-2 gap-2">
                  {formData.organizer.email && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.organizer.email}
                        readOnly
                        className="input-field bg-gray-50 cursor-not-allowed"
                      />
                    </div>
                  )}
                  {formData.organizer.mobile && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Mobile</label>
                      <input
                        type="text"
                        value={formData.organizer.mobile}
                        readOnly
                        className="input-field bg-gray-50 cursor-not-allowed"
                      />
                    </div>
                  )}
                  {!formData.organizer.email && !formData.organizer.mobile && (
                    <p className="text-sm text-gray-500 col-span-2">No contact information available</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.organizer.email 
                    ? `Will send: ${formData.organizer.email}` 
                    : formData.organizer.mobile 
                      ? `Will send: ${formData.organizer.mobile}`
                      : 'No contact info to send'}
                </p>
              </div>
            </div>
                </div>

                {/* Terms & Conditions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terms & Conditions *
                  </label>
                  <RichTextEditor
                    name="termsAndConditions"
                    value={formData.termsAndConditions}
                    onChange={handleInputChange}
                    placeholder="Enter terms and conditions..."
                    rows={4}
                    className={errors.termsAndConditions ? 'border-red-500' : ''}
                  />
                  {errors.termsAndConditions && (
                    <p className="text-red-500 text-xs mt-1">{errors.termsAndConditions}</p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes *
                  </label>
                  <RichTextEditor
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Enter notes..."
                    rows={3}
                    className={errors.notes ? 'border-red-500' : ''}
                  />
                  {errors.notes && (
                    <p className="text-red-500 text-xs mt-1">{errors.notes}</p>
                  )}
                </div>

                {/* Event Images */}
                <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Images (Optional)
              </label>
              <input
                ref={eventImageFileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleEventImageFileChange}
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can upload multiple event images
              </p>
            </div>

            {/* Existing Event Images Preview (Edit Mode) */}
            {isEditMode && existingEventImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Existing Event Images
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingEventImages.map((image, index) => {
                    const imageUrl = image.startsWith('http') 
                      ? image 
                      : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${image}`
                    return (
                      <div key={index} className="relative group">
                        {imageErrors.has(`eventImage_${index}`) ? (
                          <div className="w-full h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg border border-gray-200 flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-primary-600" />
                          </div>
                        ) : (
                          <img
                            src={imageUrl}
                            alt={`Existing event image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                            onError={() => setImageErrors(prev => new Set([...prev, `eventImage_${index}`]))}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeExistingEventImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1 rounded-b-lg">
                          Existing
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* New Event Images Preview */}
            {newEventImagePreviews.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Event Images
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {newEventImagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      {imageErrors.has(`newEventImage_${index}`) ? (
                        <div className="w-full h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg border border-gray-200 flex items-center justify-center">
                          <Image className="w-8 h-8 text-primary-600" />
                        </div>
                      ) : (
                        <img
                          src={preview}
                          alt={`New event image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          onError={() => setImageErrors(prev => new Set([...prev, `newEventImage_${index}`]))}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeNewEventImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-green-600/50 text-white text-xs px-2 py-1 rounded-b-lg">
                        New
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add More Event Images Button */}
            {(existingEventImages.length > 0 || newEventImagePreviews.length > 0) && (
              <button
                type="button"
                onClick={() => eventImageFileInputRef.current?.click()}
                className="btn-secondary text-sm inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add More Event Images
              </button>
            )}
            </div>
          </div>
        )}

          {/* Payment Config Tab */}
          {activeTab === 'payment' && (
            <div className="space-y-6 pb-6">
              <h3 className="text-lg font-semibold text-gray-900">Payment Gateway Configuration</h3>
              <p className="text-sm text-gray-500">Select one payment gateway and provide the required credentials for this event.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Payment Gateway <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {/* CCAvenue commented out: add 'ccavenue' to array to enable */}
                    {['razorpay', 'cashfree' /* , 'ccavenue' */].map((gateway) => (
                      <label 
                        key={gateway}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.paymentConfig?.gateway === gateway 
                            ? 'border-primary-500 bg-primary-50 text-primary-700' 
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        } ${errors.paymentGateway ? 'border-red-300' : ''}`}
                      >
                        <input
                          type="radio"
                          name="paymentConfig.gateway"
                          value={gateway}
                          checked={formData.paymentConfig?.gateway === gateway}
                          onChange={handleInputChange}
                          className="hidden"
                        />
                        <span className="capitalize font-medium">{gateway}</span>
                      </label>
                    ))}
                  </div>
                  {errors.paymentGateway && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.paymentGateway}</p>
                  )}
                </div>

                {formData.paymentConfig?.gateway === 'razorpay' && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                    <h4 className="font-medium text-gray-900 border-b pb-2">Razorpay Credentials <span className="text-red-500">*</span></h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Key ID <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="paymentConfig.razorpay.keyId"
                          value={formData.paymentConfig?.razorpay?.keyId || ''}
                          onChange={handleInputChange}
                          className={`input-field ${errors.paymentRazorpayKeyId ? 'border-red-500 focus:ring-red-500' : ''}`}
                          placeholder="rzp_live_xxx or rzp_test_xxx"
                        />
                        {errors.paymentRazorpayKeyId && (
                          <p className="mt-1 text-sm text-red-600">{errors.paymentRazorpayKeyId}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Key Secret <span className="text-red-500">*</span></label>
                        <input
                          type="password"
                          name="paymentConfig.razorpay.keySecret"
                          value={formData.paymentConfig?.razorpay?.keySecret || ''}
                          onChange={handleInputChange}
                          className={`input-field ${errors.paymentRazorpayKeySecret ? 'border-red-500 focus:ring-red-500' : ''}`}
                          placeholder="Your Razorpay secret key"
                        />
                        {errors.paymentRazorpayKeySecret && (
                          <p className="mt-1 text-sm text-red-600">{errors.paymentRazorpayKeySecret}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {formData.paymentConfig?.gateway === 'cashfree' && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                    <h4 className="font-medium text-gray-900 border-b pb-2">Cashfree Credentials <span className="text-red-500">*</span></h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">App ID <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="paymentConfig.cashfree.appId"
                          value={formData.paymentConfig?.cashfree?.appId || ''}
                          onChange={handleInputChange}
                          className={`input-field ${errors.paymentCashfreeAppId ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.paymentCashfreeAppId && (
                          <p className="mt-1 text-sm text-red-600">{errors.paymentCashfreeAppId}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key <span className="text-red-500">*</span></label>
                        <input
                          type="password"
                          name="paymentConfig.cashfree.secretKey"
                          value={formData.paymentConfig?.cashfree?.secretKey || ''}
                          onChange={handleInputChange}
                          className={`input-field ${errors.paymentCashfreeSecretKey ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.paymentCashfreeSecretKey && (
                          <p className="mt-1 text-sm text-red-600">{errors.paymentCashfreeSecretKey}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* CCAvenue payment gateway - commented out, uncomment block to enable */}
                {/*
                {formData.paymentConfig?.gateway === 'ccavenue' && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                    <h4 className="font-medium text-gray-900 border-b pb-2">CCAvenue Credentials <span className="text-red-500">*</span></h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Merchant ID <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="paymentConfig.ccavenue.merchantId"
                          value={formData.paymentConfig?.ccavenue?.merchantId || ''}
                          onChange={handleInputChange}
                          className={`input-field ${errors.paymentCcavenueMerchantId ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.paymentCcavenueMerchantId && (
                          <p className="mt-1 text-sm text-red-600">{errors.paymentCcavenueMerchantId}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Access Code <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="paymentConfig.ccavenue.accessCode"
                          value={formData.paymentConfig?.ccavenue?.accessCode || ''}
                          onChange={handleInputChange}
                          className={`input-field ${errors.paymentCcavenueAccessCode ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.paymentCcavenueAccessCode && (
                          <p className="mt-1 text-sm text-red-600">{errors.paymentCcavenueAccessCode}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Working Key <span className="text-red-500">*</span></label>
                        <input
                          type="password"
                          name="paymentConfig.ccavenue.workingKey"
                          value={formData.paymentConfig?.ccavenue?.workingKey || ''}
                          onChange={handleInputChange}
                          className={`input-field ${errors.paymentCcavenueWorkingKey ? 'border-red-500 focus:ring-red-500' : ''}`}
                        />
                        {errors.paymentCcavenueWorkingKey && (
                          <p className="mt-1 text-sm text-red-600">{errors.paymentCcavenueWorkingKey}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                */}
              </div>
            </div>
          )}
        </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => navigate('/events')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePreviousTab}
                disabled={activeTab === 'basic' || loading || fetching}
                className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'basic' || loading || fetching
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              {activeTab === 'payment' && areAllTabsValid() ? (
                <button
                  type="submit"
                  form="event-form"
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || fetching}
                >
                  {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Event' : 'Create Event')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextTab}
                  disabled={activeTab === 'payment' || loading || fetching}
                  className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'payment' || loading || fetching
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </form>
        )}
      </div>

      {/* Sponsor Form Modal */}
      <SponsorFormModal
        isOpen={sponsorModalOpen}
        onClose={() => {
          setSponsorModalOpen(false)
          setEditingSponsorId(null)
        }}
        sponsorId={editingSponsorId}
        onSuccess={handleSponsorModalSuccess}
      />
    </div>
  )
}

export default EventForm

