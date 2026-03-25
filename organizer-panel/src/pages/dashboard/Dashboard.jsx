import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import { Calendar, Users, DollarSign, TrendingUp, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'

const Dashboard = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingItems: 0,
  })
  const [recentEvents, setRecentEvents] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const [eventsRes, reportRes] = await Promise.all([
        api.get('/organizer/events?limit=100'),
        api.get('/organizer/reports/revenue'),
      ])

      const events = eventsRes.data.result?.events || []
      const totalEvents = events.length
      const activeEvents = events.filter((e) => e.status === 'approved' && e.isActive).length
      const pendingItems = events.filter((e) => e.status === 'pending').length

      let totalBookings = 0
      let totalRevenue = 0
      if (reportRes.data.status === 200) {
        totalRevenue = reportRes.data.result?.summary?.totalRevenue || 0
        totalBookings = reportRes.data.result?.summary?.totalTransactions || 0
      }

      setStats({
        totalEvents,
        activeEvents,
        totalBookings,
        totalRevenue,
        pendingItems,
      })
      setRecentEvents(events.slice(0, 5))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loading size="lg" text="Loading dashboard..." />
  }

  const statCards = [
    {
      title: 'Total Events',
      value: stats.totalEvents,
      icon: Calendar,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      path: '/events',
    },
    {
      title: 'Active Events',
      value: stats.activeEvents,
      icon: TrendingUp,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      path: '/events',
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Users,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      path: '/bookings',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-600',
      path: '/reports',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back! Here&apos;s your overview</p>
        </div>
        <div className="text-xs text-gray-500">
          Last updated: {format(new Date(), 'MMM d, yyyy HH:mm')}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              onClick={() => navigate(stat.path)}
              className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`${stat.bgColor} p-2.5 rounded-xl`}>
                  <Icon className={`w-5 h-5 ${stat.textColor}`} />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-0.5">{stat.value}</h3>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-black">{stat.title}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Recent Events</h2>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
              Latest listing updates
            </p>
          </div>
          <Link to="/events" className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Link>
        </div>

        {recentEvents.length > 0 ? (
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div
                key={event._id}
                className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/events/edit/${event._id}`)}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm truncate uppercase">{event.title}</h3>
                  <p className="text-[10px] text-gray-500 font-medium">
                    {format(new Date(event.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                    event.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : event.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest">No Events Found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
