// Theme store simplified - no dark mode needed
// Keeping for potential future use or can be removed if not needed
import { create } from 'zustand'

const useThemeStore = create(() => ({
  theme: 'light', // Always light theme
}))

export { useThemeStore }

