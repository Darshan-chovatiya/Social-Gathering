import { useEffect, useState } from 'react'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import { Users, Calendar, Clock, TrendingUp, ArrowUpRight, Eye, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react'
import { format, subDays } from 'date-fns'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const COLORS = ['#d11e4f', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316']

// Enhanced Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-xl">
        <p className="font-semibold text-gray-900 mb-1.5 text-sm">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color || '#d11e4f' }}
            />
            <p className="text-sm font-medium text-gray-700">
              ₹{entry.value?.toLocaleString() || 0}
            </p>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// Bar Chart Component for Top Events
const TopEventsBarChart = ({ data }) => {
  if (!data || data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
      >
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d11e4f" stopOpacity={1} />
            <stop offset="100%" stopColor="#f47f9a" stopOpacity={0.9} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }}
          tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
          height={40}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }}
          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              const fullName = data.name
              return (
                <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-xl">
                  <p className="font-semibold text-gray-900 mb-1.5 text-sm">{fullName}</p>
                  {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: '#d11e4f' }}
                      />
                      <p className="text-sm font-medium text-gray-700">
                        ₹{entry.value?.toLocaleString() || 0}
                      </p>
                    </div>
                  ))}
                </div>
              )
            }
            return null
          }}
          cursor={{ fill: 'rgba(209, 30, 79, 0.1)' }}
        />
        <Bar
          dataKey="revenue"
          fill="url(#barGradient)"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

