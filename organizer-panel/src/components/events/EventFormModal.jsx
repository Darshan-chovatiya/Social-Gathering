import { useState, useEffect, useRef } from 'react'
import api from '../../utils/api'
import { useToast } from '../common/ToastContainer'
import { useAuthStore } from '../../store/authStore'
import Modal from '../common/Modal'
import Loading from '../common/Loading'
import CustomDropdown from '../common/CustomDropdown'
import RichTextEditor from '../common/RichTextEditor'
import { Plus, X, ChevronDown, Check, Image as ImageIcon, Globe, Facebook, Twitter, Instagram, Linkedin, Youtube, Award, Edit2, Trash2, Info, Calendar, Ticket, Users, ChevronLeft, ChevronRight } from 'lucide-react'

// Indian States and Cities mapping
const stateCityMap = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kakinada'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Bomdila'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Durg', 'Korba', 'Raigarh', 'Jagdalpur'],
  'Delhi': ['New Delhi', 'Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Anand'],
  'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal'],
  'Himachal Pradesh': ['Shimla', 'Mandi', 'Dharamshala', 'Solan', 'Bilaspur', 'Kullu', 'Manali'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar', 'Giridih'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davangere', 'Shimoga'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha', 'Kannur'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Raipur', 'Ujjain', 'Sagar', 'Dewas'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Thane', 'Kalyan'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Ukhrul'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongpoh', 'Williamnagar'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar'],
  'Sikkim': ['Gangtok', 'Namchi', 'Mangan', 'Gyalshing', 'Singtam'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Ramagundam', 'Khammam', 'Mahbubnagar'],
  'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailasahar', 'Belonia'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad', 'Meerut', 'Ghaziabad', 'Noida'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Kharagpur']
}

