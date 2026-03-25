import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Award, ArrowLeft } from 'lucide-react'
import Loading from '../components/common/Loading'
import EmptyState from '../components/common/EmptyState'
import api from '../utils/api'

const SponsorDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [sponsor, setSponsor] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

    useEffect(() => {
        const fetchSponsor = async () => {
            try {
                setLoading(true)
                setError(null)
                
                // Use the direct sponsor endpoint
                const response = await api.get(`/users/sponsors/${id}`)
                
                if (response.data.status === 200 && response.data.result?.sponsor) {
                    setSponsor(response.data.result.sponsor)
                } else {
                    setError(response.data.message || 'Sponsor not found')
                }
            } catch (err) {
                console.error('Error fetching sponsor:', err)
                setError(err.response?.data?.message || 'Failed to load sponsor details')
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchSponsor()
        }
    }, [id])

    const getTypeLabel = (type) => {
        const labels = {
            'sponsor': 'Sponsor',
            'co-sponsor': 'Co-Sponsor',
            'community partner': 'Community Partner',
            'technology partner': 'Technology Partner',
            'social media partner': 'Social Media Partner',
        }
        return labels[type] || type
    }

    const getTypeColor = (type) => {
        const colors = {
            'sponsor': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
            'co-sponsor': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
            'community partner': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
            'technology partner': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
            'social media partner': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700',
        }
        return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
    }

    // Build logo URL
    let sponsorLogoUrl = null
    if (sponsor?.logo) {
        if (sponsor.logo.startsWith('http')) {
            sponsorLogoUrl = sponsor.logo
        } else {
            sponsorLogoUrl = `${API_BASE_URL.replace('/api', '')}${sponsor.logo}`
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center">
                <Loading size="lg" text="Loading sponsor details..." />
            </div>
        )
    }

    if (error || !sponsor) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center">
                <EmptyState
                    title="Sponsor Not Found"
                    message={error || 'The sponsor you are looking for does not exist.'}
                    actionLabel="Go Back"
                    onAction={() => navigate(-1)}
                />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-900 dark:bg-gray-900">
            {/* Blurred Background Section */}
            <div className="relative h-64 sm:h-80 overflow-hidden">
                {/* Background Image with Blur */}
                {sponsorLogoUrl ? (
                    <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                            backgroundImage: `url(${sponsorLogoUrl})`,
                            filter: 'blur(20px)',
                            transform: 'scale(1.1)',
                        }}
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800" />
                )}
                
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/50" />
            </div>

            {/* Content Card */}
            <div className="relative -mt-32 sm:-mt-40 px-4 sm:px-6 lg:px-8 pb-8">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-white hover:text-gray-200 mb-4 transition-colors relative z-10"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                    </button>

                    {/* Sponsor Details Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
                        {/* Logo Inside Card */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden shadow-lg -mt-20 sm:-mt-24">
                                {sponsorLogoUrl ? (
                                    <img
                                        src={sponsorLogoUrl}
                                        alt={sponsor.name || 'Sponsor Logo'}
                                        className="w-full h-full object-contain p-4"
                                        onError={(e) => {
                                            e.target.style.display = 'none'
                                            e.target.nextSibling.style.display = 'flex'
                                        }}
                                    />
                                ) : null}
                                <div 
                                    className={`w-full h-full items-center justify-center ${sponsorLogoUrl ? 'hidden' : 'flex'}`}
                                    style={{ display: sponsorLogoUrl ? 'none' : 'flex' }}
                                >
                                    <Award className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 dark:text-gray-500" />
                                </div>
                            </div>
                        </div>

                        {/* Sponsor Name and Type */}
                        <div className="text-center mb-6">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                                {sponsor.name || 'Sponsor'}
                            </h1>
                            <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium border ${getTypeColor(sponsor.type)}`}>
                                {getTypeLabel(sponsor.type)}
                            </span>
                        </div>

                        {/* Social Media Links */}
                        {(sponsor.website || sponsor.socialMedia) && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Connect With Us
                                </h2>
                                <div className="flex flex-wrap items-center gap-4">
                                    {/* Website Link */}
                                    {sponsor.website && sponsor.website.trim() && (
                                        <a
                                            href={sponsor.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            title="Visit Website"
                                        >
                                            <img src="/world-wide-web.png" alt="Website" className="w-5 h-5" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Website</span>
                                        </a>
                                    )}
                                    
                                    {/* Social Media Links */}
                                    {sponsor.socialMedia?.facebook && sponsor.socialMedia.facebook.trim() && (
                                        <a
                                            href={sponsor.socialMedia.facebook}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            title="Facebook"
                                        >
                                            <img src="/facebook.png" alt="Facebook" className="w-5 h-5" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Facebook</span>
                                        </a>
                                    )}
                                    {sponsor.socialMedia?.twitter && sponsor.socialMedia.twitter.trim() && (
                                        <a
                                            href={sponsor.socialMedia.twitter}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            title="Twitter"
                                        >
                                            <img src="/twitter.png" alt="Twitter" className="w-5 h-5" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Twitter</span>
                                        </a>
                                    )}
                                    {sponsor.socialMedia?.instagram && sponsor.socialMedia.instagram.trim() && (
                                        <a
                                            href={sponsor.socialMedia.instagram}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            title="Instagram"
                                        >
                                            <img src="/instagram.png" alt="Instagram" className="w-5 h-5" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Instagram</span>
                                        </a>
                                    )}
                                    {sponsor.socialMedia?.linkedin && sponsor.socialMedia.linkedin.trim() && (
                                        <a
                                            href={sponsor.socialMedia.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            title="LinkedIn"
                                        >
                                            <img src="/linkdin.png" alt="LinkedIn" className="w-5 h-5" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">LinkedIn</span>
                                        </a>
                                    )}
                                    {sponsor.socialMedia?.youtube && sponsor.socialMedia.youtube.trim() && (
                                        <a
                                            href={sponsor.socialMedia.youtube}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            title="YouTube"
                                        >
                                            <img src="/youtube.png" alt="YouTube" className="w-5 h-5" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">YouTube</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SponsorDetail

