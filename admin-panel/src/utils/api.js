import axios from 'axios'

// Get API base URL from environment variable
// Ensure it's properly formatted (no double slashes, ends with /api)
const getApiBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL
  
  // If environment variable is not set or contains the literal string, use default
  if (!envUrl || envUrl.includes('VITE_API_BASE_URL') || envUrl === 'VITE_API_BASE_URL') {
    console.warn('VITE_API_BASE_URL not properly configured, using default:', 'http://localhost:5000/api')
    return 'http://localhost:5000/api'
  }
  
  // Ensure URL ends with /api
  let baseURL = envUrl.trim()
  if (!baseURL.endsWith('/api')) {
    baseURL = baseURL.endsWith('/') ? `${baseURL}api` : `${baseURL}/api`
  }
  
  // Remove any double slashes (except after http:// or https://)
  baseURL = baseURL.replace(/([^:]\/)\/+/g, '$1')
  
  return baseURL
}

const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Log the base URL in development to help debug
if (import.meta.env.DEV) {
  console.log('API Base URL:', api.defaults.baseURL)
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage')
    if (token) {
      try {
        const parsed = JSON.parse(token)
        if (parsed.state?.token) {
          config.headers.Authorization = `Bearer ${parsed.state.token}`
        }
      } catch (e) {
        console.error('Error parsing token:', e)
      }
    }
    // Don't override Content-Type if it's FormData (for file uploads)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect on login endpoint — let the Login component handle the error
      const isLoginRequest =
        error.config?.url?.includes('/auth/admin/login') ||
        error.config?.url?.includes('/auth/organizer/login')

      if (!isLoginRequest) {
        localStorage.removeItem('auth-storage')
        // Respect Vite base (e.g. /admin/) and HashRouter
        const basePath = import.meta.env.BASE_URL || '/admin/'
        window.location.href = `${basePath}#/login`
      }
    }
    return Promise.reject(error)
  }
)

export default api

