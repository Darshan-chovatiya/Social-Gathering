import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../common/ToastContainer'
import Modal from '../common/Modal'
import Loading from '../common/Loading'
import { UploadCloud, X, Globe, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react'

const SponsorFormModal = ({ isOpen, onClose, sponsorId, onSuccess, isAdmin = false }) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [errors, setErrors] = useState({})
  const [logoPreview, setLogoPreview] = useState(null)
  const [logoFile, setLogoFile] = useState(null)
  const [existingLogo, setExistingLogo] = useState(null)
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
  const apiBase = isAdmin ? '/admin' : '/organizer'

  useEffect(() => {
    if (isOpen) {
      setErrors({})
      setLogoPreview(null)
      setLogoFile(null)
      setExistingLogo(null)
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
      const response = await api.get(`${apiBase}/sponsors/${sponsorId}`)
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
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP, SVG)')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }

      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setExistingLogo(null)
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Sponsor name is required'
    }
    
    if (!formData.type) {
      newErrors.type = 'Sponsor type is required'
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid website URL'
    }
    
    Object.keys(formData.socialMedia).forEach(key => {
      const url = formData.socialMedia[key]
      if (url && !isValidUrl(url)) {
        newErrors[`socialMedia.${key}`] = 'Please enter a valid URL'
      }
    })

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
      
      if (logoFile) {
        submitData.append('logo', logoFile)
      }

      const response = isEditMode
        ? await api.put(`${apiBase}/sponsors/${sponsorId}`, submitData)
        : await api.post(`${apiBase}/sponsors`, submitData)
      
      if (response.data.status === 200 || response.data.status === 201) {
        toast.success(isEditMode ? 'Sponsor updated successfully!' : 'Sponsor created successfully!')
        onSuccess?.()
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sponsor Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => {
                  handleInputChange(e)
                  // Clear error when user starts typing
                  if (errors.name && e.target.value.trim()) {
                    setErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.name
                      return newErrors
                    })
                  }
                }}
                onBlur={() => {
                  // Validate on blur
                  if (!formData.name.trim()) {
                    setErrors(prev => ({
                      ...prev,
                      name: 'Sponsor name is required'
                    }))
                  }
                }}
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
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={`input-field ${errors.type ? 'border-red-500' : ''}`}
                required
              >
                <option value="sponsor">Sponsor</option>
                <option value="co-sponsor">Co-Sponsor</option>
                <option value="community partner">Community Partner</option>
                <option value="technology partner">Technology Partner</option>
                <option value="social media partner">Social Media Partner</option>
              </select>
              {errors.type && (
                <p className="text-red-500 text-xs mt-1">{errors.type}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo {!isEditMode && '*'}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  handleLogoChange(e)
                  // Clear error when file is selected
                  if (errors.logo && e.target.files?.[0]) {
                    setErrors(prev => {
                      const newErrors = { ...prev }
                      delete newErrors.logo
                      return newErrors
                    })
                  }
                }}
                onBlur={() => {
                  // Validate on blur
                  if (!isEditMode && !logoFile && !existingLogo) {
                    setErrors(prev => ({
                      ...prev,
                      logo: 'Logo is required'
                    }))
                  }
                }}
                className={`input-field ${errors.logo ? 'border-red-500' : ''}`}
                required={!isEditMode}
              />
              {errors.logo && (
                <p className="text-red-500 text-xs mt-1">{errors.logo}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Accepted formats: JPEG, PNG, GIF, WebP, SVG (Max 5MB)</p>
              
              {(logoPreview || existingLogo) && (
                <div className="mt-4 relative inline-block">
                  <img
                    src={logoPreview || (existingLogo.startsWith('http') ? existingLogo : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000'}${existingLogo}`)}
                    alt="Logo preview"
                    className="w-32 h-32 object-contain rounded-lg border border-gray-200"
                  />
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
                  onChange={(e) => {
                    handleInputChange(e)
                    // Clear error when user starts typing
                    if (errors.website && e.target.value.trim()) {
                      if (isValidUrl(e.target.value)) {
                        setErrors(prev => {
                          const newErrors = { ...prev }
                          delete newErrors.website
                          return newErrors
                        })
                      }
                    }
                  }}
                  onBlur={() => {
                    // Validate on blur
                    if (formData.website && !isValidUrl(formData.website)) {
                      setErrors(prev => ({
                        ...prev,
                        website: 'Please enter a valid website URL'
                      }))
                    }
                  }}
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
                    onChange={(e) => {
                      handleInputChange(e)
                      // Clear error when user starts typing
                      if (errors['socialMedia.facebook'] && e.target.value.trim()) {
                        if (isValidUrl(e.target.value)) {
                          setErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors['socialMedia.facebook']
                            return newErrors
                          })
                        }
                      }
                    }}
                    onBlur={() => {
                      // Validate on blur
                      if (formData.socialMedia.facebook && !isValidUrl(formData.socialMedia.facebook)) {
                        setErrors(prev => ({
                          ...prev,
                          'socialMedia.facebook': 'Please enter a valid URL'
                        }))
                      }
                    }}
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
                    onChange={(e) => {
                      handleInputChange(e)
                      // Clear error when user starts typing
                      if (errors['socialMedia.twitter'] && e.target.value.trim()) {
                        if (isValidUrl(e.target.value)) {
                          setErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors['socialMedia.twitter']
                            return newErrors
                          })
                        }
                      }
                    }}
                    onBlur={() => {
                      // Validate on blur
                      if (formData.socialMedia.twitter && !isValidUrl(formData.socialMedia.twitter)) {
                        setErrors(prev => ({
                          ...prev,
                          'socialMedia.twitter': 'Please enter a valid URL'
                        }))
                      }
                    }}
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
                    onChange={(e) => {
                      handleInputChange(e)
                      // Clear error when user starts typing
                      if (errors['socialMedia.instagram'] && e.target.value.trim()) {
                        if (isValidUrl(e.target.value)) {
                          setErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors['socialMedia.instagram']
                            return newErrors
                          })
                        }
                      }
                    }}
                    onBlur={() => {
                      // Validate on blur
                      if (formData.socialMedia.instagram && !isValidUrl(formData.socialMedia.instagram)) {
                        setErrors(prev => ({
                          ...prev,
                          'socialMedia.instagram': 'Please enter a valid URL'
                        }))
                      }
                    }}
                    placeholder="https://instagram.com/..."
                    className={`input-field pl-10 ${errors['socialMedia.instagram'] ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors['socialMedia.instagram'] && (
                  <p className="text-red-500 text-xs mt-1">{errors['socialMedia.instagram']}</p>
                )}
              </div>

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
                    onChange={(e) => {
                      handleInputChange(e)
                      // Clear error when user starts typing
                      if (errors['socialMedia.linkedin'] && e.target.value.trim()) {
                        if (isValidUrl(e.target.value)) {
                          setErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors['socialMedia.linkedin']
                            return newErrors
                          })
                        }
                      }
                    }}
                    onBlur={() => {
                      // Validate on blur
                      if (formData.socialMedia.linkedin && !isValidUrl(formData.socialMedia.linkedin)) {
                        setErrors(prev => ({
                          ...prev,
                          'socialMedia.linkedin': 'Please enter a valid URL'
                        }))
                      }
                    }}
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
                    onChange={(e) => {
                      handleInputChange(e)
                      // Clear error when user starts typing
                      if (errors['socialMedia.youtube'] && e.target.value.trim()) {
                        if (isValidUrl(e.target.value)) {
                          setErrors(prev => {
                            const newErrors = { ...prev }
                            delete newErrors['socialMedia.youtube']
                            return newErrors
                          })
                        }
                      }
                    }}
                    onBlur={() => {
                      // Validate on blur
                      if (formData.socialMedia.youtube && !isValidUrl(formData.socialMedia.youtube)) {
                        setErrors(prev => ({
                          ...prev,
                          'socialMedia.youtube': 'Please enter a valid URL'
                        }))
                      }
                    }}
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
        </form>
      )}
    </Modal>
  )
}

export default SponsorFormModal

