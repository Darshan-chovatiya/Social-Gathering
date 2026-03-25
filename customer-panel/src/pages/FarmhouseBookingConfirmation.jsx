import { useState, useEffect } from 'react'
import { useParams, useNavigate, NavLink } from 'react-router-dom'
import { CheckCircle2, Calendar, MapPin, Home, ArrowRight, Printer, Share2, Download, Clock, ShieldCheck, ArrowLeft, Receipt, CreditCard, ChevronDown, CheckCircle, X, AlertCircle, Copy } from 'lucide-react'
import api from '../utils/api'
import Loading from '../components/common/Loading'
import Header from '../components/layout/Header'
import { QRCodeSVG } from 'qrcode.react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const FarmhouseBookingConfirmation = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paymentDetails, setPaymentDetails] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [loadingPayment, setLoadingPayment] = useState(false)
  const [paymentDetailsError, setPaymentDetailsError] = useState(null)

  useEffect(() => {
    fetchBookingDetails()
  }, [bookingId])

  const fetchBookingDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/farmhouses/bookings/${bookingId}`)
      if (response.data.status === 200) {
        const fetchedBooking = response.data.result.booking
        setBooking(fetchedBooking)

        // Fetch payment details
        try {
          const idForPayment = fetchedBooking.bookingId || fetchedBooking._id
          const paymentResponse = await api.get(`/users/payments/booking/${idForPayment}`)
          if (paymentResponse.data?.status === 200 && paymentResponse.data?.result?.payment) {
            setPaymentDetails(paymentResponse.data.result.payment)
          }
        } catch (paymentError) {
          console.error('Error fetching payment details:', paymentError)
        }
      } else {
        setError('Booking not found')
      }
    } catch (err) {
      console.error('Error fetching booking details:', err)
      setError(err.response?.data?.message || 'Failed to load booking details')
    } finally {
      setLoading(false)
    }
  }

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
      case 'successful':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      case 'failed':
      case 'failure':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case 'refunded':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getPaymentMethodLabel = (method) => {
    if (!method) return 'N/A'
    const methodMap = {
      'razorpay': 'Razorpay',
      'card': 'Credit/Debit Card',
      'netbanking': 'Net Banking',
      'wallet': 'Wallet',
      'upi': 'UPI',
      'cash': 'Cash',
      'other': 'Other'
    }
    return methodMap[method.toLowerCase()] || method
  }

  const copyToClipboard = async (text) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      // Toast or notification could be added here
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const formatDateTime = (date) => {
    if (!date) return 'N/A'
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return 'N/A'

    return dateObj.toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) return 'N/A'

    return dateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleDownloadTicket = async () => {
    if (!booking) return

    let iframe = null

    try {
      const farmhouse = booking.farmhouseId
      const checkInDateStr = new Date(booking.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      const checkOutDateStr = new Date(booking.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

      const totalPaid = booking.totalAmount + (booking.depositAmount || 0)

      // Create an iframe to completely isolate from parent page styles
      iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.left = '-9999px'
      iframe.style.top = '0'
      iframe.style.width = '400px'
      iframe.style.height = '600px'
      iframe.style.border = 'none'
      iframe.style.backgroundColor = '#ffffff'
      document.body.appendChild(iframe)

      // Wait for iframe to load
      await new Promise((resolve) => {
        iframe.onload = resolve
        iframe.src = 'about:blank'
      })

      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document

      // Write complete HTML document
      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; background-color: rgb(243, 244, 246); padding: 32px 24px; }
            </style>
          </head>
          <body>
            <div style="max-width: 384px; margin: 0 auto;">
              <div style="background-color: rgb(255, 255, 255); border-radius: 12px; border: 1px solid rgb(229, 231, 235); box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1); overflow: hidden; position: relative;">
                <!-- Upper Section - Property Details -->
                <div style="padding: 20px; border-bottom: 2px dashed rgb(229, 231, 235); position: relative;">
                  <h2 style="font-size: 18px; font-weight: bold; color: rgb(17, 24, 39); margin-bottom: 8px;">${farmhouse.title}</h2>
                  <p style="font-size: 13px; color: rgb(107, 114, 128); margin-bottom: 12px;">${farmhouse.address?.fullAddress}</p>
                  
                  <div style="display: flex; justify-content: space-between; gap: 12px; margin-top: 16px;">
                    <div>
                      <p style="font-size: 10px; font-weight: bold; color: rgb(156, 163, 175); text-transform: uppercase; margin-bottom: 4px;">Check-In</p>
                      <p style="font-size: 14px; font-weight: bold; color: rgb(17, 24, 39);">${checkInDateStr}</p>
                      <p style="font-size: 12px; color: rgb(107, 114, 128);">${booking.checkInTime || '12:00 PM'}</p>
                    </div>
                    <div style="text-align: right;">
                      <p style="font-size: 10px; font-weight: bold; color: rgb(156, 163, 175); text-transform: uppercase; margin-bottom: 4px;">Check-Out</p>
                      <p style="font-size: 14px; font-weight: bold; color: rgb(17, 24, 39);">${checkOutDateStr}</p>
                      <p style="font-size: 12px; color: rgb(107, 114, 128);">${booking.checkOutTime || '11:00 AM'}</p>
                    </div>
                  </div>
                </div>
                
                <!-- Lower Section - QR Code and Details -->
                <div style="padding: 20px; text-align: center;">
                  <p style="font-size: 14px; font-weight: 600; color: rgb(17, 24, 39); margin-bottom: 4px;">E-Checkin Pass</p>
                  <p style="font-size: 11px; color: rgb(107, 114, 128); margin-bottom: 20px;">Scan at the property for verification</p>
                  
                  <div style="background-color: rgb(255, 255, 255); padding: 16px; border-radius: 12px; border: 1px solid rgb(243, 244, 246); display: inline-block; margin-bottom: 20px;">
                    <div id="qr-container"></div>
                  </div>
                  
                  <div style="text-align: left; padding: 12px; background-color: rgb(249, 250, 251); border-radius: 8px;">
                    <p style="font-size: 12px; color: rgb(107, 114, 128); font-weight: bold; margin-bottom: 4px;">BOOKING ID</p>
                    <p style="font-family: monospace; font-size: 14px; font-weight: bold; color: rgb(17, 24, 39);">${booking.bookingId}</p>
                  </div>
                </div>
                
                <!-- Total Amount Footer -->
                <div style="padding: 16px; background-color: rgb(249, 250, 251); border-top: 1px solid rgb(229, 231, 235); display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 14px; font-weight: 600; color: rgb(17, 24, 39);">Total Paid</span>
                  <span style="font-size: 18px; font-weight: bold; color: rgb(17, 24, 39);">₹${totalPaid.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </body>
        </html>
      `)

      // We need to render the QR code into the iframe
      const qrContainer = iframeDoc.getElementById('qr-container')

      // Instead of html2canvas on the main page (which can fail due to oklch colors),
      // we'll directly convert the SVG to a canvas/image
      const currentQrSvg = document.querySelector('#main-qr-code svg')
      if (currentQrSvg) {
        try {
          const svgData = new XMLSerializer().serializeToString(currentQrSvg)
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const img = new Image()

          // Set canvas size to match SVG or desired size
          canvas.width = 200
          canvas.height = 200

          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
          })

          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(img, 10, 10, 180, 180)

          const qrImg = iframeDoc.createElement('img')
          qrImg.src = canvas.toDataURL('image/png')
          qrImg.style.width = '160px'
          qrImg.style.height = '160px'
          qrContainer.appendChild(qrImg)
        } catch (qrErr) {
          console.error('Error processing QR code for PDF:', qrErr)
          // Fallback message in PDF if QR fails
          qrContainer.innerHTML = '<p style="font-size: 10px; color: red;">QR Code could not be rendered</p>'
        }
      }

      iframeDoc.close()

      // Wait for everything to settle
      await new Promise((resolve) => setTimeout(resolve, 800))

      const iframeBody = iframeDoc.body
      const canvas = await html2canvas(iframeBody, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 400,
        windowHeight: iframeBody.scrollHeight
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      const pdf = new jsPDF('p', 'mm', 'a4')
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`Farmhouse-Ticket-${booking.bookingId}.pdf`)

      document.body.removeChild(iframe)
    } catch (error) {
      console.error('Error generating PDF:', error)
      if (iframe && iframe.parentNode) {
        document.body.removeChild(iframe)
      }
      alert('Failed to generate PDF. Please try again.')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Stay at ${booking.farmhouseId.title}`,
          text: `Check out my booking for ${booking.farmhouseId.title}!`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Booking link copied to clipboard!')
    }
  }

  const handleViewPaymentDetails = async () => {
    if (!booking) return

    try {
      setLoadingPayment(true)
      setPaymentDetailsError(null)
      setShowPaymentModal(true)

      const idForPayment = booking.bookingId || booking._id
      const response = await api.get(`/users/payments/booking/${idForPayment}`)

      if (response.data.status === 200 && response.data.result?.payment) {
        setPaymentDetails(response.data.result.payment)
      } else {
        setPaymentDetailsError(response.data?.message || 'Payment details not found')
      }
    } catch (err) {
      console.error('Error fetching payment details:', err)
      setPaymentDetailsError(err.response?.data?.message || 'Failed to load payment details')
    } finally {
      setLoadingPayment(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"><Loading text="Finalizing your booking..." /></div>

  if (error || !booking) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
        <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Booking Not Found</h2>
        <p className="text-gray-500 mb-6">{error || "The booking you're looking for doesn't exist."}</p>
        <button onClick={() => navigate('/farmhouses')} className="w-full bg-primary-600 text-white rounded-xl py-3 font-semibold hover:bg-primary-700 transition-colors">Back to Farmhouses</button>
      </div>
    </div>
  )

  const { farmhouseId: farmhouse } = booking
  const totalPaid = booking.totalAmount + (booking.depositAmount || 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header />

      <main className="w-full">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-4 transition-all duration-300">
          <div className="max-w-3xl mx-auto px-4">
            {/* Back Link */}
            <NavLink
              to="/bookings"
              className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to My Bookings</span>
            </NavLink>

            {/* Success Header Area */}
            <div className="text-center mb-8 animate-in fade-in slide-in-from-top duration-700">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4 ring-8 ring-green-50 dark:ring-green-900/10">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-tight">
                Booking Confirmed!
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Your stay at <span className="text-primary-600 dark:text-primary-400 font-bold">{farmhouse.title}</span> is all set.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-4 py-2 rounded-full text-xs font-bold border border-gray-200 dark:border-gray-700 shadow-sm">
                Booking ID: <span className="font-mono text-primary-600">{booking.bookingId}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Card 1: Property Details */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 flex flex-col h-full animate-in fade-in slide-in-from-left duration-700">
                <div className="flex items-center gap-2 mb-6">
                  <Home className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">Property Details</h2>
                </div>

                <div className="space-y-5 flex-1">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-2">{farmhouse.title}</h3>
                    <div className="flex items-start gap-2 text-gray-500 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-500" />
                      <p className="text-sm leading-relaxed">{farmhouse.address?.fullAddress}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-6 border-y border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl px-4">
                    <div className="border-r border-gray-200 dark:border-gray-700 pr-2">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary-500" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-In</p>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{new Date(booking.checkInDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {booking.checkInTime || '14:00'}
                      </p>
                    </div>
                    <div className="pl-2">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary-500" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Check-Out</p>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{new Date(booking.checkOutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {booking.checkOutTime || '11:00'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Host Contact</p>
                    <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{farmhouse.organizer?.name || 'Manager'}</p>
                      <p className="text-sm text-primary-600 dark:text-primary-400 font-bold mt-0.5">{farmhouse.organizer?.contactInfo || farmhouse.mobile}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={handleViewPaymentDetails}
                    className="w-full px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all border-2 border-primary-100 dark:border-primary-800/30 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    View Payment Details
                  </button>
                </div>
              </div>

              {/* Card 2: QR Code and Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 text-center flex flex-col justify-between animate-in fade-in slide-in-from-right duration-700">
                <div>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tight">E-Checkin Pass</h3>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 font-medium">Scan this code at the property for verification</p>

                  <div id="main-qr-code" className="bg-white p-4 sm:p-6 rounded-3xl shadow-xl border border-gray-50 dark:border-gray-100 inline-block mb-8 hover:scale-105 transition-transform duration-300">
                    <QRCodeSVG
                      value={JSON.stringify({ bookingId: booking.bookingId, type: 'farmhouse' })}
                      size={180}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleDownloadTicket}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 group transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center mb-2 group-hover:text-primary-600 group-hover:scale-110 transition-all">
                      <Download className="w-5 h-5 text-gray-500 group-hover:text-primary-600" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white uppercase tracking-wider">Save PDF</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 group transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center mb-2 group-hover:text-emerald-600 group-hover:scale-110 transition-all">
                      <Share2 className="w-5 h-5 text-gray-500 group-hover:text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white uppercase tracking-wider">Share</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Summary List Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-6 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Summary */}
                <div className="border-r-0 md:border-r border-gray-100 dark:border-gray-700 pr-0 md:pr-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Receipt className="w-5 h-5 text-primary-500" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Payment Summary</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl">
                      <span className="text-xs font-bold text-gray-500 uppercase">Booking Amount</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">₹{booking.totalAmount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl">
                      <span className="text-xs font-bold text-gray-500 uppercase">Security Deposit</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">₹{booking.depositAmount?.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 flex justify-between items-center">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Total Amount Paid</p>
                      <p className="text-xl font-extrabold text-primary-600 dark:text-primary-400">₹{totalPaid.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Right: Next Steps */}
                <div className="pl-0 md:pl-0">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="w-5 h-5 text-primary-500" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Important Info</h3>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-[10px] font-extrabold flex-shrink-0">1</div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-normal font-medium mt-1">Check your email for the detailed confirmation receipt.</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 text-[10px] font-extrabold flex-shrink-0">2</div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-normal font-medium mt-1">Carry a valid Photo ID proof for all guests during check-in.</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 text-[10px] font-extrabold flex-shrink-0">3</div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-normal font-medium mt-1">Security deposit is refundable upon checkout after property verification.</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-10 text-center flex flex-col items-center gap-4">
              <NavLink
                to="/bookings"
                className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 border-2 border-primary-100 dark:border-primary-800/50 hover:bg-primary-50 px-8 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all shadow-sm group"
              >
                View All My Bookings <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </NavLink>
              <button
                onClick={() => navigate('/')}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Details Modal */}
      {showPaymentModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity"
            onClick={() => {
              setShowPaymentModal(false)
              setPaymentDetails(null)
              setPaymentDetailsError(null)
            }}
          />

          {/* Modal - Mobile: Slide up from bottom, Desktop: Centered */}
          <div className="fixed inset-0 z-[101] md:flex md:items-center md:justify-center md:p-4 pointer-events-none">
            {/* Mobile: Bottom sheet */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up-from-bottom pointer-events-auto">
              {/* Drag Handle - Mobile only */}
              <div className="flex-shrink-0 pt-3 pb-2 flex justify-center">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              </div>

              {/* Header */}
              <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Payment Details</h2>
                  {booking && (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-[10px] text-gray-500 font-medium">
                        Booking ID: <span className="font-mono text-gray-900 dark:text-gray-300">{booking.bookingId}</span>
                      </p>
                      <p className="text-[10px] text-gray-500">
                        Date: {formatDate(booking.createdAt)}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowPaymentModal(false)
                    setPaymentDetails(null)
                    setPaymentDetailsError(null)
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingPayment ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-gray-500">Loading details...</p>
                  </div>
                ) : paymentDetailsError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">{paymentDetailsError}</p>
                  </div>
                ) : paymentDetails ? (
                  <div className="space-y-4">
                    {/* Status and Amount Card */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-2xl flex justify-between items-center border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${paymentDetails.status === 'success' || paymentDetails.status === 'successful' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {paymentDetails.status === 'success' || paymentDetails.status === 'successful' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Status</p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-0.5 ${getPaymentStatusColor(paymentDetails.status)}`}>
                            {paymentDetails.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Amount Paid</p>
                        <p className="text-lg font-bold text-primary-600">₹{paymentDetails.amount?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Method</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white uppercase">{getPaymentMethodLabel(paymentDetails.paymentMethod)}</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Currency</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white uppercase">{paymentDetails.currency || 'INR'}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Payment Date</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDateTime(paymentDetails.createdAt)}</p>
                    </div>

                    {(paymentDetails.razorpayPaymentId || paymentDetails.cashfreePaymentId) && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Transaction ID</p>
                            <p className="text-xs font-mono font-bold text-gray-900 dark:text-white break-all">{paymentDetails.razorpayPaymentId || paymentDetails.cashfreePaymentId}</p>
                          </div>
                          <button onClick={() => copyToClipboard(paymentDetails.razorpayPaymentId || paymentDetails.cashfreePaymentId)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                            <Copy className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    )}

                    {(paymentDetails.razorpayOrderId || paymentDetails.cashfreeOrderId) && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Order ID</p>
                            <p className="text-xs font-mono font-bold text-gray-900 dark:text-white break-all">{paymentDetails.razorpayOrderId || paymentDetails.cashfreeOrderId}</p>
                          </div>
                          <button onClick={() => copyToClipboard(paymentDetails.razorpayOrderId || paymentDetails.cashfreeOrderId)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                            <Copy className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Breakdown Section */}
                    <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/20 rounded-2xl">
                      <h4 className="text-[10px] text-primary-600 dark:text-primary-400 font-bold uppercase tracking-[0.15em] mb-4 text-center">Payment Breakdown</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 font-medium font-serif">Stay Charges</span>
                          <span className="font-bold text-gray-900 dark:text-white">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 font-medium font-serif">Refundable Deposit</span>
                          <span className="font-bold text-gray-900 dark:text-white">₹{booking.depositAmount?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="pt-3 mt-3 border-t border-primary-200/50 dark:border-primary-900/30 flex justify-between items-center">
                          <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">Final Amount</span>
                          <span className="text-base font-bold text-primary-600">₹{totalPaid.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Mobile Footer */}
              <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary-500/20"
                >
                  Okay, Got it
                </button>
              </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:flex flex-col bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-hidden animate-in zoom-in duration-300 pointer-events-auto">
              {/* Header */}
              <div className="flex-shrink-0 px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 z-10">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Details</h2>
                  {booking && (
                    <div className="mt-1 flex gap-3 text-[10px] text-gray-500 font-medium">
                      <p>Booking ID: <span className="font-mono text-gray-900 dark:text-gray-300">{booking.bookingId}</span></p>
                      <p>•</p>
                      <p>Date: <span className="text-gray-900 dark:text-gray-300">{formatDate(booking.createdAt)}</span></p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                {loadingPayment ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold text-gray-500">Retrieving payment data...</p>
                  </div>
                ) : paymentDetailsError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">{paymentDetailsError}</p>
                  </div>
                ) : paymentDetails ? (
                  <div className="space-y-4">
                    {/* Status Box */}
                    <div className="p-5 bg-gray-50 dark:bg-gray-700/40 rounded-3xl flex justify-between items-center border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${paymentDetails.status === 'success' || paymentDetails.status === 'successful' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {paymentDetails.status === 'success' || paymentDetails.status === 'successful' ? <CheckCircle className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Payment Status</p>
                          <span className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-bold uppercase mt-1 ${getPaymentStatusColor(paymentDetails.status)}`}>
                            {paymentDetails.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Grand Total</p>
                        <p className="text-2xl font-black text-primary-600 mt-1">₹{paymentDetails.amount?.toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Gateway</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white uppercase">{getPaymentMethodLabel(paymentDetails.paymentMethod)}</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Currency</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{paymentDetails.currency || 'INR'}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Transaction Date</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatDateTime(paymentDetails.createdAt)}</p>
                    </div>

                    <div className="space-y-3">
                      {(paymentDetails.razorpayPaymentId || paymentDetails.cashfreePaymentId) && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-2xl border border-gray-100 dark:border-gray-700 flex justify-between items-center group">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Transaction ID</p>
                            <p className="text-xs font-mono font-bold text-gray-900 dark:text-white truncate">{paymentDetails.razorpayPaymentId || paymentDetails.cashfreePaymentId}</p>
                          </div>
                          <button onClick={() => copyToClipboard(paymentDetails.razorpayPaymentId || paymentDetails.cashfreePaymentId)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all">
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      )}
                      {(paymentDetails.razorpayOrderId || paymentDetails.cashfreeOrderId) && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-2xl border border-gray-100 dark:border-gray-700 flex justify-between items-center group">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Order ID</p>
                            <p className="text-xs font-mono font-bold text-gray-900 dark:text-white truncate">{paymentDetails.razorpayOrderId || paymentDetails.cashfreeOrderId}</p>
                          </div>
                          <button onClick={() => copyToClipboard(paymentDetails.razorpayOrderId || paymentDetails.cashfreeOrderId)} className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all">
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Breakdown */}
                    <div className="mt-6 p-6 bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/20 rounded-[2rem]">
                      <h4 className="text-[10px] text-primary-700 dark:text-primary-400 font-black uppercase tracking-[0.25em] mb-4 text-center">Summary of Charges</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500 font-medium">Accommodation Charges</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">₹{booking.totalAmount?.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500 font-medium">Refundable Security Deposit</span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">₹{(booking.depositAmount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="pt-4 mt-4 border-t border-primary-200/50 dark:border-primary-900/30 flex justify-between items-center">
                          <span className="text-xs font-black text-primary-600 uppercase tracking-widest">Aggregate Amount</span>
                          <span className="text-2xl font-black text-primary-600">₹{totalPaid.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Footer - Fixed at bottom */}
              <div className="flex-shrink-0 p-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-primary-500/20 active:scale-[0.98]"
                >
                  Confirm & Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default FarmhouseBookingConfirmation
