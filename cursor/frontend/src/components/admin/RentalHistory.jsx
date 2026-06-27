import { useState, useEffect, useMemo } from 'react'
import { api, endpoints } from '../../services/api'
import { useToast } from '../Toast'
import Breadcrumbs from '../Breadcrumbs'
import EmptyState from '../EmptyState'
import DataTable from '../DataTable'
import FilterPanel from '../FilterPanel'
import LoadingSkeleton from '../LoadingSkeleton'

const RentalHistory = () => {
  const { success: showSuccessToast, error: showErrorToast } = useToast()
  const [rentals, setRentals] = useState([])
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilters, setActiveFilters] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingRentalId, setDeletingRentalId] = useState(null)

  useEffect(() => {
    fetchRentalsAndDevices()

    const handleFocus = () => fetchRentalsAndDevices()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchRentalsAndDevices()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
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
          securityDeposit: Number(rental.security_deposit) || 0,
          status: rental.status,
          idProof: rental.id_proof,
          createdAt: rental.created_at,
          returnedAt: rental.updated_at || rental.created_at,
        }
      })

      const returnedRentals = enrichedRentals.filter(
        (rental) => rental.status === 'returned'
      )

      setRentals(returnedRentals)
      setDevices(devicesData)
    } catch (err) {
      console.error('Error fetching rentals:', err)
      setError(err.message || 'Failed to load rental history. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Filter logic
  const filteredRentals = useMemo(() => {
    return rentals.filter((rental) => {
      // Date range filter
      if (activeFilters.date_from && rental.returnedAt) {
        if (new Date(rental.returnedAt) < new Date(activeFilters.date_from)) return false
      }
      if (activeFilters.date_to && rental.returnedAt) {
        if (new Date(rental.returnedAt) > new Date(activeFilters.date_to)) return false
      }

      return true
    })
  }, [rentals, activeFilters])

  const handleFilterChange = (key, value) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleClearFilters = () => {
    setActiveFilters({})
    showSuccessToast('Filters cleared')
  }

  const handleDelete = (rentalId) => {
    setDeletingRentalId(rentalId)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    try {
      await api.delete(endpoints.rentals.detail(deletingRentalId))
      setRentals(prev => prev.filter(r => r.id !== deletingRentalId))
      setShowDeleteConfirm(false)
      setDeletingRentalId(null)
      showSuccessToast('Rental deleted successfully')
    } catch (error) {
      console.error('Error deleting rental:', error)
      showErrorToast(error.message || 'Failed to delete rental')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount) => {
    return '₹' + Number(amount).toLocaleString('en-IN')
  }

  const tableColumns = [
    {
      key: 'id',
      title: 'ID',
      render: (value) => `#${value}`,
    },
    {
      key: 'customerName',
      title: 'Customer',
      searchable: true,
    },
    {
      key: 'phoneNumber',
      title: 'Phone',
      render: (value) => value || 'N/A',
    },
    {
      key: 'deviceName',
      title: 'Device',
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-text-secondary">{row.deviceModel}</div>
        </div>
      ),
      searchable: true,
    },
    {
      key: 'deviceSerial',
      title: 'Serial No',
    },
    {
      key: 'fromDate',
      title: 'From Date',
      render: (value) => formatDate(value),
    },
    {
      key: 'toDate',
      title: 'To Date',
      render: (value) => formatDate(value),
    },
    {
      key: 'rentalDays',
      title: 'Days',
      render: (value) => `${value} days`,
    },
    {
      key: 'securityDeposit',
      title: 'Deposit',
      render: (value) => formatCurrency(value),
    },
    {
      key: 'status',
      title: 'Status',
      render: () => (
        <span className="px-2 py-1 rounded-full text-xs font-medium text-white bg-green-600">
          Returned
        </span>
      ),
    },
  ]

  const rowActions = [
    {
      label: 'View ID Proof',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      onClick: (row) => {
        if (row.idProof) {
          window.open(row.idProof, '_blank')
        } else {
          showSuccessToast('No ID proof available for this rental')
        }
      },
      disabled: (row) => !row.idProof,
    },
    {
      label: 'Delete',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onClick: (row) => handleDelete(row.id),
      className: 'text-red-600 hover:bg-red-50',
    },
  ]

  const filterConfig = [
    {
      key: 'date',
      label: 'Return Date Range',
      type: 'date-range',
    },
  ]

  const totalDeposits = filteredRentals.reduce((sum, r) => sum + r.securityDeposit, 0)
  const totalDays = filteredRentals.reduce((sum, r) => sum + r.rentalDays, 0)

  if (loading) {
    return (
      <div className="p-6 md:p-8 lg:p-10 page-transition">
        <div className="max-w-7xl mx-auto">
          <LoadingSkeleton type="page-header" className="mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <LoadingSkeleton type="stat-card" count={3} />
          </div>
          <LoadingSkeleton type="card" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 lg:p-10">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Rental History</h1>
          <div className="card border border-red-300 bg-red-50">
            <div className="flex flex-col items-center justify-center py-8">
              <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-700 mb-4">{error}</p>
              <button onClick={fetchRentalsAndDevices} className="btn-primary px-6 py-2">
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 page-transition">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs />
        
        {/* Header - Compact Mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="mb-2 sm:mb-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Rental History</h1>
            <p className="text-xs text-gray-500 hidden sm:block">Completed rentals</p>
          </div>
          <span className="self-start sm:self-auto px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            {filteredRentals.length} Completed
          </span>
        </div>

        {/* Stats Bar - Compact on Mobile */}
        {rentals.length > 0 && (
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-3 sm:p-4 mb-4 text-white">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div>
                <p className="text-lg sm:text-2xl font-bold">{filteredRentals.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-300">Rentals</p>
              </div>
              <div className="border-x border-gray-600">
                <p className="text-base sm:text-xl font-bold truncate">{formatCurrency(totalDeposits)}</p>
                <p className="text-[10px] sm:text-xs text-gray-300">Deposits</p>
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold">{totalDays}</p>
                <p className="text-[10px] sm:text-xs text-gray-300">Days</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar - Compact on Mobile */}
        {rentals.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-2 sm:p-3 mb-3 sm:mb-4 border border-gray-200">
            <div className="flex flex-col gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                />
                <span className="text-gray-400 text-xs">to</span>
                <input
                  type="date"
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Rental Cards - Flipkart Style */}
        {filteredRentals.length > 0 ? (
          <div className="space-y-2 sm:space-y-3">
            {filteredRentals.map((rental) => (
              <div key={rental.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-2.5 sm:p-4">
                  <div className="flex gap-2.5 sm:gap-4">
                    {/* Device Icon */}
                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <svg className="w-7 h-7 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{rental.deviceName}</h3>
                          <p className="text-xs text-gray-500 truncate">{rental.deviceModel}</p>
                        </div>
                        <span className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 bg-green-100 text-green-700 text-[10px] sm:text-xs font-medium rounded-full whitespace-nowrap">
                          ✓ Done
                        </span>
                      </div>
                      
                      {/* Details - Compact Grid */}
                      <div className="mt-1.5 sm:mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] sm:text-xs">
                        <p className="truncate">
                          <span className="text-gray-400">Customer:</span>{' '}
                          <span className="text-gray-700">{rental.customerName}</span>
                        </p>
                        <p className="truncate">
                          <span className="text-gray-400">Phone:</span>{' '}
                          <span className="text-gray-700">{rental.phoneNumber || 'N/A'}</span>
                        </p>
                        <p className="truncate">
                          <span className="text-gray-400">Days:</span>{' '}
                          <span className="text-gray-700">{rental.rentalDays}</span>
                        </p>
                        <p className="truncate">
                          <span className="text-gray-400">Deposit:</span>{' '}
                          <span className="text-gray-700 font-medium">{formatCurrency(rental.securityDeposit)}</span>
                        </p>
                      </div>

                      {/* Dates - Horizontal Scroll on Mobile */}
                      <div className="mt-1.5 sm:mt-2 flex gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-400 overflow-x-auto whitespace-nowrap pb-1">
                        <span>{formatDate(rental.fromDate)}</span>
                        <span>-</span>
                        <span>{formatDate(rental.toDate)}</span>
                        <span className="font-mono text-[9px] sm:text-[10px]">{rental.deviceSerial}</span>
                      </div>
                    </div>

                    {/* Actions - Compact */}
                    <div className="flex flex-col gap-1 sm:gap-2 items-end justify-start">
                      {rental.idProof && (
                        <button
                          onClick={() => window.open(rental.idProof, '_blank')}
                          className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] sm:text-xs font-medium rounded flex items-center gap-1"
                        >
                          ID
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(rental.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 text-center border border-gray-200">
            <svg className="w-10 h-10 sm:w-14 sm:h-14 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-1">No Completed Rentals</h3>
            <p className="text-xs sm:text-sm text-gray-500">Returned rentals will appear here</p>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="bg-red-500 p-4 text-white flex justify-between items-center rounded-t-xl">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h2 className="text-lg font-bold">Confirm Delete</h2>
                </div>
                <button onClick={() => setShowDeleteConfirm(false)} className="text-white hover:text-gray-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-5">
                <p className="text-gray-700 mb-4 text-sm">
                  Are you sure you want to delete this rental record? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RentalHistory
