import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Award, ArrowLeft } from 'lucide-react'
import Loading from '../components/common/Loading'
import EmptyState from '../components/common/EmptyState'
import api from '../utils/api'

const AllSponsors = () => {
    const { eventId } = useParams()
    const navigate = useNavigate()
    const [sponsors, setSponsors] = useState([])
    const [event, setEvent] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

    useEffect(() => {
        const fetchEventAndSponsors = async () => {
            try {
                setLoading(true)
                setError(null)

                // Fetch event details to get sponsors
                const response = await api.get(`/users/events/${eventId}`)
                
                if (response.data.status === 200 && response.data.result?.event) {
                    const eventData = response.data.result.event
                    setEvent(eventData)
                    
                    // Extract sponsors from event
                    if (eventData.sponsors && eventData.sponsors.length > 0) {
                        setSponsors(eventData.sponsors.filter(sponsor => 
                            sponsor && typeof sponsor === 'object' && sponsor._id && sponsor.name
                        ))
                    }
                } else {
                    setError('Event not found')
                }
            } catch (err) {
                console.error('Error fetching event and sponsors:', err)
                setError(err.response?.data?.message || 'Failed to load sponsors')
            } finally {
                setLoading(false)
            }
        }

        if (eventId) {
            fetchEventAndSponsors()
        }
    }, [eventId])

    const getImageUrl = (logoPath) => {
        if (!logoPath) return ''
        if (logoPath.startsWith('http')) return logoPath
        const baseUrl = API_BASE_URL.replace('/api', '')
        return `${baseUrl}${logoPath}`
    }

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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center">
                <Loading size="lg" text="Loading sponsors..." />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center p-4">
                <EmptyState
                    title="Error"
                    message={error}
                    buttonText="Go Back"
                    onButtonClick={() => navigate(-1)}
                />
            </div>
        )
    }

    if (sponsors.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 p-4">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>
                    <EmptyState
                        title="No Sponsors"
                        message="There are no sponsors for this event."
                        buttonText="Go Back"
                        onButtonClick={() => navigate(-1)}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 pt-4 pb-8">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </button>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        All Sponsors
                    </h1>
                    {event && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {event.title}
                        </p>
                    )}
                </div>

                {/* Sponsors Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {sponsors.map((sponsor, index) => {
                        const sponsorLogoUrl = getImageUrl(sponsor.logo)

                        return (
                            <div
                                key={sponsor._id ? String(sponsor._id) : `sponsor-${index}`}
                                onClick={() => navigate(`/sponsors/${sponsor._id}`)}
                                className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors cursor-pointer"
                            >
                                <div className="flex flex-col items-center text-center">
                                    {/* Logo Card */}
                                    <div className="w-24 h-24 rounded-xl border border-gray-200 dark:border-gray-600 flex items-center justify-center bg-gray-100 dark:bg-gray-700 overflow-hidden mb-2 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
                                        {sponsorLogoUrl ? (
                                            <img
                                                src={sponsorLogoUrl}
                                                alt={sponsor.name || 'Sponsor Logo'}
                                                className="w-full h-full object-contain p-2"
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
                                            <Award className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                                        </div>
                                    </div>
                                    
                                    {/* Sponsor Type */}
                                    <span className={`inline-block px-2 py-1 rounded-full text-[10px] leading-tight font-medium border ${getTypeColor(sponsor.type)}`}>
                                        {getTypeLabel(sponsor.type)}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default AllSponsors