const EventFormModal = ({ isOpen, onClose, eventId, onSuccess }) => {
  const { toast } = useToast()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [categories, setCategories] = useState([])
  const [sponsors, setSponsors] = useState([])
  const [errors, setErrors] = useState({})
  const [sponsorDropdownOpen, setSponsorDropdownOpen] = useState(false)
  const sponsorDropdownRef = useRef(null)
  const [showAddSponsorForm, setShowAddSponsorForm] = useState(false)
  const [editingSponsorId, setEditingSponsorId] = useState(null)
  const [sponsorFormData, setSponsorFormData] = useState({
    name: '',
    type: 'sponsor',
    website: '',
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      youtube: '',
    },
  })
  const [sponsorLogoFile, setSponsorLogoFile] = useState(null)
  const [sponsorLogoPreview, setSponsorLogoPreview] = useState(null)
  const [sponsorExistingLogo, setSponsorExistingLogo] = useState(null)
  const [sponsorErrors, setSponsorErrors] = useState({})
  const [sponsorLogoError, setSponsorLogoError] = useState(false)
  const sponsorLogoInputRef = useRef(null)
  const [pendingSponsors, setPendingSponsors] = useState([]) // Track sponsors that need to be created/updated
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
  })

  const isEditMode = !!eventId

  useEffect(() => {
    if (isOpen) {
      setErrors({}) // Reset errors when modal opens
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
        // Reset sponsor form
        setShowAddSponsorForm(false)
        setEditingSponsorId(null)
        setPendingSponsors([])
        setSponsorFormData({
          name: '',
          type: 'sponsor',
          website: '',
          socialMedia: {
            facebook: '',
            twitter: '',
            instagram: '',
            linkedin: '',
            youtube: '',
          },
        })
        setSponsorLogoFile(null)
        setSponsorLogoPreview(null)
        setSponsorExistingLogo(null)
        setSponsorErrors({})
        setSponsorLogoError(false)
      }
    }
  }, [isOpen, eventId])

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

  // Close sponsor dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sponsorDropdownRef.current && !sponsorDropdownRef.current.contains(event.target)) {
        setSponsorDropdownOpen(false)
      }
    }

    if (sponsorDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [sponsorDropdownOpen])

  const handleSponsorToggle = (sponsorId) => {
    setFormData(prev => ({
      ...prev,
      sponsors: prev.sponsors.includes(sponsorId)
        ? prev.sponsors.filter(id => id !== sponsorId)
        : [...prev.sponsors, sponsorId]
    }))
  }

  // Sponsor management functions
  const resetSponsorForm = () => {
    setSponsorFormData({
      name: '',
      type: 'sponsor',
      website: '',
      socialMedia: {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        youtube: '',
      },
    })
    setSponsorLogoFile(null)
    setSponsorLogoPreview(null)
    setSponsorExistingLogo(null)
    setSponsorErrors({})
    setSponsorLogoError(false)
    setEditingSponsorId(null)
    setShowAddSponsorForm(false)
  }

  const handleSponsorInputChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('sponsorSocialMedia.')) {
      const field = name.split('.')[1]
      setSponsorFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [field]: value,
        },
      }))
    } else if (name.startsWith('sponsor.')) {
      const field = name.split('.')[1]
      setSponsorFormData(prev => ({ ...prev, [field]: value }))
    } else {
      setSponsorFormData(prev => ({ ...prev, [name]: value }))
    }
    // Clear errors when user starts typing
    if (sponsorErrors[name]) {
      setSponsorErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSponsorLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP, SVG)')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }

      setSponsorLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setSponsorLogoPreview(reader.result)
        setSponsorLogoError(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeSponsorLogo = () => {
    setSponsorLogoFile(null)
    setSponsorLogoPreview(null)
    setSponsorExistingLogo(null)
    setSponsorLogoError(false)
    if (sponsorLogoInputRef.current) {
      sponsorLogoInputRef.current.value = ''
    }
  }

  const isValidUrl = (string) => {
    if (!string) return true
    try {
      const url = new URL(string)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch (_) {
      return false
    }
  }

  const validateSponsorForm = () => {
    const newErrors = {}
    
    if (!sponsorFormData.name.trim()) {
      newErrors.name = 'Sponsor name is required'
    }
    
    if (!sponsorFormData.type) {
      newErrors.type = 'Sponsor type is required'
    }

    if (sponsorFormData.website && !isValidUrl(sponsorFormData.website)) {
      newErrors.website = 'Please enter a valid website URL'
    }
    
    Object.keys(sponsorFormData.socialMedia).forEach(key => {
      const url = sponsorFormData.socialMedia[key]
      if (url && !isValidUrl(url)) {
        newErrors[`socialMedia.${key}`] = 'Please enter a valid URL'
      }
    })

    if (!editingSponsorId && !sponsorLogoFile) {
      newErrors.logo = 'Logo is required for new sponsors'
    }

    setSponsorErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddSponsorToEvent = () => {
    if (!validateSponsorForm()) {
      toast.error('Please fix the validation errors before adding sponsor')
      return
    }

    const sponsorData = {
      id: editingSponsorId || `temp_${Date.now()}`, // Use temp ID for new sponsors
      name: sponsorFormData.name.trim(),
      type: sponsorFormData.type,
      website: sponsorFormData.website.trim() || '',
      socialMedia: sponsorFormData.socialMedia,
      logoFile: sponsorLogoFile,
      existingLogo: sponsorExistingLogo,
      logoPreview: sponsorLogoPreview,
      isEdit: !!editingSponsorId,
    }

    // Add or update in pending sponsors
    setPendingSponsors(prev => {
      const existingIndex = prev.findIndex(s => {
        const sId = s.id?.toString() || s.id
        const dataId = sponsorData.id?.toString() || sponsorData.id
        return sId === dataId
      })
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = sponsorData
        return updated
      }
      return [...prev, sponsorData]
    })

    // Add to selected sponsors - ensure it's added
    setFormData(prev => {
      const sponsorIdStr = sponsorData.id?.toString() || sponsorData.id
      const existingIds = prev.sponsors.map(id => id?.toString() || id)
      
      if (!existingIds.includes(sponsorIdStr)) {
        // Add new sponsor
        return {
          ...prev,
          sponsors: [...prev.sponsors, sponsorData.id]
        }
      } else {
        // Sponsor already exists, just return prev (pending data will be updated above)
        return prev
      }
    })

    resetSponsorForm()
    toast.success(editingSponsorId ? 'Sponsor updated' : 'Sponsor added to event')
  }

  const handleEditSponsor = async (sponsorId) => {
    // Check if it's a pending sponsor
    const pendingSponsor = pendingSponsors.find(s => s.id === sponsorId)
    
    if (pendingSponsor) {
      // Load from pending sponsor
      setSponsorFormData({
        name: pendingSponsor.name || '',
        type: pendingSponsor.type || 'sponsor',
        website: pendingSponsor.website || '',
        socialMedia: pendingSponsor.socialMedia || {
          facebook: '',
          twitter: '',
          instagram: '',
          linkedin: '',
          youtube: '',
        },
      })
      if (pendingSponsor.logoPreview) {
        setSponsorLogoPreview(pendingSponsor.logoPreview)
      } else if (pendingSponsor.existingLogo) {
        setSponsorExistingLogo(pendingSponsor.existingLogo)
      }
      setSponsorLogoFile(pendingSponsor.logoFile || null)
      setEditingSponsorId(sponsorId)
      setShowAddSponsorForm(true)
    } else {
      // Load from API
      try {
        const response = await api.get(`/organizer/sponsors/${sponsorId}`)
        if (response.data.status === 200) {
          const sponsor = response.data.result.sponsor
          setSponsorFormData({
            name: sponsor.name || '',
            type: sponsor.type || 'sponsor',
            website: sponsor.website || '',
            socialMedia: sponsor.socialMedia || {
              facebook: '',
              twitter: '',
              instagram: '',
              linkedin: '',
              youtube: '',
            },
          })
          if (sponsor.logo) {
            setSponsorExistingLogo(sponsor.logo)
            setSponsorLogoError(false)
          }
          setEditingSponsorId(sponsorId)
          setShowAddSponsorForm(true)
        }
      } catch (error) {
        console.error('Error fetching sponsor:', error)
        toast.error('Failed to load sponsor details')
      }
    }
  }

  const handleRemoveSponsor = (sponsorId) => {
    setFormData(prev => ({
      ...prev,
      sponsors: prev.sponsors.filter(id => id !== sponsorId)
    }))
    // Also remove from pending sponsors if it exists
    setPendingSponsors(prev => prev.filter(s => s.id !== sponsorId))
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
    
    // Validate sponsor form if it's open
    if (showAddSponsorForm && sponsorFormData.name.trim()) {
      if (!validateSponsorForm()) {
        newErrors.sponsorForm = 'Please complete or close the sponsor form'
      }
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const validateForm = () => {
    const basicValid = validateBasicInfoTab()
    const slotsValid = validateSlotsTab()
    const ticketsValid = validateTicketsTab()
    const sponsorsValid = validateSponsorsTab()
    
    return basicValid && slotsValid && ticketsValid && sponsorsValid
  }

  // Tab navigation handlers
  const handleTabChange = (targetTab) => {
    // Allow navigation backward without validation
    const tabOrder = ['basic', 'slots', 'tickets', 'sponsors']
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

    // Validate sponsor form if it's open
    if (showAddSponsorForm && sponsorFormData.name.trim()) {
      if (!validateSponsorForm()) {
        toast.error('Please complete or close the sponsor form before submitting')
        return
      }
    }
    
    setLoading(true)

    try {
      // Build complete list of pending sponsors including current form data
      const allPendingSponsors = [...pendingSponsors]
      let currentSponsorId = null
      
      // If sponsor form is open and has data, add it to pending sponsors
      if (showAddSponsorForm && sponsorFormData.name.trim()) {
        const currentSponsorData = {
          id: editingSponsorId || `temp_${Date.now()}`,
          name: sponsorFormData.name.trim(),
          type: sponsorFormData.type,
          website: sponsorFormData.website.trim() || '',
          socialMedia: sponsorFormData.socialMedia,
          logoFile: sponsorLogoFile,
          existingLogo: sponsorExistingLogo,
          logoPreview: sponsorLogoPreview,
          isEdit: !!editingSponsorId,
        }
        
        currentSponsorId = currentSponsorData.id
        
        // Check if this sponsor already exists in pending
        const existingIndex = allPendingSponsors.findIndex(s => {
          const sId = s.id?.toString() || s.id
          const dataId = currentSponsorData.id?.toString() || currentSponsorData.id
          return sId === dataId
        })
        
        if (existingIndex >= 0) {
          allPendingSponsors[existingIndex] = currentSponsorData
        } else {
          allPendingSponsors.push(currentSponsorData)
        }
      }
      
      // First, create/update all pending sponsors
      // Build finalSponsorIds from formData.sponsors, ensuring current sponsor is included
      const finalSponsorIds = [...formData.sponsors]
      if (currentSponsorId) {
        const sponsorIdStr = currentSponsorId?.toString() || currentSponsorId
        const existingIds = finalSponsorIds.map(id => id?.toString() || id)
        if (!existingIds.includes(sponsorIdStr)) {
          finalSponsorIds.push(currentSponsorId)
        }
      }
      
      if (allPendingSponsors.length > 0) {
        for (const pendingSponsor of allPendingSponsors) {
          try {
            const sponsorSubmitData = new FormData()
            sponsorSubmitData.append('name', pendingSponsor.name)
            sponsorSubmitData.append('type', pendingSponsor.type)
            if (pendingSponsor.website) {
              sponsorSubmitData.append('website', pendingSponsor.website)
            }
            sponsorSubmitData.append('socialMedia', JSON.stringify(pendingSponsor.socialMedia))
            
            if (pendingSponsor.logoFile) {
              sponsorSubmitData.append('logo', pendingSponsor.logoFile)
            }

            const sponsorResponse = pendingSponsor.isEdit
              ? await api.put(`/organizer/sponsors/${pendingSponsor.id}`, sponsorSubmitData)
              : await api.post('/organizer/sponsors', sponsorSubmitData)
            
            if (sponsorResponse.data.status === 200 || sponsorResponse.data.status === 201) {
              // Get the actual sponsor ID from response
              let actualSponsorId = null
              if (pendingSponsor.isEdit) {
                actualSponsorId = pendingSponsor.id
              } else {
                // For new sponsors, extract ID from response
                actualSponsorId = sponsorResponse.data.result?.sponsor?._id || 
                                 sponsorResponse.data.result?._id ||
                                 sponsorResponse.data.result?.sponsor?._id?.toString() ||
                                 sponsorResponse.data.result?._id?.toString() ||
                                 (sponsorResponse.data.result?.sponsor && sponsorResponse.data.result.sponsor._id) ||
                                 (sponsorResponse.data.result && sponsorResponse.data.result._id)
              }
              
              if (actualSponsorId) {
                // Replace temp ID with actual ID in finalSponsorIds
                const tempIdStr = pendingSponsor.id?.toString() || pendingSponsor.id
                const actualIdStr = actualSponsorId?.toString() || actualSponsorId
                
                const tempIndex = finalSponsorIds.findIndex(id => {
                  const idStr = id?.toString() || id
                  return idStr === tempIdStr
                })
                
                if (tempIndex >= 0) {
                  finalSponsorIds[tempIndex] = actualSponsorId
                } else {
                  // Check if actual ID is already in the list
                  const exists = finalSponsorIds.some(id => {
                    const idStr = id?.toString() || id
                    return idStr === actualIdStr
                  })
                  if (!exists) {
                    finalSponsorIds.push(actualSponsorId)
                  }
                }
              }
            }
          } catch (sponsorError) {
            console.error(`Error ${pendingSponsor.isEdit ? 'updating' : 'creating'} sponsor:`, sponsorError)
            const errorMessage = sponsorError.response?.data?.message || sponsorError.message || `Failed to ${pendingSponsor.isEdit ? 'update' : 'create'} sponsor`
            toast.error(errorMessage)
            setLoading(false)
            return
          }
        }
      }

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
        
        // Reset sponsor form state
        resetSponsorForm()
        setPendingSponsors([])
        
        toast.success(isEditMode ? 'Event updated successfully!' : 'Event created successfully! Waiting for admin approval.')
        onSuccess?.()
        onClose()
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
    if (showAddSponsorForm && sponsorFormData.name.trim()) {
      if (!validateSponsorForm()) {
        sponsorsValid = false
      }
    }
    
    return basicValid && slotsValid && ticketsValid && sponsorsValid
  }

  const footer = (
    <div className="flex items-center justify-end gap-2 p-6">
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
      {activeTab === 'sponsors' && areAllTabsValid() ? (
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
          disabled={activeTab === 'sponsors' || loading || fetching}
          className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'sponsors' || loading || fetching
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditMode ? 'Edit Event' : 'Create New Event'} 
      size="lg"
      footer={footer}
    >
      {fetching ? (
        <Loading text="Loading event details..." />
      ) : (
        <form id="event-form" onSubmit={handleSubmit} className="space-y-0 flex flex-col h-full -m-6">
          {/* Tab Navigation - Sticky with White Background */}
          <div className="sticky top-[-25px] bg-white z-10 border-b border-gray-200">
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
              </nav>
            </div>
          </div>

          {/* Tab Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 mt-6 pb-4">
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
                  onChange={(value) => handleInputChange({ target: { name: 'address.state', value } })}
                  options={[
                    { value: '', label: 'Select State' },
                    ...Object.keys(stateCityMap).map((state) => ({
                      value: state,
                      label: state,
                    })),
                  ]}
                  placeholder="Select State"
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
                  options={
                    formData.address.state
                      ? [
                          { value: '', label: 'Select City' },
                          ...(stateCityMap[formData.address.state] || []).map((city) => ({
                            value: city,
                            label: city,
                          })),
                        ]
                      : [{ value: '', label: 'Select City' }]
                  }
                  placeholder="Select City"
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
                      onClick={() => {
                        resetSponsorForm()
                        setShowAddSponsorForm(true)
                      }}
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
                        // Check if it's a pending sponsor - compare as strings
                        const sponsorIdStr = sponsorId?.toString() || sponsorId
                        const pendingSponsor = pendingSponsors.find(s => {
                          const sId = s.id?.toString() || s.id
                          return sId === sponsorIdStr
                        })
                        
                        // Find sponsor by comparing IDs as strings to handle type mismatches
                        const sponsor = sponsors.find(s => {
                          const sId = s._id?.toString() || s._id
                          return sId === sponsorIdStr
                        })
                        
                        // Use pending sponsor data if available, otherwise use fetched sponsor
                        const displaySponsor = pendingSponsor || sponsor
                        
                        if (!displaySponsor) {
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
                        
                        // Use pending sponsor data or fetched sponsor data
                        const sponsorName = pendingSponsor?.name || sponsor?.name
                        const sponsorType = pendingSponsor?.type || sponsor?.type
                        const sponsorLogo = pendingSponsor?.logoPreview || 
                                          (pendingSponsor?.existingLogo && pendingSponsor.existingLogo.startsWith('http') 
                                            ? pendingSponsor.existingLogo 
                                            : pendingSponsor?.existingLogo 
                                              ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${pendingSponsor.existingLogo}`
                                              : null) ||
                                          (sponsor?.logo && sponsor.logo.startsWith('http') 
                                            ? sponsor.logo 
                                            : sponsor?.logo 
                                              ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${sponsor.logo}`
                                              : null)
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

                  {/* Add/Edit Sponsor Form */}
                  {showAddSponsorForm && (
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {editingSponsorId ? 'Edit Sponsor' : 'Add New Sponsor'}
                        </h4>
                        <button
                          type="button"
                          onClick={resetSponsorForm}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {errors.sponsorForm && (
                        <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-600 text-xs">{errors.sponsorForm}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Sponsor Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={sponsorFormData.name}
                            onChange={handleSponsorInputChange}
                            className={`input-field text-sm ${sponsorErrors.name ? 'border-red-500' : ''}`}
                            required
                          />
                          {sponsorErrors.name && (
                            <p className="text-red-500 text-xs mt-1">{sponsorErrors.name}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Sponsor Type *
                          </label>
                          <CustomDropdown
                            value={sponsorFormData.type}
                            onChange={(value) => handleSponsorInputChange({ target: { name: 'type', value } })}
                            options={[
                              { value: 'sponsor', label: 'Sponsor' },
                              { value: 'co-sponsor', label: 'Co-Sponsor' },
                              { value: 'title sponsor', label: 'Title Sponsor' },
                              { value: 'supported by', label: 'Supported By' },
                              { value: 'community partner', label: 'Community Partner' },
                              { value: 'technology partner', label: 'Technology Partner' },
                              { value: 'social media partner', label: 'Social Media Partner' },
                            ]}
                            placeholder="Select sponsor type"
                            className={sponsorErrors.type ? 'border-red-500' : ''}
                          />
                          {sponsorErrors.type && (
                            <p className="text-red-500 text-xs mt-1">{sponsorErrors.type}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Logo {!editingSponsorId && '*'}
                        </label>
                        <input
                          ref={sponsorLogoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleSponsorLogoChange}
                          className={`input-field text-sm ${sponsorErrors.logo ? 'border-red-500' : ''}`}
                          required={!editingSponsorId}
                        />
                        {sponsorErrors.logo && (
                          <p className="text-red-500 text-xs mt-1">{sponsorErrors.logo}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">JPEG, PNG, GIF, WebP, SVG (Max 5MB)</p>
                        
                        {(sponsorLogoPreview || sponsorExistingLogo) && (
                          <div className="mt-3 relative inline-block">
                            {sponsorLogoError ? (
                              <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                <Award className="w-8 h-8 text-gray-400" />
                              </div>
                            ) : (
                              <img
                                src={sponsorLogoPreview || (sponsorExistingLogo.startsWith('http') ? sponsorExistingLogo : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${sponsorExistingLogo}`)}
                                alt="Logo preview"
                                className="w-24 h-24 object-contain rounded-lg border border-gray-200"
                                onError={() => setSponsorLogoError(true)}
                              />
                            )}
                            <button
                              type="button"
                              onClick={removeSponsorLogo}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                              title="Remove logo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Website URL
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="url"
                            name="website"
                            value={sponsorFormData.website}
                            onChange={handleSponsorInputChange}
                            placeholder="https://example.com"
                            className={`input-field text-sm pl-10 ${sponsorErrors.website ? 'border-red-500' : ''}`}
                          />
                        </div>
                        {sponsorErrors.website && (
                          <p className="text-red-500 text-xs mt-1">{sponsorErrors.website}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Social Media Links
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <div className="relative">
                              <Facebook className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="url"
                                name="sponsorSocialMedia.facebook"
                                value={sponsorFormData.socialMedia.facebook}
                                onChange={handleSponsorInputChange}
                                placeholder="Facebook URL"
                                className={`input-field text-sm pl-8 ${sponsorErrors['socialMedia.facebook'] ? 'border-red-500' : ''}`}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="relative">
                              <Twitter className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="url"
                                name="sponsorSocialMedia.twitter"
                                value={sponsorFormData.socialMedia.twitter}
                                onChange={handleSponsorInputChange}
                                placeholder="Twitter URL"
                                className={`input-field text-sm pl-8 ${sponsorErrors['socialMedia.twitter'] ? 'border-red-500' : ''}`}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="relative">
                              <Instagram className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="url"
                                name="sponsorSocialMedia.instagram"
                                value={sponsorFormData.socialMedia.instagram}
                                onChange={handleSponsorInputChange}
                                placeholder="Instagram URL"
                                className={`input-field text-sm pl-8 ${sponsorErrors['socialMedia.instagram'] ? 'border-red-500' : ''}`}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="relative">
                              <Linkedin className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="url"
                                name="sponsorSocialMedia.linkedin"
                                value={sponsorFormData.socialMedia.linkedin}
                                onChange={handleSponsorInputChange}
                                placeholder="LinkedIn URL"
                                className={`input-field text-sm pl-8 ${sponsorErrors['socialMedia.linkedin'] ? 'border-red-500' : ''}`}
                              />
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <div className="relative">
                              <Youtube className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="url"
                                name="sponsorSocialMedia.youtube"
                                value={sponsorFormData.socialMedia.youtube}
                                onChange={handleSponsorInputChange}
                                placeholder="YouTube URL"
                                className={`input-field text-sm pl-8 ${sponsorErrors['socialMedia.youtube'] ? 'border-red-500' : ''}`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
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
          </div>
        </form>
      )}
    </Modal>
  )
}

export default EventFormModal

