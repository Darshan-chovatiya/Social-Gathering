import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isCheckingAuth: true, // Track if we're still checking auth on initial load

      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true, isCheckingAuth: false })
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, isCheckingAuth: false })
        delete api.defaults.headers.common['Authorization']
        localStorage.removeItem('auth-storage')
      },

      checkAuth: async () => {
        set({ isCheckingAuth: true })
        const { token, user } = get()
        
        // If we have token and user from persisted storage, set authenticated immediately
        if (token && user) {
          set({ isAuthenticated: true })
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        }
        
        if (!token) {
          set({ isAuthenticated: false, isCheckingAuth: false })
          return
        }

        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await api.get('/auth/me')
          if (response.data.status === 200) {
            set({
              user: response.data.result.user,
              isAuthenticated: true,
              isCheckingAuth: false,
            })
          } else {
            get().logout()
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          get().logout()
        }
      },

      login: async (mobile, otp) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/login', { mobile, otp })
          
          if (response.data.status === 200) {
            const { user, token } = response.data.result
            get().setAuth(user, token)
            set({ isLoading: false })
            return { success: true }
          } else {
            set({ isLoading: false })
            return { success: false, message: response.data.message }
          }
        } catch (error) {
          set({ isLoading: false })
          return {
            success: false,
            message: error.response?.data?.message || 'Login failed',
          }
        }
      },

      sendOTP: async (mobile) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/send-otp', { mobile })
          set({ isLoading: false })
          if (response.data.status === 200) {
            return { success: true, message: response.data.message }
          } else {
            return { success: false, message: response.data.message }
          }
        } catch (error) {
          set({ isLoading: false })
          return {
            success: false,
            message: error.response?.data?.message || 'Failed to send OTP',
          }
        }
      },

      verifyOTP: async (mobile, otp, name, email) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/verify-otp', { mobile, otp, name, email })
          set({ isLoading: false })
          if (response.data.status === 200) {
            const { user, token } = response.data.result
            get().setAuth(user, token)
            return { success: true, message: response.data.message }
          } else {
            return { success: false, message: response.data.message }
          }
        } catch (error) {
          set({ isLoading: false })
          return {
            success: false,
            message: error.response?.data?.message || 'Failed to verify OTP',
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, set isAuthenticated based on persisted token/user
        if (state?.token && state?.user) {
          state.isAuthenticated = true
          state.isCheckingAuth = false
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        } else {
          state.isAuthenticated = false
          state.isCheckingAuth = false
        }
      },
    }
  )
)

export { useAuthStore }

