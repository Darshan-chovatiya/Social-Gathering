import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useThemeStore } from './store/themeStore'
import ProtectedRoute from './components/common/ProtectedRoute'
import ToastContainer from './components/common/ToastContainer'
import Layout from './components/layout/Layout'
import Loading from './components/common/Loading'
import BannerSlider from './components/common/BannerSlider'
import UpcomingEvents from './components/common/UpcomingEvents'

// Import pages
import Explore from './pages/Explore'
import AboutUs from './pages/AboutUs'
import EventDetail from './pages/EventDetail'
import BookingFlow from './pages/BookingFlow'
import BookingSummary from './pages/BookingSummary'
import BookingHistory from './pages/BookingHistory'
import BookingConfirmation from './pages/BookingConfirmation'
import TicketDownload from './pages/TicketDownload'
import AffiliateLinks from './pages/AffiliateLinks'
import Settings from './pages/Settings'
import SponsorDetail from './pages/SponsorDetail'
import AllSponsors from './pages/AllSponsors'
import PaymentVerify from './pages/PaymentVerify'
import Notifications from './pages/Notifications'
import FarmhouseListing from './pages/FarmhouseListing'
import FarmhouseDetail from './pages/FarmhouseDetail'
import FarmhouseBookingSummary from './pages/FarmhouseBookingSummary'
import FarmhouseBookingConfirmation from './pages/FarmhouseBookingConfirmation'
import BanquetListing from './pages/BanquetListing'
import BanquetDetail from './pages/BanquetDetail'
import Dashboard from './pages/Dashboard'
import SearchResults from './pages/SearchResults'

// Import Login page
import Login from './pages/Login'
import { getEventDetailPath } from './utils/eventUrl'


// Component to handle redirect after login
const LoginRedirect = () => {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
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

    // Check for returnUrl from location state
    const returnUrl = location.state?.from
    if (returnUrl && returnUrl !== '/') {
      navigate(returnUrl, { replace: true })
      return
    }

    // Default to dashboard if no specific redirect
    navigate('/dashboard', { replace: true })
  }, [navigate, location])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <Loading size="lg" text="Redirecting..." />
    </div>
  )
}

const Movies = () => <div className="p-6"><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Movies - Coming Soon</h1></div>
const Stream = () => <div className="p-6"><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Stream - Coming Soon</h1></div>
// Events page - redirects to first event's detail page
const Plays = () => <div className="p-6"><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Plays - Coming Soon</h1></div>
const Sports = () => <div className="p-6"><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sports - Coming Soon</h1></div>
const Activities = () => <div className="p-6"><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Activities - Coming Soon</h1></div>
const ListShow = () => <div className="p-6"><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">List Your Show - Coming Soon</h1></div>
const Corporates = () => <div className="p-6"><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Corporates - Coming Soon</h1></div>
const Offers = () => <div className="p-6"><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Offers - Coming Soon</h1></div>
const GiftCards = () => <div className="p-6"><h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gift Cards - Coming Soon</h1></div>

function App() {
  const { isAuthenticated, checkAuth, isCheckingAuth, user } = useAuthStore()
  const { theme } = useThemeStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Ensure theme is applied and synced - this is critical for dark mode
  useEffect(() => {
    const root = document.documentElement

    // Force remove dark class first
    root.classList.remove('dark')

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

    // Double-check after a short delay
    setTimeout(() => {
      if (theme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }, 0)
  }, [theme])

  // Show loading screen while checking auth on initial load
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loading size="lg" text="Loading..." />
      </div>
    )
  }

  return (
    <>
      <ToastContainer />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated && user?.name && user?.email ? (
              <LoginRedirect />
            ) : (
              <Login />
            )
          }
        />

        {/* Booking Flow Routes - Outside Layout */}
        <Route path="events/:id/booking-flow" element={<BookingFlow />} />
        <Route path="events/:id/booking-summary" element={<BookingSummary />} />
        <Route path="events/:organizerSlug/:id/booking-flow" element={<BookingFlow />} />
        <Route path="events/:organizerSlug/:id/booking-summary" element={<BookingSummary />} />
        <Route path="bookings/:bookingId/confirmation" element={<BookingConfirmation />} />
        <Route path="tickets/:bookingId/download" element={<TicketDownload />} />
        <Route path="payment/verify" element={<PaymentVerify />} />
        <Route path="farmhouses/:id/booking-summary" element={<FarmhouseBookingSummary />} />
        <Route path="farmhouses/bookings/:bookingId/confirmation" element={<FarmhouseBookingConfirmation />} />

        <Route path="/" element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="search" element={<SearchResults />} />
          <Route path="explore" element={<Explore />} />
          <Route path="about" element={<AboutUs />} />
          <Route path="events/:id" element={<EventDetail />} />
          <Route path="events/:organizerSlug/:id" element={<EventDetail />} />
          <Route path="events/:eventId/sponsors" element={<AllSponsors />} />
          <Route path="sponsors/:id" element={<SponsorDetail />} />
          <Route path="movies" element={<Movies />} />
          <Route path="farmhouses" element={<FarmhouseListing />} />
          <Route path="farmhouses/:id" element={<FarmhouseDetail />} />
          <Route path="banquets" element={<BanquetListing />} />
          <Route path="banquets/:id" element={<BanquetDetail />} />
          <Route path="stream" element={<Stream />} />
          <Route path="events" element={<Explore />} />
          <Route path="plays" element={<Plays />} />
          <Route path="sports" element={<Sports />} />
          <Route path="activities" element={<Activities />} />
          <Route path="list-show" element={<ListShow />} />
          <Route path="corporates" element={<Corporates />} />
          <Route path="offers" element={<Offers />} />
          <Route path="gift-cards" element={<GiftCards />} />
          <Route
            path="notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={<Dashboard />}
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="bookings"
            element={
              <ProtectedRoute>
                <BookingHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="affiliate-links"
            element={
              <ProtectedRoute>
                <AffiliateLinks />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