const Dashboard = () => {
  const { toast } = useToast()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    pendingEvents: 0,
    totalRevenue: 0,
  })
  const [dailyRevenue, setDailyRevenue] = useState([])
  const [categorySales, setCategorySales] = useState([])
  const [eventBookings, setEventBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const endDate = new Date()
      const startDate = subDays(endDate, 30)

      // Fetch stats
      const [usersRes, eventsRes, pendingRes, revenueRes] = await Promise.all([
        api.get('/admin/users?limit=1'),
        api.get('/admin/events?limit=1'),
        api.get('/admin/events/pending?limit=1'),
        api.get('/admin/reports/revenue', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }),
      ])

      // Fetch chart data
      const [categoryRes, bookingsRes] = await Promise.all([
        api.get('/admin/reports/category-wise-sales', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }),
        api.get('/admin/reports/event-wise-bookings', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }),
      ])

      setStats({
        totalUsers: usersRes.data.result?.pagination?.total || 0,
        totalEvents: eventsRes.data.result?.pagination?.total || 0,
        pendingEvents: pendingRes.data.result?.pagination?.total || 0,
        totalRevenue: revenueRes.data.result?.summary?.totalRevenue || 0,
      })

      // Format daily revenue data
      const revenueData = revenueRes.data.result?.dailyRevenue || []
      const formattedRevenue = revenueData.map((item) => ({
        date: format(new Date(item._id), 'MMM dd'),
        revenue: item.revenue || 0,
      }))
      setDailyRevenue(formattedRevenue)

      // Format category sales data
      const salesData = categoryRes.data.result?.sales || []
      const formattedSales = salesData.map((item) => ({
        name: item.categoryName || 'Unknown',
        value: item.totalRevenue || 0,
      }))
      setCategorySales(formattedSales)

      // Format top events data
      const bookingsData = bookingsRes.data.result?.bookings || []
      const formattedBookings = bookingsData
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 5)
        .map((item) => ({
          name: item.eventTitle?.length > 20 ? item.eventTitle.substring(0, 20) + '...' : item.eventTitle || 'Unknown',
          revenue: item.totalRevenue || 0,
        }))
      setEventBookings(formattedBookings)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Calculate percentage changes (mock data for now, can be replaced with actual calculations)
  const calculateChange = (current, previous = 0) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%'
    const change = ((current - previous) / previous) * 100
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-600',
      iconBg: 'bg-primary-100',
      change: calculateChange(stats.totalUsers, stats.totalUsers * 0.88),
      changeType: 'positive',
      link: '/users',
    },
    {
      title: 'Total Events',
      value: stats.totalEvents,
      icon: Calendar,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      change: calculateChange(stats.totalEvents, stats.totalEvents * 0.92),
      changeType: 'positive',
      link: '/events',
    },
    {
      title: 'Pending Events',
      value: stats.pendingEvents,
      icon: Clock,
      bgColor: stats.pendingEvents > 0 ? 'bg-amber-50' : 'bg-emerald-50',
      iconColor: stats.pendingEvents > 0 ? 'text-amber-600' : 'text-emerald-600',
      iconBg: stats.pendingEvents > 0 ? 'bg-amber-100' : 'bg-emerald-100',
      change: stats.pendingEvents > 0 ? 'Requires attention' : 'All clear',
      changeType: stats.pendingEvents > 0 ? 'warning' : 'positive',
      link: '/events/pending',
    },
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      change: calculateChange(stats.totalRevenue, stats.totalRevenue * 0.76),
      changeType: 'positive',
      link: '/reports',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Overview of your platform</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Last updated: {format(new Date(), 'MMM dd, yyyy')}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <a
              key={index}
              href={stat.link}
              className="bg-white rounded-lg p-5 border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200 group block"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {stat.value}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {stat.changeType === 'positive' ? (
                      <>
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-medium text-emerald-600">
                          {stat.change}
                        </span>
                      </>
                    ) : stat.changeType === 'warning' ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <span className="text-xs font-medium text-amber-600">
                          {stat.change}
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs font-medium text-emerald-600">
                          {stat.change}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className={`${stat.iconBg} p-2.5 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
            </a>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Revenue Trend</h2>
              <p className="text-xs text-gray-500 mt-0.5">Last 30 days</p>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Growing</span>
            </div>
          </div>
          {dailyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dailyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d11e4f" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#d11e4f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d11e4f', strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  fill="url(#revenueGradient)"
                  stroke="#d11e4f"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#d11e4f', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[260px] text-gray-400">
              <TrendingUp className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No revenue data available</p>
            </div>
          )}
        </div>

        {/* Category Sales Distribution */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Sales by Category</h2>
              <p className="text-xs text-gray-500 mt-0.5">Revenue distribution</p>
            </div>
            <Eye className="w-4 h-4 text-gray-400" />
          </div>
          {categorySales.length > 0 ? (() => {
            const sortedCategoryData = [...categorySales].sort((a, b) => b.value - a.value)
            return (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={sortedCategoryData}
                  margin={{ top: 5, right: 10, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }}
                    tickFormatter={(value) => value.length > 12 ? `${value.substring(0, 12)}...` : value}
                    height={40}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 500 }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        const fullName = data.name
                        const dataIndex = sortedCategoryData.findIndex(cat => cat.name === fullName)
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-xl">
                            <p className="font-semibold text-gray-900 mb-1.5 text-sm">{fullName}</p>
                            {payload.map((entry, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: COLORS[dataIndex >= 0 ? dataIndex % COLORS.length : 0] }}
                                />
                                <p className="text-sm font-medium text-gray-700">
                                  ₹{entry.value?.toLocaleString() || 0}
                                </p>
                              </div>
                            ))}
                          </div>
                        )
                      }
                      return null
                    }}
                    cursor={{ fill: 'rgba(209, 30, 79, 0.1)' }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                  >
                    {sortedCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )
          })() : (
            <div className="flex flex-col items-center justify-center h-[260px] text-gray-400">
              <Eye className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No category sales data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Events Bar Chart */}
      <div className="bg-white rounded-lg p-5 border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Top Events by Revenue</h2>
            <p className="text-xs text-gray-500 mt-0.5">Best performing events</p>
          </div>
          <div className="text-xs text-gray-500">
            Top {eventBookings.length} events
          </div>
        </div>
        {eventBookings.length > 0 ? (
          <TopEventsBarChart data={eventBookings} />
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
            <TrendingUp className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">No event booking data available</p>
          </div>
        )}
      </div>

      {/* Category Performance Table */}
      {categorySales.length > 0 && (
        <div className="bg-white rounded-lg p-5 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Category Performance</h2>
              <p className="text-xs text-gray-500 mt-0.5">Detailed breakdown</p>
            </div>
            <a href="/categories" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              View all →
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Category</th>
                  <th className="text-right py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Revenue</th>
                  <th className="text-right py-2.5 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wider">Share</th>
                </tr>
              </thead>
              <tbody>
                {categorySales
                  .sort((a, b) => b.value - a.value)
                  .map((category, index) => {
                    const totalRevenue = categorySales.reduce((sum, c) => sum + c.value, 0)
                    const share = ((category.value / totalRevenue) * 100).toFixed(1)
                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium text-gray-900 text-sm">{category.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="font-semibold text-gray-900 text-sm">₹{category.value.toLocaleString()}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${share}%`,
                                  backgroundColor: COLORS[index % COLORS.length],
                                }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-gray-600 w-10 text-left">{share}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
