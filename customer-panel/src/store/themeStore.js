import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Apply theme to document
const applyTheme = (theme) => {
  if (typeof document === 'undefined') return
  
  const root = document.documentElement
  
  // Force remove and add to ensure it's applied
  root.classList.remove('dark', 'light')
  
  if (theme === 'dark') {
    root.classList.add('dark')
    root.style.colorScheme = 'dark'
    root.setAttribute('data-theme', 'dark')
  } else {
    root.classList.remove('dark')
    root.style.colorScheme = 'light'
    root.setAttribute('data-theme', 'light')
  }
  
  // Force a reflow to ensure styles are applied
  void root.offsetHeight
}

// Get initial theme from localStorage or default to 'dark'
// Only uses user-selected theme - no system preference detection
const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark'
  
  try {
    const stored = localStorage.getItem('theme-storage')
    if (stored) {
      const parsed = JSON.parse(stored)
      const theme = parsed.state?.theme
      if (theme === 'dark' || theme === 'light') {
        return theme
      }
    }
  } catch (e) {
    console.error('Error reading theme from storage:', e)
  }
  
  // Default to dark mode if no user selection found
  return 'dark'
}

// Get and apply initial theme immediately
const initialTheme = getInitialTheme()
applyTheme(initialTheme)

const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: initialTheme,
      
      toggleTheme: () => {
        const currentTheme = get().theme
        const newTheme = currentTheme === 'light' ? 'dark' : 'light'
        
        // Apply theme immediately - multiple times to ensure it sticks
        applyTheme(newTheme)
        
        // Update state - this will trigger re-renders
        set({ theme: newTheme })
        
        // Double-check after state update
        setTimeout(() => {
          applyTheme(newTheme)
        }, 0)
        
        // Triple-check after a short delay
        setTimeout(() => {
          applyTheme(newTheme)
        }, 10)
      },
      
      setTheme: (newTheme) => {
        if (newTheme === 'dark' || newTheme === 'light') {
          // Apply theme immediately to DOM
          applyTheme(newTheme)
          // Update state - this will trigger re-renders and persist
          set({ theme: newTheme })
          // Double-check theme is applied (in case of race conditions)
          requestAnimationFrame(() => {
            applyTheme(newTheme)
          })
        }
      },
    }),
    {
      name: 'theme-storage',
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        // Apply theme on rehydration - this happens after localStorage is read
        if (state?.theme) {
          // Use setTimeout to ensure DOM is ready
          setTimeout(() => {
            applyTheme(state.theme)
          }, 0)
          // Also apply immediately
          applyTheme(state.theme)
        } else {
          // Always default to dark mode if no theme found
          const defaultTheme = 'dark'
          applyTheme(defaultTheme)
          if (state) {
            state.theme = defaultTheme
          }
        }
      },
    }
  )
)

export { useThemeStore }
