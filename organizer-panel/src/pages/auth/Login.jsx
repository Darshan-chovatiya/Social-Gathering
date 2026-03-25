import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Mail, Lock, Eye, EyeOff, Calendar } from 'lucide-react'

const Login = () => {
  const navigate = useNavigate()
  const { login, isLoading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Validate email format
  const validateEmail = (emailValue) => {
    if (!emailValue) {
      return 'Email is required'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailValue)) {
      return 'Please enter a valid email address'
    }
    return ''
  }

  // Validate password
  const validatePassword = (passwordValue) => {
    if (!passwordValue) {
      return 'Password is required'
    }
    if (passwordValue.length < 6) {
      return 'Password must be at least 6 characters long'
    }
    return ''
  }

  const handleEmailChange = (e) => {
    const value = e.target.value
    setEmail(value)
    setError('') // Clear general error when user types
    setEmailError('') // Clear email error when user types
  }

  const handlePasswordChange = (e) => {
    const value = e.target.value
    setPassword(value)
    setError('') // Clear general error when user types
    setPasswordError('') // Clear password error when user types
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Clear previous errors
    setError('')
    setEmailError('')
    setPasswordError('')
    
    // Validate email
    const emailValidationError = validateEmail(email)
    if (emailValidationError) {
      setEmailError(emailValidationError)
      return
    }
    
    // Validate password
    const passwordValidationError = validatePassword(password)
    if (passwordValidationError) {
      setPasswordError(passwordValidationError)
      return
    }

    try {
      const response = await login(email.trim(), password)
      if (response.success) {
        navigate('/dashboard', { replace: true })
      } else {
        // Handle specific error messages from backend
        const errorMessage = response.message || 'Login failed'
        setError(errorMessage)
      }
    } catch (err) {
      console.error('Login error:', err)
      // Handle different types of errors
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.response?.status === 401) {
        setError('Invalid email or password. Please check your credentials and try again.')
      } else if (err.response?.status === 403) {
        setError(err.response.data?.message || 'Access denied. Please contact administrator.')
      } else if (err.response?.status === 400) {
        setError(err.response.data?.message || 'Invalid request. Please check your input.')
      } else if (err.response?.status === 404) {
        setError('User not found. Please check your email address.')
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.')
      } else {
        setError('Login failed. Please check your connection and try again.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-soft"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 sm:p-10 border border-gray-200/60 animate-fade-in">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 mb-4 shadow-xl shadow-primary-500/30 transform hover:scale-105 transition-transform duration-200">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-2 font-sans">
              Easy Tickets
            </h1>
            <p className="text-sm text-gray-600 mt-1 font-sans font-medium">Organizer Portal</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 text-sm font-sans animate-fade-in shadow-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2.5 font-sans">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => {
                    if (email) {
                      const emailValidationError = validateEmail(email)
                      setEmailError(emailValidationError)
                    }
                  }}
                  placeholder="organizer@example.com"
                  className={`w-full px-4 py-3.5 pl-12 border rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 transition-all duration-200 font-sans hover:border-gray-400 shadow-sm ${
                    emailError 
                      ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-primary-500/20 focus:border-primary-500'
                  }`}
                  required
                  autoFocus
                />
              </div>
              {emailError && (
                <p className="mt-1.5 text-sm text-red-600 font-sans">{emailError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2.5 font-sans">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => {
                    if (password) {
                      const passwordValidationError = validatePassword(password)
                      setPasswordError(passwordValidationError)
                    }
                  }}
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3.5 pl-12 pr-12 border rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 transition-all duration-200 font-sans hover:border-gray-400 shadow-sm ${
                    passwordError 
                      ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-primary-500/20 focus:border-primary-500'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1.5 text-sm text-red-600 font-sans">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password || !!emailError || !!passwordError}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 active:from-primary-800 active:to-primary-900 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0 font-sans"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login

