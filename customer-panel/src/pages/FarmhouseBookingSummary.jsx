import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { MapPin, Calendar, Clock, ArrowLeft, Tag, X, Info, ShieldCheck, Home, Users, Bed, Bath } from 'lucide-react'
import EmptyState from '../components/common/EmptyState'
import api from '../utils/api'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../components/common/ToastContainer'
import Header from '../components/layout/Header'

const formatTime = (timeStr) => {
  if (!timeStr) return '--:--'
  try {
    const [hours, minutes] = timeStr.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${minutes} ${ampm}`
  } catch (e) {
    return timeStr
  }
}

const FarmhouseBookingSummary = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()
  const { toast } = useToast()
  
  const [processingPayment, setProcessingPayment] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  
  // Get booking data from location state
  const [bookingData, setBookingData] = useState(() => {
    return location.state || null
  })

  useEffect(() => {
    if (!bookingData) {
      // Try to recover from sessionStorage if needed (though location.state is better)
      const saved = sessionStorage.getItem('fhBookingData')
      if (saved) {
        setBookingData(JSON.parse(saved))
      }
    }
  }, [])

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <EmptyState
            icon={Home}
            title="No Booking Data"
            message="Please start the booking process from the farmhouse page."
          />
        </div>
      </div>
    )
  }

  const { 
    farmhouse, 
    checkInDate, 
    checkOutDate, 
    stayType, 
    totalPrice = 0, 
    depositAmount = 0, 
    finalTotal = 0 
  } = bookingData || {}

  const handleProceedToPay = async () => {
    if (processingPayment) return

    if (!isAuthenticated) {
      sessionStorage.setItem('fhBookingData', JSON.stringify(bookingData))
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    setProcessingPayment(true)
    try {
      const payload = {
        farmhouseId: farmhouse._id,
        checkInDate,
        checkOutDate,
        stayType,
        offerCode: appliedCoupon?.code || null
      }

      const orderResponse = await api.post('/users/payments/create-order', {
        bookingData: payload,
        amount: finalTotal - discountAmount
      })

      const { result } = orderResponse.data
      const { gateway, orderData, bookingId, keyId, isTestMode } = result

      if (!gateway || (finalTotal - discountAmount) === 0) {
        toast.success('Your booking is confirmed!')
        navigate(`/farmhouses/bookings/${bookingId}/confirmation`)
        return
      }

      if (gateway === 'razorpay') {
        const options = {
          key: keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Prime Tickets',
          description: `Booking for ${farmhouse.title}`,
          order_id: orderData.id,
          handler: async function (response) {
            try {
              const storeResponse = await api.post('/users/payments/store', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId: bookingId,
                amount: finalTotal - discountAmount,
                gateway: 'razorpay'
              })

              if (storeResponse.data?.status === 200) {
                toast.success('Payment successful!')
                navigate(`/farmhouses/bookings/${bookingId}/confirmation`)
              }
            } catch (error) {
              toast.error('Payment verification failed')
              setProcessingPayment(false)
            }
          },
          prefill: {
            name: '',
            email: '',
          },
          modal: {
            ondismiss: function() {
              setProcessingPayment(false)
            }
          }
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else if (gateway === 'cashfree') {
        const cashfree = window.Cashfree({
          mode: isTestMode ? 'sandbox' : 'production'
        })
        cashfree.checkout({
          paymentSessionId: orderData.payment_session_id,
          redirectTarget: '_self'
        })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed')
      setProcessingPayment(false)
    }
  }

  const getImageUrl = (path) => {
    if (!path) return ''
    const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '')
    return `${baseUrl}${path}`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <Header />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Farmhouse
        </button>

        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">Review Your Booking</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Farmhouse Card */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 aspect-video md:aspect-square">
                  <img 
                    src={getImageUrl(farmhouse.banners[0])} 
                    alt={farmhouse.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 md:w-2/3 flex flex-col justify-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{farmhouse.title}</h2>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-4">
                    <MapPin className="w-4 h-4 text-primary-500" />
                    <span>{farmhouse.address?.city}, {farmhouse.address?.state}</span>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                      <Users className="w-4 h-4" /> {farmhouse.amenities?.guests} Guests
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">
                      <Bed className="w-4 h-4" /> {farmhouse.amenities?.bedrooms} Bedrooms
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stay Details */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Stay Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Check-In</p>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary-500" />
                      <span className="font-bold text-gray-900 dark:text-white">{new Date(checkInDate).toLocaleDateString('en-IN', { dateStyle: 'full' })}</span>
                    </div>
                    <div className="mt-1 ml-8 flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" /> <span>{formatTime(farmhouse.checkInTime)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Check-Out</p>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary-500" />
                      <span className="font-bold text-gray-900 dark:text-white">{new Date(checkOutDate).toLocaleDateString('en-IN', { dateStyle: 'full' })}</span>
                    </div>
                    <div className="mt-1 ml-8 flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" /> <span>{formatTime(farmhouse.checkOutTime)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-600">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Booking Type</p>
                    <p className="text-xs text-gray-500 uppercase font-medium">
                      {stayType === 'rate24h' ? '24 Hours Stay' : stayType === 'rate12h' ? '12 Hours Day Use' : 'Per Night Basis'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rules & Terms */}
            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-3xl p-8 border border-amber-100 dark:border-amber-900/30">
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" /> Important Notes
              </h3>
              <ul className="space-y-2 text-sm text-amber-800 dark:text-amber-200/70">
                <li className="flex gap-2"><span>•</span> <span>Security deposit is refundable upon checkout after property verification.</span></li>
                <li className="flex gap-2"><span>•</span> <span>Please carry a valid ID proof at the time of check-in.</span></li>
                <li className="flex gap-2"><span>•</span> <span>Follow all house rules mentioned on the property page.</span></li>
              </ul>
            </div>
          </div>

          {/* Price Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-tight">Price Breakdown</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Base Amount</span>
                    <span className="font-bold text-gray-900 dark:text-white">₹{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Security Deposit</span>
                    <span className="font-bold text-gray-900 dark:text-white">₹{depositAmount.toLocaleString()}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                      <span>Coupon Discount</span>
                      <span>-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-gray-700 mb-8">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Payable</p>
                      <h4 className="text-3xl font-extrabold text-primary-600 dark:text-primary-400">₹{(finalTotal - discountAmount).toLocaleString()}</h4>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleProceedToPay}
                  disabled={processingPayment}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-4 rounded-2xl font-extrabold text-lg shadow-xl shadow-primary-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {processingPayment ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'CONFIRM & PAY'
                  )}
                </button>
              </div>

              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary-500" />
                  <span className="text-xs font-bold text-gray-500 uppercase">Have a coupon?</span>
                </div>
                <div className="mt-2 flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter code" 
                    className="flex-1 bg-white dark:bg-gray-800 border-none rounded-xl text-sm px-4 py-2 focus:ring-1 focus:ring-primary-500 dark:text-white"
                  />
                  <button className="bg-gray-900 dark:bg-gray-700 text-white px-4 rounded-xl text-xs font-bold hover:bg-black transition-colors">APPLY</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FarmhouseBookingSummary
