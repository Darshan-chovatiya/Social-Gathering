import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

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
      // Don't redirect on login endpoint - let the Login component handle the error
      const isLoginRequest = error.config?.url?.includes('/auth/organizer/login') || 
                            error.config?.url?.includes('/auth/admin/login')
      
      if (!isLoginRequest) {
        // Unauthorized - clear auth and redirect to login (but not for login requests)
        localStorage.removeItem('auth-storage')
        // Use hash router compatible path
        const basePath = import.meta.env.BASE_URL || '/organizer/'
        window.location.href = `${basePath}#/login`
      }
    }
    return Promise.reject(error)
  }
)

// Scan ticket function
export const scanTicket = async (bookingId) => {
  try {
    const response = await api.post('/organizer/scan-ticket', { bookingId })
    return response.data
  } catch (error) {
    throw error
  }
}

// Get scanned tickets function
export const getScannedTickets = async (page = 1, limit = 20, eventId = null) => {
  try {
    const params = { page, limit }
    if (eventId) {
      params.eventId = eventId
    }
    const response = await api.get('/organizer/scanned-tickets', { params })
    return response.data
  } catch (error) {
    throw error
  }
}

export default api

