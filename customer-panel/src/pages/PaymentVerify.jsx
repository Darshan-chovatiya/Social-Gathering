import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import Loading from '../components/common/Loading'
import { CheckCircle, XCircle } from 'lucide-react'

const PaymentVerify = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing') // processing, success, error
  const [message, setMessage] = useState('Verifying your payment...')

  useEffect(() => {
    const verifyPayment = async () => {
      const orderId = searchParams.get('order_id')
      
      if (!orderId) {
        setStatus('error')
        setMessage('Invalid order ID')
        return
      }

      try {
        const response = await api.post('/users/payments/verify', {
          order_id: orderId
        })

        if (response.data?.status === 200) {
          setStatus('success')
          setMessage('Payment successful! Redirecting...')
          
          // Small delay to show success state
          setTimeout(() => {
            const confirmedBooking = response.data.result.booking
            const confirmedEvent = response.data.result.event || confirmedBooking.eventId
            navigate(`/bookings/${confirmedBooking._id || confirmedBooking.bookingId}/confirmation`, {
              state: { booking: confirmedBooking, event: confirmedEvent },
              replace: true
            })
          }, 2000)
        } else {
          setStatus('error')
          setMessage(response.data?.message || 'Payment verification failed')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage(error.response?.data?.message || 'An error occurred during verification')
      }
    }

    verifyPayment()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border border-gray-100 dark:border-gray-700">
        {status === 'processing' && (
          <div className="flex flex-col items-center">
            <Loading size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium">
              {message}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Confirmed
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-semibold transition-colors shadow-md"
            >
              Go to Home
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentVerify
