import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import * as XLSX from 'xlsx'
import { 
  BarChart3, 
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  Filter,
  Download
} from 'lucide-react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'

const Reports = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  })
  const [revenue, setRevenue] = useState(null)
  const [eventBookings, setEventBookings] = useState([])
  const [categorySales, setCategorySales] = useState([])
  const [userEngagement, setUserEngagement] = useState([])

  useEffect(() => {
    fetchReports()
  }, [dateRange])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = {
        startDate: dateRange.startDate ? startOfDay(new Date(dateRange.startDate)).toISOString() : undefined,
        endDate: dateRange.endDate ? endOfDay(new Date(dateRange.endDate)).toISOString() : undefined,
      }

      const [revenueRes, bookingsRes, categoryRes, engagementRes] = await Promise.all([
        api.get('/admin/reports/revenue', { params }),
        api.get('/admin/reports/event-wise-bookings', { params }),
        api.get('/admin/reports/category-wise-sales', { params }),
        api.get('/admin/reports/user-engagement', { params }),
      ])

      if (revenueRes.data.status === 200) {
        setRevenue(revenueRes.data.result)
      }
      if (bookingsRes.data.status === 200) {
        setEventBookings(bookingsRes.data.result.bookings || [])
      }
      if (categoryRes.data.status === 200) {
        setCategorySales(categoryRes.data.result.sales || [])
      }
      if (engagementRes.data.status === 200) {
        setUserEngagement(engagementRes.data.result.engagement || [])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }

  const revenueSummary = revenue?.summary || {
    totalRevenue: 0,
    totalTransactions: 0,
    averageTransaction: 0,
  }

  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new()

      // Sheet 1: Revenue Summary
      const revenueData = [
        ['REVENUE SUMMARY REPORT'],
        [''],
        ['Report Generated On', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
        ['Date Range', `${dateRange.startDate} to ${dateRange.endDate}`],
        [''],
        ['SUMMARY'],
        ['Total Revenue (₹)', revenueSummary.totalRevenue],
        ['Total Transactions', revenueSummary.totalTransactions],
        ['Average Transaction (₹)', revenueSummary.averageTransaction.toFixed(2)],
        [''],
      ]
      
      // Add totals row
      const totalRevenue = eventBookings.reduce((sum, b) => sum + (b.totalRevenue || 0), 0)
      const totalBookings = eventBookings.reduce((sum, b) => sum + (b.totalBookings || 0), 0)
      const totalTickets = eventBookings.reduce((sum, b) => sum + (b.totalTickets || 0), 0)
      
      revenueData.push(['AGGREGATED TOTALS'])
      revenueData.push(['Total Event Revenue (₹)', totalRevenue])
      revenueData.push(['Total Bookings', totalBookings])
      revenueData.push(['Total Tickets Sold', totalTickets])
      
      const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData)
      XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue Summary')

      // Sheet 2: Daily Revenue Breakdown
      if (revenue?.dailyRevenue && revenue.dailyRevenue.length > 0) {
        const dailyRevenueData = [
          ['Date', 'Revenue (₹)', 'Transactions']
        ]
        let dailyTotalRevenue = 0
        let dailyTotalTransactions = 0
        
        revenue.dailyRevenue.forEach(day => {
          dailyRevenueData.push([
            day._id || 'N/A',
            day.revenue || 0,
            day.transactions || 0
          ])
          dailyTotalRevenue += day.revenue || 0
          dailyTotalTransactions += day.transactions || 0
        })
        
        // Add totals row
        dailyRevenueData.push([''])
        dailyRevenueData.push(['TOTAL', dailyTotalRevenue, dailyTotalTransactions])
        
        const dailyRevenueSheet = XLSX.utils.aoa_to_sheet(dailyRevenueData)
        XLSX.utils.book_append_sheet(workbook, dailyRevenueSheet, 'Daily Revenue')
      }

      // Sheet 3: Event-wise Bookings (Detailed)
      if (eventBookings.length > 0) {
        const eventBookingsData = [
          ['#', 'Event ID', 'Event Name', 'Total Bookings', 'Total Tickets', 'Revenue (₹)', 'Avg Revenue per Booking (₹)', 'Avg Tickets per Booking', 'Revenue % of Total']
        ]
        let eventTotalBookings = 0
        let eventTotalTickets = 0
        let eventTotalRevenue = 0
        
        // Calculate total revenue first for percentage calculation
        eventTotalRevenue = eventBookings.reduce((sum, b) => sum + (b.totalRevenue || 0), 0)
        eventTotalBookings = eventBookings.reduce((sum, b) => sum + (b.totalBookings || 0), 0)
        eventTotalTickets = eventBookings.reduce((sum, b) => sum + (b.totalTickets || 0), 0)
        
        // Sort by revenue descending for ranking
        const sortedBookings = [...eventBookings].sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
        
        sortedBookings.forEach((booking, index) => {
          const avgRevenue = booking.totalBookings > 0 
            ? (booking.totalRevenue / booking.totalBookings).toFixed(2) 
            : 0
          const avgTickets = booking.totalBookings > 0 
            ? (booking.totalTickets / booking.totalBookings).toFixed(2) 
            : 0
          const revenuePercentage = eventTotalRevenue > 0 
            ? ((booking.totalRevenue / eventTotalRevenue) * 100).toFixed(2) + '%'
            : '0%'
          
          eventBookingsData.push([
            index + 1, // Rank
            booking.eventId || 'N/A',
            booking.eventTitle || 'N/A',
            booking.totalBookings || 0,
            booking.totalTickets || 0,
            booking.totalRevenue || 0,
            avgRevenue,
            avgTickets,
            revenuePercentage
          ])
        })
        
        // Add separator and totals row
        eventBookingsData.push([''])
        eventBookingsData.push(['TOTAL', '', '', eventTotalBookings, eventTotalTickets, eventTotalRevenue, '', '', '100%'])
        
        // Add summary statistics
        eventBookingsData.push([''])
        eventBookingsData.push(['SUMMARY STATISTICS'])
        eventBookingsData.push(['Total Events', eventBookings.length])
        eventBookingsData.push(['Total Bookings', eventTotalBookings])
        eventBookingsData.push(['Total Tickets Sold', eventTotalTickets])
        eventBookingsData.push(['Total Revenue (₹)', eventTotalRevenue])
        eventBookingsData.push(['Average Bookings per Event', (eventTotalBookings / eventBookings.length).toFixed(2)])
        eventBookingsData.push(['Average Tickets per Event', (eventTotalTickets / eventBookings.length).toFixed(2)])
        eventBookingsData.push(['Average Revenue per Event (₹)', (eventTotalRevenue / eventBookings.length).toFixed(2)])
        eventBookingsData.push(['Average Revenue per Booking (₹)', eventTotalBookings > 0 ? (eventTotalRevenue / eventTotalBookings).toFixed(2) : 0])
        eventBookingsData.push(['Average Tickets per Booking', eventTotalBookings > 0 ? (eventTotalTickets / eventTotalBookings).toFixed(2) : 0])
        
        const eventBookingsSheet = XLSX.utils.aoa_to_sheet(eventBookingsData)
        XLSX.utils.book_append_sheet(workbook, eventBookingsSheet, 'Event Bookings')
      }

      // Sheet 4: Category-wise Sales (Detailed)
      if (categorySales.length > 0) {
        const categorySalesData = [
          ['#', 'Category ID', 'Category Name', 'Total Bookings', 'Total Tickets', 'Revenue (₹)', 'Avg Revenue per Booking (₹)', 'Avg Tickets per Booking', 'Revenue % of Total']
        ]
        let categoryTotalBookings = 0
        let categoryTotalTickets = 0
        let categoryTotalRevenue = 0
        
        // Calculate total revenue first for percentage calculation
        categoryTotalRevenue = categorySales.reduce((sum, s) => sum + (s.totalRevenue || 0), 0)
        categoryTotalBookings = categorySales.reduce((sum, s) => sum + (s.totalBookings || 0), 0)
        categoryTotalTickets = categorySales.reduce((sum, s) => sum + (s.totalTickets || 0), 0)
        
        // Sort by revenue descending for ranking
        const sortedSales = [...categorySales].sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
        
        sortedSales.forEach((sale, index) => {
          const avgRevenue = sale.totalBookings > 0 
            ? (sale.totalRevenue / sale.totalBookings).toFixed(2) 
            : 0
          const avgTickets = sale.totalBookings > 0 
            ? (sale.totalTickets / sale.totalBookings).toFixed(2) 
            : 0
          const revenuePercentage = categoryTotalRevenue > 0 
            ? ((sale.totalRevenue / categoryTotalRevenue) * 100).toFixed(2) + '%'
            : '0%'
          
          categorySalesData.push([
            index + 1, // Rank
            sale.categoryId || 'N/A',
            sale.categoryName || 'N/A',
            sale.totalBookings || 0,
            sale.totalTickets || 0,
            sale.totalRevenue || 0,
            avgRevenue,
            avgTickets,
            revenuePercentage
          ])
        })
        
        // Add separator and totals row
        categorySalesData.push([''])
        categorySalesData.push(['TOTAL', '', '', categoryTotalBookings, categoryTotalTickets, categoryTotalRevenue, '', '', '100%'])
        
        // Add summary statistics
        categorySalesData.push([''])
        categorySalesData.push(['SUMMARY STATISTICS'])
        categorySalesData.push(['Total Categories', categorySales.length])
        categorySalesData.push(['Total Bookings', categoryTotalBookings])
        categorySalesData.push(['Total Tickets Sold', categoryTotalTickets])
        categorySalesData.push(['Total Revenue (₹)', categoryTotalRevenue])
        categorySalesData.push(['Average Bookings per Category', (categoryTotalBookings / categorySales.length).toFixed(2)])
        categorySalesData.push(['Average Tickets per Category', (categoryTotalTickets / categorySales.length).toFixed(2)])
        categorySalesData.push(['Average Revenue per Category (₹)', (categoryTotalRevenue / categorySales.length).toFixed(2)])
        categorySalesData.push(['Average Revenue per Booking (₹)', categoryTotalBookings > 0 ? (categoryTotalRevenue / categoryTotalBookings).toFixed(2) : 0])
        categorySalesData.push(['Average Tickets per Booking', categoryTotalBookings > 0 ? (categoryTotalTickets / categoryTotalBookings).toFixed(2) : 0])
        
        const categorySalesSheet = XLSX.utils.aoa_to_sheet(categorySalesData)
        XLSX.utils.book_append_sheet(workbook, categorySalesSheet, 'Category Sales')
      }

      // Sheet 5: User Engagement (All Users - Not Limited)
      if (userEngagement.length > 0) {
        const userEngagementData = [
          ['User Name', 'Email', 'Total Bookings', 'Total Spent (₹)', 'Avg Spent per Booking (₹)']
        ]
        let userTotalBookings = 0
        let userTotalSpent = 0
        
        // Export ALL users, not just top 20
        userEngagement.forEach(user => {
          const avgSpent = user.totalBookings > 0 
            ? (user.totalSpent / user.totalBookings).toFixed(2) 
            : 0
          
          userEngagementData.push([
            user.userName || 'N/A',
            user.userEmail || 'N/A',
            user.totalBookings || 0,
            user.totalSpent || 0,
            avgSpent
          ])
          
          userTotalBookings += user.totalBookings || 0
          userTotalSpent += user.totalSpent || 0
        })
        
        // Add totals row
        userEngagementData.push([''])
        userEngagementData.push(['TOTAL', '', userTotalBookings, userTotalSpent, ''])
        
        // Add summary
        userEngagementData.push([''])
        userEngagementData.push(['SUMMARY'])
        userEngagementData.push(['Total Users', userEngagement.length])
        userEngagementData.push(['Total Bookings', userTotalBookings])
        userEngagementData.push(['Total Revenue from Users (₹)', userTotalSpent])
        userEngagementData.push(['Average Bookings per User', (userTotalBookings / userEngagement.length).toFixed(2)])
        userEngagementData.push(['Average Spent per User (₹)', (userTotalSpent / userEngagement.length).toFixed(2)])
        
        const userEngagementSheet = XLSX.utils.aoa_to_sheet(userEngagementData)
        XLSX.utils.book_append_sheet(workbook, userEngagementSheet, 'User Engagement')
      }

      // Generate filename with date range
      const filename = `Revenue_Report_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`
      
      // Write and download
      XLSX.writeFile(workbook, filename)
      toast.success('Report exported successfully with all details')
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error('Failed to export report')
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base font-medium">View platform analytics and insights</p>
      </div>

      {/* Date Range Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchReports} className="btn-primary flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Apply Filter
            </button>
            <button 
              onClick={exportToExcel} 
              disabled={loading}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          {/* Revenue Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    ₹{revenueSummary.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {revenueSummary.totalTransactions}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Transaction</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    ₹{revenueSummary.averageTransaction.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Event-wise Bookings */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Event-wise Bookings</h2>
            {eventBookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No bookings found for the selected period</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Event</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Bookings</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Tickets</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventBookings.map((booking, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{booking.eventTitle || 'N/A'}</p>
                        </td>
                        <td className="py-3 px-4 text-right">{booking.totalBookings}</td>
                        <td className="py-3 px-4 text-right">{booking.totalTickets}</td>
                        <td className="py-3 px-4 text-right font-semibold">
                          ₹{booking.totalRevenue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Category-wise Sales */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Category-wise Sales</h2>
            {categorySales.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No sales found for the selected period</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorySales.map((sale, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{sale.categoryName}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bookings:</span>
                        <span className="font-medium">{sale.totalBookings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tickets:</span>
                        <span className="font-medium">{sale.totalTickets}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-200">
                        <span className="text-gray-600">Revenue:</span>
                        <span className="font-semibold text-primary-600">
                          ₹{sale.totalRevenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Engagement */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Users by Engagement</h2>
            {userEngagement.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No user engagement data found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">User</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Email</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Bookings</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userEngagement.slice(0, 20).map((user, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{user.userName || 'N/A'}</p>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{user.userEmail || 'N/A'}</td>
                        <td className="py-3 px-4 text-right">{user.totalBookings}</td>
                        <td className="py-3 px-4 text-right font-semibold">
                          ₹{user.totalSpent.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Reports
