import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ProtectedRoute from './components/common/ProtectedRoute'
import ToastContainer from './components/common/ToastContainer'
import Layout from './components/layout/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Users from './pages/users/Users'
import Organizers from './pages/organizers/Organizers'
import Events from './pages/events/Events'
import PendingEvents from './pages/events/PendingEvents'
import Categories from './pages/categories/Categories'
import Offers from './pages/offers/Offers'
import Sponsors from './pages/sponsors/Sponsors'
import Reports from './pages/reports/Reports'
import Settings from './pages/settings/Settings'

function App() {
  const { isAuthenticated, checkAuth, isCheckingAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Show loading screen while checking auth on initial load
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <>
      <ToastContainer />
      <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="organizers" element={<Organizers />} />
        <Route path="events" element={<Events />} />
        <Route path="events/pending" element={<PendingEvents />} />
        <Route path="categories" element={<Categories />} />
        <Route path="offers" element={<Offers />} />
        <Route path="sponsors" element={<Sponsors />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </>
  )
}

export default App

