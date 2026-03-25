import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../../components/common/ToastContainer'
import Loading from '../../components/common/Loading'
import { BarChart3, DollarSign, Calendar, TrendingUp, Download } from 'lucide-react'
import { format } from 'date-fns'
import * as XLSX from 'xlsx'

const Reports = () => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [revenueSummary, setRevenueSummary] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    averageTransaction: 0,
  })
  const [eventBookings, setEventBookings] = useState([])

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)

      const [revenueResponse, bookingsResponse] = await Promise.all([
        api.get('/organizer/reports/revenue'),
        api.get('/organizer/reports/event-wise-bookings'),
      ])

      if (revenueResponse.data.status === 200) {
        setRevenueSummary(
          revenueResponse.data.result?.summary || {
            totalRevenue: 0,
            totalTransactions: 0,
            averageTransaction: 0,
          }
        )
      }

      if (bookingsResponse.data.status === 200) {
        setEventBookings(bookingsResponse.data.result?.bookings || [])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new()

      const summaryData = [
        ['Revenue & Sales Summary'],
        [`Generated on: ${format(new Date(), 'MMMM dd, yyyy HH:mm:ss')}`],
        [],
        ['Metric', 'Value'],
        ['Total Revenue', `₹${revenueSummary.totalRevenue?.toLocaleString() || 0}`],
        ['Total Bookings', eventBookings.reduce((sum, item) => sum + (item.totalBookings || 0), 0)],
        ['Total Events Active', eventBookings.length],
      ]

      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData)
      summaryWorksheet['!cols'] = [{ wch: 30 }, { wch: 25 }]
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary')

      if (eventBookings.length > 0) {
        const eventSheetData = [
          ['Event Detailed Revenue Report'],
          [`Generated on: ${format(new Date(), 'MMMM dd, yyyy HH:mm:ss')}`],
          [],
          ['Event Name', 'Total Bookings', 'Total Tickets', 'Revenue (₹)'],
        ]

        eventBookings.forEach((item) => {
          eventSheetData.push([
            item.eventTitle || 'N/A',
            item.totalBookings || 0,
            item.totalTickets || 0,
            item.totalRevenue || 0,
          ])
        })

        const eventTotalBookings = eventBookings.reduce((sum, item) => sum + (item.totalBookings || 0), 0)
        const eventTotalRevenue = eventBookings.reduce((sum, item) => sum + (item.totalRevenue || 0), 0)
        eventSheetData.push(['TOTAL', eventTotalBookings, '', eventTotalRevenue])

        const eventWorksheet = XLSX.utils.aoa_to_sheet(eventSheetData)
        eventWorksheet['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 18 }]
        XLSX.utils.book_append_sheet(workbook, eventWorksheet, 'Event Report')
      }

      const fileName = `Revenue_Report_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`
      XLSX.writeFile(workbook, fileName)
      toast.success('Report exported successfully!')
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error('Failed to export report')
    }
  }

  if (loading) {
    return <Loading size="lg" text="Loading reports..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Analyze your event sales and revenue trends</p>
        </div>
        {eventBookings.length > 0 && (
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20"
          >
            <Download className="w-5 h-5" />
            <span>Export to Excel</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-primary-50 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            ₹{revenueSummary.totalRevenue?.toLocaleString() || 0}
          </h3>
          <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-50 p-3 rounded-xl">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{eventBookings.length}</h3>
          <p className="text-sm text-gray-600 font-medium">Total Events</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-50 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {eventBookings.reduce((sum, item) => sum + (item.totalBookings || 0), 0)}
          </h3>
          <p className="text-sm text-gray-600 font-medium">Total Bookings</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Event-wise Bookings</h2>
            <p className="text-xs text-gray-500 mt-0.5">Booking statistics by event</p>
          </div>
          <BarChart3 className="w-4 h-4 text-gray-400" />
        </div>

        {eventBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {eventBookings.map((item) => (
                  <tr key={item.eventId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.eventTitle || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-600">{item.totalBookings || 0}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ₹{item.totalRevenue?.toLocaleString() || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No event booking data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports
