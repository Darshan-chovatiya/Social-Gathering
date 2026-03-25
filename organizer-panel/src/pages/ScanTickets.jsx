import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { ScanLine, X, CheckCircle, AlertCircle, Camera, CameraOff, Keyboard, List, RefreshCw, Eye } from 'lucide-react'
import { scanTicket, getScannedTickets } from '../utils/api'
import { useToast } from '../components/common/ToastContainer'
import { format } from 'date-fns'

const ScanTickets = () => {
  const [scanning, setScanning] = useState(false)
  const [lastScanResult, setLastScanResult] = useState(null)
  const [error, setError] = useState(null)
  const [manualEntry, setManualEntry] = useState('')
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [scannedTickets, setScannedTickets] = useState([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 6, total: 0, pages: 0 })
  const TICKETS_PER_PAGE = 6
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showTicketDetails, setShowTicketDetails] = useState(false)
  const [isProcessingScan, setIsProcessingScan] = useState(false)
  const [scanCooldown, setScanCooldown] = useState(0)
  const [lastScannedBookingId, setLastScannedBookingId] = useState(null)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)
  const { toast } = useToast()

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => { })
      }
    }
  }, [])

  const fetchScannedTickets = async (page = 1) => {
    try {
      setLoadingTickets(true)
      const response = await getScannedTickets(page, TICKETS_PER_PAGE)
      if (response.status === 200 && response.result) {
        setScannedTickets(response.result.tickets || [])
        setPagination(response.result.pagination || { page: 1, limit: TICKETS_PER_PAGE, total: 0, pages: 0 })
      }
    } catch (err) {
      console.error('Error fetching scanned tickets:', err)
      toast.error('Failed to load scanned tickets')
    } finally {
      setLoadingTickets(false)
    }
  }

  useEffect(() => {
    // Always load tickets on mount
    fetchScannedTickets(1)
  }, [])


  const extractBookingId = (scannedData) => {
    // If it's a URL, extract bookingId from path
    if (scannedData.includes('/tickets/')) {
      const match = scannedData.match(/\/tickets\/([^\/]+)/)
      if (match) {
        return match[1]
      }
    }
    // If it's JSON, try to parse
    try {
      const parsed = JSON.parse(scannedData)
      if (parsed.bookingId) {
        return parsed.bookingId
      }
    } catch (e) {
      // Not JSON, continue
    }
    // Otherwise, assume it's the bookingId directly
    return scannedData.trim()
  }

  const handleScan = async (bookingId) => {
    // Prevent multiple simultaneous scans
    if (isProcessingScan) {
      return
    }

    // Prevent scanning the same booking ID again
    if (lastScannedBookingId === bookingId) {
      return
    }

    try {
      setIsProcessingScan(true)
      setError(null)

      // Stop scanner immediately to prevent re-scanning
      if (html5QrCodeRef.current && scanning) {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear() // Clear the scanner buffer
        setScanning(false)
      }

      // Store the booking ID to prevent immediate re-scan
      setLastScannedBookingId(bookingId)

      const response = await scanTicket(bookingId)

      if (response.status === 200 && response.result?.booking) {
        setLastScanResult({
          success: true,
          booking: response.result.booking,
        })
        toast.success('Ticket scanned successfully!')

        // Refresh ticket list
        fetchScannedTickets(pagination.page)

        // Wait 3 seconds before allowing next scan with countdown
        setScanCooldown(3)
        for (let i = 3; i > 0; i--) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          setScanCooldown(i - 1)
        }
        setScanCooldown(0)
        // Clear the last scanned ID after cooldown
        setLastScannedBookingId(null)
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to scan ticket'
      setLastScanResult({
        success: false,
        error: errorMessage,
      })
      setError(errorMessage)
      toast.error(errorMessage)

      // Wait 2 seconds before allowing next scan on error
      setScanCooldown(2)
      for (let i = 2; i > 0; i--) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setScanCooldown(i - 1)
      }
      setScanCooldown(0)
      // Clear the last scanned ID after error cooldown
      setLastScannedBookingId(null)
    } finally {
      setIsProcessingScan(false)
    }
  }

  const onScanSuccess = async (decodedText, decodedResult) => {
    // Prevent scanning if already processing or in cooldown
    if (isProcessingScan || scanCooldown > 0) {
      return
    }

    const bookingId = extractBookingId(decodedText)

    // Prevent scanning the same booking ID
    if (lastScannedBookingId === bookingId) {
      return
    }

    // Stop scanner immediately before processing to prevent duplicate detections
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear() // Clear the scanner buffer
        setScanning(false)
      } catch (e) {
        // Ignore stop errors
        console.error('Error stopping scanner:', e)
      }
    }

    await handleScan(bookingId)
  }

  const onScanFailure = (errorMessage) => {
    // Ignore common non-error messages
    if (!errorMessage.includes('No QR code found')) {
      // Only log actual errors, not "no QR code found" messages
    }
  }

  const startScanning = async () => {
    try {
      setError(null)
      setLastScanResult(null)

      // Set scanning to true first so the element is rendered
      setScanning(true)

      // Wait for the DOM to update
      await new Promise(resolve => setTimeout(resolve, 100))

      // Check if element exists
      const readerElement = document.getElementById('reader')
      if (!readerElement) {
        setScanning(false)
        setError('Scanner element not found. Please try again.')
        toast.error('Scanner element not found. Please try again.')
        return
      }

      const html5QrCode = new Html5Qrcode('reader')
      html5QrCodeRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        onScanSuccess,
        onScanFailure
      )
    } catch (err) {
      console.error('Error starting scanner:', err)
      setScanning(false)
      setError('Failed to start camera. Please check permissions.')
      toast.error('Failed to start camera. Please check permissions.')
    }
  }

  const stopScanning = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
        html5QrCodeRef.current = null
      }
      setScanning(false)
    } catch (err) {
      console.error('Error stopping scanner:', err)
    }
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    if (!manualEntry.trim()) {
      setError('Please enter a booking ID')
      return
    }

    const bookingId = extractBookingId(manualEntry.trim())
    await handleScan(bookingId)
    setManualEntry('')
  }

  const handleReset = () => {
    setLastScanResult(null)
    setError(null)
    setManualEntry('')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Scan Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">Scan QR codes from customer tickets to mark attendance and track real-time check-ins</p>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Scanned Tickets List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <List className="w-5 h-5" />
                Scanned Tickets
              </h2>
              <button
                onClick={() => fetchScannedTickets(pagination.page)}
                disabled={loadingTickets}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${loadingTickets ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {loadingTickets ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            ) : scannedTickets.length === 0 ? (
              <div className="text-center py-12">
                <List className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  No tickets have been scanned yet
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Booking ID
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tickets
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Scanned At
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {scannedTickets.map((ticket) => (
                        <tr key={ticket._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs font-mono font-medium text-gray-900">
                              {ticket.bookingId.length > 12 ? `${ticket.bookingId.substring(0, 12)}...` : ticket.bookingId}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div>
                              <div className="text-xs font-medium text-gray-900">
                                {ticket.userId?.name || 'N/A'}
                              </div>
                              {(ticket.userId?.email || ticket.userId?.mobile) && (
                                <div className="text-xs text-gray-500 truncate max-w-[150px]" title={ticket.userId?.email || ticket.userId?.mobile}>
                                  {ticket.userId?.email
                                    ? (ticket.userId.email.length > 15 ? `${ticket.userId.email.substring(0, 15)}...` : ticket.userId.email)
                                    : ticket.userId?.mobile || ''}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="text-xs text-gray-900">
                              {ticket.tickets?.reduce((sum, t) => sum + (t.quantity || 0), 0) || 0}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-900">
                              {ticket.attendedAt ? format(new Date(ticket.attendedAt), 'MMM d, HH:mm') : 'N/A'}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => {
                                setSelectedTicket(ticket)
                                setShowTicketDetails(true)
                              }}
                              className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.total > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-200">
                    <div className="text-xs text-gray-700">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tickets
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const newPage = Math.max(1, pagination.page - 1)
                          fetchScannedTickets(newPage)
                        }}
                        disabled={pagination.page <= 1 || loadingTickets}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => {
                          const newPage = Math.min(pagination.pages, pagination.page + 1)
                          fetchScannedTickets(newPage)
                        }}
                        disabled={pagination.page >= pagination.pages || loadingTickets}
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Side - Scanner Section */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  QR Code Scanner
                </h2>
                <div className="flex gap-2 flex-wrap">
                  {!scanning ? (
                    <button
                      onClick={startScanning}
                      disabled={scanCooldown > 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial min-w-[120px] sm:min-w-0"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="whitespace-nowrap">{scanCooldown > 0 ? `Wait ${scanCooldown}s` : 'Start Scanning'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopScanning}
                      disabled={isProcessingScan}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-initial min-w-[120px] sm:min-w-0"
                    >
                      <CameraOff className="w-4 h-4" />
                      <span className="whitespace-nowrap">Stop Scanning</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowManualEntry(!showManualEntry)
                      if (showManualEntry) {
                        setManualEntry('')
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-initial min-w-[120px] sm:min-w-0"
                  >
                    <Keyboard className="w-4 h-4" />
                    <span className="whitespace-nowrap">{showManualEntry ? 'Hide' : 'Manual Entry'}</span>
                  </button>
                </div>
              </div>

              {/* Manual Entry Form */}
              {showManualEntry && (
                <form onSubmit={handleManualSubmit} className="mb-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={manualEntry}
                      onChange={(e) => setManualEntry(e.target.value)}
                      placeholder="Enter Booking ID or scan URL"
                      className="flex-1 px-3 py-2 sm:py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 sm:py-1.5 text-sm bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg font-medium transition-colors whitespace-nowrap"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              )}

              {/* Scanner View - Always render but conditionally show */}
              <div className="relative">
                <div
                  id="reader"
                  className={`w-full rounded-lg overflow-hidden bg-gray-100 ${scanning ? '' : 'hidden'}`}
                  style={{ minHeight: scanning ? '250px' : '0' }}
                ></div>

                {/* Cooldown Overlay */}
                {scanCooldown > 0 && scanning && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center z-10 p-4">
                    <div className="bg-white rounded-lg p-4 sm:p-6 shadow-lg text-center w-full max-w-xs">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1 sm:mb-2">
                        Ticket Scanned Successfully!
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-600 mb-2 sm:mb-3">
                        Please wait before scanning next ticket
                      </p>
                      <div className="text-xl sm:text-2xl font-bold text-primary-600">
                        {scanCooldown}s
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!scanning && !showManualEntry && (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 bg-gray-100 rounded-lg  px-4">
                  <ScanLine className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-gray-600 text-center">
                    Click "Start Scanning" to begin scanning QR codes
                  </p>
                  {isProcessingScan && (
                    <p className="text-xs sm:text-sm text-primary-600 mt-2">
                      Processing scan...
                    </p>
                  )}
                </div>
              )}

              {isProcessingScan && scanning && (
                <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center z-10 p-4">
                  <div className="bg-white rounded-lg p-3 sm:p-4 shadow-lg">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 animate-spin" />
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        Processing scan...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Scan Result */}
            {lastScanResult && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                    Scan Result
                  </h2>
                  <button
                    onClick={handleReset}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  </button>
                </div>

                {lastScanResult.success ? (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-green-900">
                          Ticket Scanned Successfully!
                        </p>
                        <p className="text-[10px] sm:text-sm text-green-700 break-words">
                          Attendance marked at {new Date(lastScanResult.booking.attendedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Booking ID</p>
                        <p className="text-xs sm:text-sm font-mono font-semibold text-gray-900 break-all">
                          {lastScanResult.booking.bookingId}
                        </p>
                      </div>

                      <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Event</p>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 break-words">
                          {lastScanResult.booking.event.title}
                        </p>
                      </div>

                      <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Customer Name</p>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 break-words">
                          {lastScanResult.booking.customer.name}
                        </p>
                      </div>

                      <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Tickets</p>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900">
                          {lastScanResult.booking.totalTickets}
                        </p>
                      </div>
                    </div>

                    {lastScanResult.booking.tickets && lastScanResult.booking.tickets.length > 0 && (
                      <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">Ticket Details</p>
                        <div className="space-y-1">
                          {lastScanResult.booking.tickets.map((ticket, index) => (
                            <p key={index} className="text-xs sm:text-sm text-gray-900">
                              {ticket.ticketTypeTitle}: {ticket.quantity}x
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-red-900">Scan Failed</p>
                      <p className="text-[10px] sm:text-sm text-red-700 break-words">
                        {lastScanResult.error || 'Unknown error occurred'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-3 sm:p-4">
              <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-2">
                Instructions
              </h3>
              <ul className="space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs text-blue-800">
                <li>• Click "Start Scanning" to activate your camera</li>
                <li>• Point the camera at the QR code on the customer's ticket</li>
                <li>• The ticket will be automatically scanned and marked as attended</li>
                <li>• Once scanned, a ticket cannot be reused</li>
                <li>• Use "Manual Entry" if the QR code cannot be scanned</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Details Modal */}
      {showTicketDetails && selectedTicket && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => {
              setShowTicketDetails(false)
              setSelectedTicket(null)
            }}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Ticket Details</h2>
                <button
                  onClick={() => {
                    setShowTicketDetails(false)
                    setSelectedTicket(null)
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Booking ID</p>
                    <p className="text-sm font-mono font-semibold text-gray-900">
                      {selectedTicket.bookingId}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Event</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedTicket.eventId?.title || 'N/A'}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Customer Name</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedTicket.userId?.name || 'N/A'}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Customer Email</p>
                    <p className="text-sm text-gray-900">
                      {selectedTicket.userId?.email || 'N/A'}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Customer Mobile</p>
                    <p className="text-sm text-gray-900">
                      {selectedTicket.userId?.mobile || 'N/A'}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Total Tickets</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedTicket.tickets?.reduce((sum, t) => sum + (t.quantity || 0), 0) || 0}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Scanned At</p>
                    <p className="text-sm text-gray-900">
                      {selectedTicket.attendedAt ? format(new Date(selectedTicket.attendedAt), 'MMM d, yyyy HH:mm:ss') : 'N/A'}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Scanned By</p>
                    <p className="text-sm text-gray-900">
                      {selectedTicket.scannedBy?.name || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Ticket Details */}
                {selectedTicket.tickets && selectedTicket.tickets.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-600 mb-3">Ticket Details</p>
                    <div className="space-y-2">
                      {selectedTicket.tickets.map((ticket, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {ticket.ticketTypeTitle || 'Ticket'}
                            </p>
                            <p className="text-xs text-gray-600">
                              Quantity: {ticket.quantity} × ₹{ticket.price}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            ₹{(ticket.price * ticket.quantity).toLocaleString('en-IN')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total Amount */}
                <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Total Amount</p>
                    <p className="text-lg font-bold text-primary-600">
                      ₹{selectedTicket.totalAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => {
                    setShowTicketDetails(false)
                    setSelectedTicket(null)
                  }}
                  className="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-gray-900 font-medium rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ScanTickets

