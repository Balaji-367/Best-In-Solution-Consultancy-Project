import { useState, useEffect } from 'react'
import { api, endpoints } from '../../services/api'
import { useToast } from '../Toast'
import Breadcrumbs from '../Breadcrumbs'

const OngoingRentals = () => {
  const { success: showSuccessToast, error: showErrorToast } = useToast()
  const [rentals, setRentals] = useState([])
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [returningId, setReturningId] = useState(null)
  const [selectedRental, setSelectedRental] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchRentalsAndDevices()
  }, [])

  const fetchRentalsAndDevices = async () => {
    try {
      setLoading(true)
      setError('')

      const [rentalsData, devicesData] = await Promise.all([
        api.get(endpoints.rentals.list),
        api.get(endpoints.devices.list),
      ])

      const deviceMap = {}
      devicesData.forEach((device) => {
        deviceMap[device.serial_no] = device
      })

      const enrichedRentals = rentalsData.map((rental) => {
        const device = deviceMap[rental.device_serial] || {}
        const today = new Date()
        const toDate = new Date(rental.to_date)
        const fromDate = new Date(rental.from_date)

        let dateStatus
        if (toDate < today) {
          dateStatus = 'overdue'
        } else if (fromDate <= today && toDate >= today) {
          dateStatus = 'active'
        } else {
          dateStatus = 'upcoming'
        }

        return {
          id: rental.id,
          customerName: rental.customer_name,
          phoneNumber: rental.phone_number,
          deviceSerial: rental.device_serial,
          deviceModel: device.model || 'Unknown Device',
          deviceName: device.device_name || 'Unnamed Device',
          fromDate: rental.from_date,
          toDate: rental.to_date,
          rentalDays: rental.rental_days,
          securityDeposit: rental.security_deposit,
          status: rental.status,
          dateStatus: dateStatus,
          idProof: rental.id_proof,
          createdAt: rental.created_at,
        }
      })

      const ongoingRentals = enrichedRentals.filter(
        (rental) => rental.status === 'active'
      )

      setRentals(ongoingRentals)
      setDevices(devicesData)
    } catch (err) {
      console.error('Error fetching rentals:', err)
      setError(err.message || 'Failed to load ongoing rentals. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReturn = async (rentalId) => {
    try {
      setReturningId(rentalId)
      setError('')

      const response = await api.post(
        endpoints.rentals.return(rentalId),
        {}
      )

      showSuccessToast(
        `Device ${response.device_serial} marked as returned successfully!`
      )

      setRentals((prevRentals) =>
        prevRentals.filter((rental) => rental.id !== rentalId)
      )
    } catch (err) {
      console.error('Error returning rental:', err)
      showErrorToast(err.message || 'Failed to return rental. Please try again.')
    } finally {
      setReturningId(null)
    }
  }

  const handleView = (rental) => {
    setSelectedRental(rental)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedRental(null)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₹0'
    return '₹' + Number(amount).toLocaleString('en-IN')
  }

  const getDateStatusBadge = (dateStatus) => {
    switch (dateStatus) {
      case 'active':
        return (
          <span className="px-3 py-1 rounded-full text-sm font-medium text-white bg-green-500">
            Currently Active
          </span>
        )
      case 'overdue':
        return (
          <span className="px-3 py-1 rounded-full text-sm font-medium text-white bg-red-500">
            Overdue
          </span>
        )
      case 'upcoming':
        return (
          <span className="px-3 py-1 rounded-full text-sm font-medium text-white bg-yellow-500">
            Upcoming
          </span>
        )
      default:
        return (
          <span className="px-3 py-1 rounded-full text-sm font-medium text-white bg-gray-500">
            Unknown
          </span>
        )
    }
  }

  const filteredRentals = rentals.filter((rental) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      rental.customerName.toLowerCase().includes(searchLower) ||
      rental.deviceSerial.toLowerCase().includes(searchLower) ||
      rental.deviceName.toLowerCase().includes(searchLower) ||
      rental.phoneNumber?.toLowerCase().includes(searchLower)

    const matchesStatus = statusFilter === 'all' || rental.dateStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const RentalCard = ({ rental }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all p-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:gap-3">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
              #{rental.id} - {rental.customerName}
            </h3>
          </div>
          <div className="flex-shrink-0">
            {getDateStatusBadge(rental.dateStatus)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
          <div className="min-w-0">
            <p className="text-gray-400 text-[10px] sm:text-xs uppercase">Device</p>
            <p className="font-medium text-gray-900 truncate">{rental.deviceName}</p>
            <p className="text-gray-500 text-[10px] sm:text-xs truncate">{rental.deviceModel}</p>
          </div>
          <div className="min-w-0">
            <p className="text-gray-400 text-[10px] sm:text-xs uppercase">Serial</p>
            <p className="font-medium text-gray-900 text-[10px] sm:text-xs truncate">{rental.deviceSerial}</p>
          </div>
          <div>
            <p className="text-gray-400 text-[10px] sm:text-xs uppercase">Days</p>
            <p className="font-medium text-gray-900">{rental.rentalDays}</p>
          </div>
          <div>
            <p className="text-gray-400 text-[10px] sm:text-xs uppercase">Deposit</p>
            <p className="font-semibold text-gray-900 text-xs sm:text-sm">{formatCurrency(rental.securityDeposit)}</p>
          </div>
        </div>

        <div className="text-[10px] sm:text-xs text-gray-500 truncate">
          {formatDate(rental.fromDate)} → {formatDate(rental.toDate)}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => handleView(rental)}
            className="flex-1 px-2 py-1.5 sm:px-3 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-medium rounded-lg flex items-center justify-center gap-1 transition-colors"
          >
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span>View</span>
            </button>
            <button
              onClick={() => handleReturn(rental.id)}
              disabled={returningId === rental.id}
              className={`flex-1 btn-primary py-3 flex items-center justify-center gap-2 ${
                returningId === rental.id
                  ? 'opacity-70 cursor-not-allowed'
                  : ''
              }`}
            >
              {returningId === rental.id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Mark as Returned</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
  )

  if (loading) {
    return (
      <div className="p-6 md:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Ongoing Rentals
          </h1>
          <p className="text-text-secondary mb-8">Loading rental data...</p>
          <div className="card">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Ongoing Rentals
          </h1>
          <div className="card border border-red-300 bg-red-50">
            <div className="flex flex-col items-center justify-center py-8">
              <svg
                className="w-12 h-12 text-red-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={fetchRentalsAndDevices}
                className="btn-primary px-6 py-2 flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="mb-2 sm:mb-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-text-primary">
              Ongoing Rentals
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary hidden sm:block">
              Manage active rentals
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right px-3 py-1.5 bg-white rounded-lg shadow-sm">
              <p className="text-lg sm:text-xl font-bold text-text-primary">
                {filteredRentals.length}
              </p>
              <p className="text-[10px] sm:text-xs text-text-secondary">
                {searchTerm || statusFilter !== 'all' ? 'Filtered' : 'Active'}
              </p>
            </div>
          </div>
        </div>

        {rentals.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-2 sm:p-3 mb-4 border border-gray-200">
            <div className="flex flex-col gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Currently Active</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {filteredRentals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredRentals.map((rental) => (
              <RentalCard key={rental.id} rental={rental} />
            ))}
          </div>
        ) : rentals.length > 0 ? (
          <div className="bg-white rounded-lg p-6 sm:p-8 text-center border border-gray-200">
            <svg className="w-10 h-10 sm:w-14 sm:h-14 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-sm sm:text-base font-semibold text-text-primary mb-1">No Results Found</h3>
            <p className="text-xs sm:text-sm text-text-secondary mb-3">Adjust your search or filter.</p>
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
              className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 sm:p-8 text-center border border-gray-200">
            <svg
              className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-sm sm:text-base font-semibold text-text-primary mb-1">
              No Ongoing Rentals
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary">
              No active rentals in the system.
            </p>
          </div>
        )}

        {rentals.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-blue-50 border-blue-200">
              <p className="text-blue-600 text-sm font-medium">
                Total Security Deposits
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(
                  rentals.reduce(
                    (sum, r) => sum + Number(r.securityDeposit || 0),
                    0
                  )
                )}
              </p>
            </div>
            <div className="bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
              <p className="text-yellow-600 text-xs sm:text-sm font-medium">
                Upcoming
              </p>
              <p className="text-lg sm:text-xl font-bold text-yellow-900">
                {
                  rentals.filter((r) => r.dateStatus === 'upcoming').length
                }
              </p>
            </div>
            <div className="bg-red-50 px-3 py-2 rounded-lg border border-red-200">
              <p className="text-red-600 text-xs sm:text-sm font-medium">Overdue</p>
              <p className="text-lg sm:text-xl font-bold text-red-900">
                {rentals.filter((r) => r.dateStatus === 'overdue').length}
              </p>
            </div>
          </div>
        )}

        {showModal && selectedRental && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg sm:max-w-2xl w-full max-h-[90vh] overflow-hidden">
              <div className="bg-blue-600 p-3 sm:p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h2 className="text-base sm:text-xl font-bold">Rental #{selectedRental.id}</h2>
                </div>
                <button onClick={closeModal} className="text-white hover:text-gray-200 transition-colors">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-3 sm:p-6 overflow-y-auto max-h-[70vh]">
                <div className="mb-4">
                  {getDateStatusBadge(selectedRental.dateStatus)}
                </div>

                <div className="mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-text-primary mb-3 border-b border-border-light pb-2">
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-text-secondary">Customer Name</label>
                      <p className="text-sm sm:text-base text-text-primary font-semibold truncate">{selectedRental.customerName}</p>
                    </div>
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-text-secondary">Phone Number</label>
                      <p className="text-sm sm:text-base text-text-primary">{selectedRental.phoneNumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-light pb-2">
                    Device Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Device Name</label>
                      <p className="text-text-primary font-semibold">{selectedRental.deviceName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Model</label>
                      <p className="text-text-primary">{selectedRental.deviceModel}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-text-secondary">Serial Number</label>
                      <p className="text-text-primary font-mono">{selectedRental.deviceSerial}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-light pb-2">
                    Rental Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text-secondary">From Date</label>
                      <p className="text-text-primary">{formatDate(selectedRental.fromDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">To Date</label>
                      <p className="text-text-primary">{formatDate(selectedRental.toDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Rental Period</label>
                      <p className="text-text-primary">{selectedRental.rentalDays} days</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Security Deposit</label>
                      <p className="text-text-primary font-semibold">{formatCurrency(selectedRental.securityDeposit)}</p>
                    </div>
                  </div>
                </div>

                {selectedRental.idProof && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-light pb-2">
                      ID Proof
                    </h3>
                    <div className="border border-border-light rounded-lg p-4 bg-gray-50">
                      <img
                        src={selectedRental.idProof}
                        alt="ID Proof"
                        className="max-w-full h-auto max-h-64 rounded-lg mx-auto cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(selectedRental.idProof, '_blank')}
                      />
                      <p className="text-xs text-text-secondary text-center mt-2">
                        Click image to view full size
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-text-secondary">Created At</label>
                  <p className="text-text-primary">
                    {selectedRental.createdAt ? new Date(selectedRental.createdAt).toLocaleString() : '-'}
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-border-light bg-gray-50 flex justify-end">
                <button onClick={closeModal} className="btn-secondary px-6 py-2">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OngoingRentals
