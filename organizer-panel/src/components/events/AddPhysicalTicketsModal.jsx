import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { useToast } from '../common/ToastContainer'
import Modal from '../common/Modal'
import Loading from '../common/Loading'
import { Ticket, AlertCircle, CheckCircle } from 'lucide-react'

const AddPhysicalTicketsModal = ({ isOpen, onClose, eventId, onSuccess }) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [event, setEvent] = useState(null)
  const [physicalTickets, setPhysicalTickets] = useState({})
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen && eventId) {
      fetchEvent()
      setPhysicalTickets({})
      setErrors({})
    } else {
      setEvent(null)
    }
  }, [isOpen, eventId])

  const fetchEvent = async () => {
    try {
      setFetching(true)
      const response = await api.get(`/organizer/events/${eventId}`)
      if (response.data.status === 200) {
        setEvent(response.data.result.event)
        // Initialize physical tickets object with empty values
        const initialTickets = {}
        if (response.data.result.event.ticketTypes) {
          response.data.result.event.ticketTypes.forEach((tt) => {
            initialTickets[tt._id] = ''
          })
        }
        setPhysicalTickets(initialTickets)
      }
    } catch (error) {
      console.error('Error fetching event:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch event details')
    } finally {
      setFetching(false)
    }
  }

  const handlePhysicalTicketsChange = (ticketTypeId, value) => {
    // Only allow numbers
    const numericValue = value.replace(/[^\d]/g, '')
    setPhysicalTickets(prev => ({
      ...prev,
      [ticketTypeId]: numericValue
    }))

    // Clear error for this ticket type
    if (errors[ticketTypeId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[ticketTypeId]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    let hasValue = false

    if (!event || !event.ticketTypes || event.ticketTypes.length === 0) {
      toast.error('No ticket types found for this event')
      return false
    }

    event.ticketTypes.forEach((ticketType) => {
      const physicalCount = parseInt(physicalTickets[ticketType._id]) || 0
      
      if (physicalCount > 0) {
        hasValue = true
        const currentAvailable = ticketType.availableQuantity || 0
        const newAvailable = currentAvailable - physicalCount

        if (newAvailable < 0) {
          newErrors[ticketType._id] = `Cannot add ${physicalCount} physical tickets. Available quantity would become negative (${newAvailable}). Maximum allowed: ${currentAvailable}`
        }
      }
    })

    if (!hasValue) {
      toast.error('Please enter at least one physical ticket count')
      return false
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      // Prepare ticket types data - only include those with physical tickets > 0
      const ticketTypesData = []
      event.ticketTypes.forEach((ticketType) => {
        const physicalCount = parseInt(physicalTickets[ticketType._id]) || 0
        if (physicalCount > 0) {
          ticketTypesData.push({
            ticketTypeId: ticketType._id,
            physicalTickets: physicalCount
          })
        }
      })

      const response = await api.post(`/organizer/events/${eventId}/add-physical-tickets`, {
        ticketTypes: ticketTypesData
      })

      if (response.data.status === 200) {
        toast.success('Physical tickets added successfully')
        onSuccess()
        onClose()
      }
    } catch (error) {
      console.error('Error adding physical tickets:', error)
      toast.error(error.response?.data?.message || 'Failed to add physical tickets')
    } finally {
      setLoading(false)
    }
  }

  const getResultingAvailable = (ticketType) => {
    const physicalCount = parseInt(physicalTickets[ticketType._id]) || 0
    const currentAvailable = ticketType.availableQuantity || 0
    return currentAvailable - physicalCount
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Physical Tickets"
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-3 p-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-gray-900 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Physical Tickets'}
          </button>
        </div>
      }
    >
      {fetching ? (
        <div className="flex items-center justify-center py-12">
          <Loading size="lg" text="Loading event details..." />
        </div>
      ) : !event ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Event not found</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">How it works</h3>
                <p className="text-sm text-blue-800">
                  Adding physical tickets will reduce the available quantity for online booking. 
                  Total quantity remains unchanged. For example, if you have 40 total tickets and 30 available, 
                  adding 20 physical tickets will result in 10 available tickets.
                </p>
              </div>
            </div>
          </div>

          {!event.ticketTypes || event.ticketTypes.length === 0 ? (
            <div className="text-center py-8">
              <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No ticket types found for this event</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Ticket Types</h3>
              <div className="space-y-4">
                {event.ticketTypes.map((ticketType) => {
                  const physicalCount = parseInt(physicalTickets[ticketType._id]) || 0
                  const currentAvailable = ticketType.availableQuantity || 0
                  const currentTotal = ticketType.totalQuantity || 0
                  const resultingAvailable = getResultingAvailable(ticketType)
                  const hasError = errors[ticketType._id]
                  const isValid = physicalCount > 0 && resultingAvailable >= 0

                  return (
                    <div
                      key={ticketType._id}
                      className={`border rounded-lg p-4 ${
                        hasError ? 'border-red-300 bg-red-50' : isValid ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{ticketType.title}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span>Total: <span className="font-medium">{currentTotal}</span></span>
                            <span>Available: <span className="font-medium">{currentAvailable}</span></span>
                          </div>
                        </div>
                        {isValid && (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Physical Tickets to Add
                          </label>
                          <input
                            type="text"
                            value={physicalTickets[ticketType._id] || ''}
                            onChange={(e) => handlePhysicalTicketsChange(ticketType._id, e.target.value)}
                            placeholder="0"
                            className={`input-field ${
                              hasError ? 'border-red-500' : ''
                            }`}
                          />
                          {hasError && (
                            <p className="text-red-500 text-xs mt-1">{errors[ticketType._id]}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Resulting Available Quantity
                          </label>
                          <div className={`px-3 py-2 border rounded-lg bg-gray-50 ${
                            resultingAvailable < 0 ? 'border-red-500 text-red-700' : 'border-gray-300 text-gray-700'
                          }`}>
                            <span className="font-medium">{resultingAvailable}</span>
                          </div>
                          {physicalCount > 0 && resultingAvailable >= 0 && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ {currentAvailable} - {physicalCount} = {resultingAvailable}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

export default AddPhysicalTicketsModal

