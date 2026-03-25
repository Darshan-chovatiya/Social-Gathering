import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../common/ToastContainer'
import Modal from '../common/Modal'
import Loading from '../common/Loading'
import CustomDropdown from '../common/CustomDropdown'
import { UploadCloud, X, Globe, Facebook, Twitter, Instagram, Linkedin, Youtube, Award } from 'lucide-react'

const SponsorFormModal = ({ isOpen, onClose, sponsorId, onSuccess }) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [errors, setErrors] = useState({})
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [existingLogo, setExistingLogo] = useState(null)
  const [logoError, setLogoError] = useState(false)
  const [formData, setFormData] = useState({
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

  const isEditMode = !!sponsorId

  useEffect(() => {
    if (isOpen) {
      setErrors({})
      setLogoPreview(null)
      setLogoFile(null)
      setExistingLogo(null)
      setLogoError(false)
      if (isEditMode) {
        fetchSponsor()
      } else {
        setFormData({
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
      }
    }
  }, [isOpen, sponsorId])

  const fetchSponsor = async () => {
    try {
      setFetching(true)
      const response = await api.get(`/organizer/sponsors/${sponsorId}`)
      if (response.data.status === 200) {
        const sponsor = response.data.result.sponsor
        setFormData({
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
          setExistingLogo(sponsor.logo)
          setLogoError(false)
        }
      }
    } catch (error) {
      console.error('Error fetching sponsor:', error)
      toast.error('Failed to load sponsor details')
    } finally {
      setFetching(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('socialMedia.')) {
      const field = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [field]: value,
        },
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP, SVG)')
        return
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }

      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result)
        setLogoError(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
      setLogoFile(null)
      setLogoPreview(null)
      setExistingLogo(null)
      setLogoError(false)
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Sponsor name is required'
    }
    
    if (!formData.type) {
      newErrors.type = 'Sponsor type is required'
    }

    // Validate URLs if provided
    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid website URL'
    }
    
    Object.keys(formData.socialMedia).forEach(key => {
      const url = formData.socialMedia[key]
      if (url && !isValidUrl(url)) {
        newErrors[`socialMedia.${key}`] = 'Please enter a valid URL'
      }
    })

    // Logo is required for new sponsors
    if (!isEditMode && !logoFile) {
      newErrors.logo = 'Logo is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string) => {
    try {
      const url = new URL(string)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch (_) {
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting')
      return
    }
    
    setLoading(true)

    try {
      const submitData = new FormData()
      
      submitData.append('name', formData.name.trim())
      submitData.append('type', formData.type)
      if (formData.website) {
        submitData.append('website', formData.website.trim())
      }
      submitData.append('socialMedia', JSON.stringify(formData.socialMedia))
      
      // Add logo file if new one is selected
      if (logoFile) {
        submitData.append('logo', logoFile)
      }

      const response = isEditMode
        ? await api.put(`/organizer/sponsors/${sponsorId}`, submitData)
        : await api.post('/organizer/sponsors', submitData)
      
      if (response.data.status === 200 || response.data.status === 201) {
        toast.success(isEditMode ? 'Sponsor updated successfully!' : 'Sponsor created successfully!')
        
        // Get the sponsor ID from response
        const returnedSponsorId = isEditMode 
          ? sponsorId 
          : response.data.result?.sponsor?._id || 
            response.data.result?._id ||
            response.data.result?.sponsor?._id?.toString() ||
            response.data.result?._id?.toString()
        
        onSuccess?.(returnedSponsorId)
        onClose()
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} sponsor:`, error)
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${isEditMode ? 'update' : 'create'} sponsor`
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
        form="sponsor-form"
        className="btn-primary"
        disabled={loading || fetching}
      >
        {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Sponsor' : 'Create Sponsor')}
      </button>
    </div>
  )

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isEditMode ? 'Edit Sponsor' : 'Create New Sponsor'} 
      size="lg"
      footer={footer}
    >
      {fetching ? (
        <Loading text="Loading sponsor details..." />
      ) : (
        <form id="sponsor-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sponsor Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                  required
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sponsor Type *
                </label>
                <CustomDropdown
                  value={formData.type}
                  onChange={(value) => handleInputChange({ target: { name: 'type', value } })}
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
                  className={errors.type ? 'border-red-500' : ''}
                />
                {errors.type && (
                  <p className="text-red-500 text-xs mt-1">{errors.type}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo {!isEditMode && '*'}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className={`input-field ${errors.logo ? 'border-red-500' : ''}`}
                required={!isEditMode}
              />
              {errors.logo && (
                <p className="text-red-500 text-xs mt-1">{errors.logo}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Accepted formats: JPEG, PNG, GIF, WebP, SVG (Max 5MB)</p>
              
              {/* Logo Preview */}
              {(logoPreview || existingLogo) && (
                <div className="mt-4 relative inline-block">
                  {logoError ? (
                    <div className="w-32 h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                      <Award className="w-12 h-12 text-gray-400" />
                    </div>
                  ) : (
                    <img
                      src={logoPreview || (existingLogo.startsWith('http') ? existingLogo : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${existingLogo}`)}
                      alt="Logo preview"
                      className="w-32 h-32 object-contain rounded-lg border border-gray-200"
                      onError={() => setLogoError(true)}
                    />
                  )}
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    title="Remove logo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Website */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Website</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className={`input-field pl-10 ${errors.website ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.website && (
                <p className="text-red-500 text-xs mt-1">{errors.website}</p>
              )}
            </div>
          </div>

          {/* Social Media Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Social Media Links</h3>
            
            <div className="space-y-3">
              {/* Facebook, Twitter, Instagram in one row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facebook
                  </label>
                  <div className="relative">
                    <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      name="socialMedia.facebook"
                      value={formData.socialMedia.facebook}
                      onChange={handleInputChange}
                      placeholder="https://facebook.com/..."
                      className={`input-field pl-10 ${errors['socialMedia.facebook'] ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors['socialMedia.facebook'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['socialMedia.facebook']}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter
                  </label>
                  <div className="relative">
                    <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      name="socialMedia.twitter"
                      value={formData.socialMedia.twitter}
                      onChange={handleInputChange}
                      placeholder="https://twitter.com/..."
                      className={`input-field pl-10 ${errors['socialMedia.twitter'] ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors['socialMedia.twitter'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['socialMedia.twitter']}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram
                  </label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      name="socialMedia.instagram"
                      value={formData.socialMedia.instagram}
                      onChange={handleInputChange}
                      placeholder="https://instagram.com/..."
                      className={`input-field pl-10 ${errors['socialMedia.instagram'] ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors['socialMedia.instagram'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['socialMedia.instagram']}</p>
                  )}
                </div>
              </div>

              {/* LinkedIn, YouTube in one row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn
                  </label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      name="socialMedia.linkedin"
                      value={formData.socialMedia.linkedin}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/..."
                      className={`input-field pl-10 ${errors['socialMedia.linkedin'] ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors['socialMedia.linkedin'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['socialMedia.linkedin']}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    YouTube
                  </label>
                  <div className="relative">
                    <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      name="socialMedia.youtube"
                      value={formData.socialMedia.youtube}
                      onChange={handleInputChange}
                      placeholder="https://youtube.com/..."
                      className={`input-field pl-10 ${errors['socialMedia.youtube'] ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors['socialMedia.youtube'] && (
                    <p className="text-red-500 text-xs mt-1">{errors['socialMedia.youtube']}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default SponsorFormModal

