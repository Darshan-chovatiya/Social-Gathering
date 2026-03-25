import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, Loader2, Phone, Shield, User, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useToast } from '../components/common/ToastContainer'
import api from '../utils/api'
import { getEventDetailPath } from '../utils/eventUrl'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { sendOTP, verifyOTP, isLoading, isAuthenticated, setAuth, user } = useAuthStore()
  const { toast } = useToast()
  
  const [step, setStep] = useState(1) // 1: Mobile, 2: OTP, 3: Name/Email
  const [mobile, setMobile] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [verifiedOtp, setVerifiedOtp] = useState('') // Store verified OTP

  // Get return URL from location state or default to home
  const returnUrl = location.state?.from || '/'

  // Check if user needs to complete profile
  const needsProfileCompletion = isAuthenticated && user && (!user.name || !user.email)

  // Redirect if already authenticated and profile is complete (but not during login flow)
  useEffect(() => {
    // Don't redirect if we're on step 3 (name/email form) or if user needs profile completion
    if (isAuthenticated && step !== 3 && !needsProfileCompletion) {
      // Double check user has name and email before redirecting
      const currentUser = useAuthStore.getState().user
      if (currentUser?.name && currentUser?.email) {
        // Check if there's a saved booking path to redirect to
        const savedBookingPath = sessionStorage.getItem('bookingPath')
        const savedBookingData = sessionStorage.getItem('bookingData')
        
        if (savedBookingPath && savedBookingData) {
          // Redirect back to booking summary with saved data
          try {
            const bookingData = JSON.parse(savedBookingData)
            navigate(savedBookingPath, {
              state: bookingData,
              replace: true
            })
            return
          } catch (err) {
            console.error('Error parsing saved booking data:', err)
          }
        }

        // Check for saved farmhouse booking data
        const savedFhBookingData = sessionStorage.getItem('fhBookingData')
        if (savedBookingPath && savedFhBookingData) {
          try {
            const fhBookingData = JSON.parse(savedFhBookingData)
            navigate(savedBookingPath, {
              state: fhBookingData,
              replace: true
            })
            return
          } catch (err) {
            console.error('Error parsing saved farmhouse booking data:', err)
          }
        }
        
        // Otherwise, redirect to returnUrl or default
        if (returnUrl && returnUrl !== '/') {
          navigate(returnUrl, { replace: true })
        } else {
          navigate('/dashboard', { replace: true })
        }
      }
    }
  }, [isAuthenticated, needsProfileCompletion, navigate, returnUrl, step])

  // If user is authenticated but missing name/email, show step 3
  useEffect(() => {
    if (needsProfileCompletion && step !== 3) {
      setStep(3)
    }
  }, [needsProfileCompletion, step])

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const validateMobile = (mobileNumber) => {
    const mobileRegex = /^[6-9]\d{9}$/
    return mobileRegex.test(mobileNumber.replace(/\D/g, ''))
  }

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError('')

    const cleanedMobile = mobile.replace(/\D/g, '')
    
    if (!cleanedMobile) {
      setError('Please enter your mobile number')
      return
    }

    if (!validateMobile(cleanedMobile)) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    const result = await sendOTP(cleanedMobile)
    
    if (result.success) {
      setStep(2)
      setCountdown(120) // 2 minutes countdown
      setError('')
    } else {
      setError(result.message || 'Failed to send OTP. Please try again.')
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setError('')

    const otpString = getOtpString()
    if (!otpString || otpString.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    const cleanedMobile = mobile.replace(/\D/g, '')
    // Verify OTP without name/email first
    const result = await verifyOTP(cleanedMobile, otpString, undefined, undefined)
    
    if (result.success) {
      // Store verified OTP
      setVerifiedOtp(otpString)
      setError('')
      
      // Immediately set step to 3 to prevent redirect
      setStep(3)
      
      // Check if user needs to complete profile
      // Wait a bit for the auth store to update
      setTimeout(() => {
        const currentUser = useAuthStore.getState().user
        if (currentUser?.name && currentUser?.email) {
          // User already has name/email, show success toast
          toast.success('Login successful!', 'Welcome back!')
          // Check if there's a saved booking path to redirect to
          const savedBookingPath = sessionStorage.getItem('bookingPath')
          const savedBookingData = sessionStorage.getItem('bookingData')
          
          if (savedBookingPath && savedBookingData) {
            // Redirect back to booking summary with saved data
            try {
              const bookingData = JSON.parse(savedBookingData)
              navigate(savedBookingPath, {
                state: bookingData,
                replace: true
              })
              return
            } catch (err) {
              console.error('Error parsing saved booking data:', err)
            }
          }

          // Check for saved farmhouse booking data
          const savedFhBookingData = sessionStorage.getItem('fhBookingData')
          if (savedBookingPath && savedFhBookingData) {
            try {
              const fhBookingData = JSON.parse(savedFhBookingData)
              navigate(savedBookingPath, {
                state: fhBookingData,
                replace: true
              })
              return
            } catch (err) {
              console.error('Error parsing saved farmhouse booking data:', err)
            }
          }
          
          // Otherwise, redirect to returnUrl or default
          if (returnUrl && returnUrl !== '/') {
            navigate(returnUrl, { replace: true })
            return
          }

          navigate('/dashboard', { replace: true })
        }
        // If user doesn't have name/email, step 3 is already set, so form will show
      }, 100)
    } else {
      setError(result.message || 'Invalid OTP. Please try again.')
    }
  }

  const handleCompleteLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    if (!email.trim()) {
      setError('Please enter your email')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address')
      return
    }

    try {
      // Update profile with name and email
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('email', email.trim())

      const response = await api.put('/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.status === 200) {
        const updatedUser = response.data.result.user
        const currentToken = useAuthStore.getState().token
        setAuth(updatedUser, currentToken)
        
        // Show success toast
        toast.success('Login successful!', 'Welcome!')
        
        // Check if there's a saved booking path to redirect to
        if (savedBookingPath && savedBookingData) {
          // Redirect back to booking summary with saved data
          try {
            const bookingData = JSON.parse(savedBookingData)
            navigate(savedBookingPath, {
              state: bookingData,
              replace: true
            })
            return
          } catch (err) {
            console.error('Error parsing saved booking data:', err)
          }
        }

        // Check for saved farmhouse booking data
        const savedFhBookingData = sessionStorage.getItem('fhBookingData')
        if (savedBookingPath && savedFhBookingData) {
          try {
            const fhBookingData = JSON.parse(savedFhBookingData)
            navigate(savedBookingPath, {
              state: fhBookingData,
              replace: true
            })
            return
          } catch (err) {
            console.error('Error parsing saved farmhouse booking data:', err)
          }
        }
        
        // Otherwise, redirect to returnUrl or default
        if (returnUrl && returnUrl !== '/') {
          navigate(returnUrl, { replace: true })
          return
        }

        navigate('/dashboard', { replace: true })
      } else {
        setError(response.data.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setError(error.response?.data?.message || 'Failed to update profile. Please try again.')
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0) return
    
    setError('')
    const cleanedMobile = mobile.replace(/\D/g, '')
    const result = await sendOTP(cleanedMobile)
    
    if (result.success) {
      setCountdown(120)
      setError('')
    } else {
      setError(result.message || 'Failed to resend OTP. Please try again.')
    }
  }

  const formatMobileNumber = (value) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)}`
  }

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, '')
    if (value.length <= 10) {
      setMobile(value)
      setError('')
    }
  }

  const handleOtpChange = (index, value) => {
    const numValue = value.replace(/\D/g, '')
    if (numValue.length <= 1) {
      const newOtp = [...otp]
      newOtp[index] = numValue
      setOtp(newOtp)
      setError('')
      
      // Auto-focus next input
      if (numValue && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`)
        if (nextInput) nextInput.focus()
      }
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      setOtp(pastedData.split(''))
      const lastInput = document.getElementById(`otp-5`)
      if (lastInput) lastInput.focus()
    }
  }

  const getOtpString = () => otp.join('')

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 relative">
      {/* Close Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Content - No Card */}
      <div className="relative w-full max-w-md py-4">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === stepNum
                    ? 'bg-primary-500 text-white scale-110'
                    : step > stepNum
                    ? 'bg-primary-100 dark:bg-primary-900/30'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                {step > stepNum ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  stepNum
                )}
              </div>
              {stepNum < 3 && (
                <div
                  className={`w-8 h-0.5 mx-1 transition-all ${
                    step > stepNum ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="space-y-6">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <Phone className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>

            {/* Header */}
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Welcome Back!</h1>
              <p className="text-base text-gray-600 dark:text-gray-400">Enter your phone number to continue</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Mobile Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative flex items-center border-2 border-gray-300 dark:border-gray-600 rounded-xl focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all overflow-hidden bg-white dark:bg-gray-800">
                {/* Country Code */}
                <div className="flex items-center px-4 py-3.5 border-r-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                  <span className="text-base font-bold text-gray-900 dark:text-white">+91</span>
                </div>
                
                {/* Mobile Input */}
                <input
                  type="tel"
                  value={mobile}
                  onChange={handleMobileChange}
                  placeholder="1234567890"
                  className="flex-1 px-4 py-3.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-0 border-0 text-base"
                  style={{ outline: 'none', boxShadow: 'none' }}
                  maxLength={10}
                  required
                  autoFocus
                />
                
                {/* Checkmark when valid */}
                {mobile.length === 10 && validateMobile(mobile) && (
                  <div className="pr-4 flex items-center animate-fade-in">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                We'll send you a verification code via SMS
              </p>
            </div>

            {/* Send Code Button */}
            <button
              type="submit"
              disabled={isLoading || !mobile || mobile.length !== 10 || !validateMobile(mobile)}
              className="w-full bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:hover:shadow-primary-500/30 flex items-center justify-center text-base"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending Code...
                </span>
              ) : (
                <>
                  <Phone className="w-5 h-5 mr-2" />
                  Send Verification Code
                </>
              )}
            </button>

            {/* Footer Links */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </form>
        ) : step === 2 ? (
          <form onSubmit={handleVerifyOTP} className="space-y-4 sm:space-y-6">
            {/* Icon */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
              </div>
            </div>

            {/* Header */}
            <div className="text-center space-y-2 mb-4 sm:mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">Verify Your Account</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                We've sent a 6-digit code to
              </p>
              <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                +91 {mobile}
              </p>
            </div>

            {/* Countdown Timer */}
            {countdown > 0 && (
              <div className="text-center p-3 sm:p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800 mb-4">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Resend code in</p>
                <p className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">{formatCountdown(countdown)}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* OTP Input Fields */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                Enter Verification Code
              </label>
              <div className="flex gap-2 sm:gap-3 justify-center" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className={`w-11 h-12 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold border-2 rounded-lg sm:rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all ${
                      digit ? 'border-primary-500' : 'border-gray-300 dark:border-gray-600'
                    } focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500`}
                    style={{ outline: 'none', boxShadow: digit ? '0 4px 12px rgba(248, 68, 100, 0.15)' : 'none' }}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            {/* Verify Code Button */}
            <button
              type="submit"
              disabled={isLoading || getOtpString().length !== 6}
              className="w-full bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-bold py-3 sm:py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:hover:shadow-primary-500/30 flex items-center justify-center text-sm sm:text-base"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying...
                </span>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Verify & Continue
                </>
              )}
            </button>

            {/* Resend Code Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={countdown > 0}
                className="text-sm font-semibold text-primary-500 hover:text-primary-700 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? (
                  <>Resend code in {formatCountdown(countdown)}</>
                ) : (
                  <>Didn't receive? <span className="underline">Resend Code</span></>
                )}
              </button>
            </div>

            {/* Change Number Link */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setStep(1)
                  setOtp(['', '', '', '', '', ''])
                  setError('')
                  setCountdown(0)
                }}
                className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                ← Change Phone Number
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCompleteLogin} className="space-y-6">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <User className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>

            {/* Header */}
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Complete Your Profile</h1>
              <p className="text-base text-gray-600 dark:text-gray-400">Just a few more details to get started</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Full Name <span className="text-primary-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError('')
                  }}
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  style={{ outline: 'none' }}
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email Address <span className="text-primary-500">*</span>
              </label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  placeholder="john.doe@example.com"
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                  style={{ outline: 'none' }}
                  required
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading || !name.trim() || !email.trim()}
              className="w-full bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg disabled:hover:shadow-primary-500/30 flex items-center justify-center text-base"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Completing Profile...
                </span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Complete & Continue
                </>
              )}
            </button>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                By continuing, you agree to our Terms & Conditios!.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default Login
