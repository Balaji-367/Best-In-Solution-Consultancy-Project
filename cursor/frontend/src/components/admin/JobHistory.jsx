import { useState, useEffect, useMemo } from 'react'
import { api, endpoints } from '../../services/api'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import Breadcrumbs from '../Breadcrumbs'
import EmptyState from '../EmptyState'
import DataTable from '../DataTable'
import FilterPanel from '../FilterPanel'

const JobHistory = () => {
  const [allJobs, setAllJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [activeFilters, setActiveFilters] = useState({})

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.get(endpoints.jobs.list)
      setAllJobs(data)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setError(error.message || 'Failed to load job history')
    } finally {
      setLoading(false)
    }
  }

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return allJobs.filter((job) => {
      // Status filter
      if (activeFilters.status && activeFilters.status !== 'all') {
        if (job.status !== activeFilters.status) return false
      }

      // Priority filter
      if (activeFilters.priority && activeFilters.priority !== 'all') {
        if (job.priority !== activeFilters.priority) return false
      }

      // Date range filter
      if (activeFilters.date_from && job.work_date) {
        if (new Date(job.work_date) < new Date(activeFilters.date_from)) return false
      }
      if (activeFilters.date_to && job.work_date) {
        if (new Date(job.work_date) > new Date(activeFilters.date_to)) return false
      }

      return true
    })
  }, [allJobs, activeFilters])

  // Split into categories
  const ongoingJobs = filteredJobs.filter((job) => job.status === 'in_progress')
  const completedJobs = filteredJobs.filter((job) => job.status === 'completed')
  const openJobs = filteredJobs.filter((job) => job.status === 'open')

  // Sort completed jobs by completed_at descending (most recently completed first)
  completedJobs.sort((a, b) => {
    const dateA = new Date(a.completed_at || a.created_at)
    const dateB = new Date(b.completed_at || b.created_at)
    return dateB - dateA
  })

  // Sort ongoing jobs by assigned_at descending (most recently updated first)
  ongoingJobs.sort((a, b) => {
    const dateA = new Date(a.assigned_at || a.updated_at || a.created_at)
    const dateB = new Date(b.assigned_at || b.updated_at || b.created_at)
    return dateB - dateA
  })

  const handleFilterChange = (key, value) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleClearFilters = () => {
    setActiveFilters({})
  }

  const openJobDetails = (job) => {
    setSelectedJob(job)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedJob(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-orange-100 text-orange-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const tableColumns = [
    {
      key: 'id',
      title: 'ID',
      render: (value) => `#${value}`,
    },
    {
      key: 'customer_name',
      title: 'Customer',
      searchable: true,
    },
    {
      key: 'location',
      title: 'Location',
      render: (value) => (
        <span className="truncate max-w-[150px] inline-block" title={value}>
          {value}
        </span>
      ),
      searchable: true,
    },
    {
      key: 'work_date',
      title: 'Work Date',
    },
    {
      key: 'priority',
      title: 'Priority',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {value.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'assigned_to_details',
      title: 'Completed By',
      render: (value) => {
        if (!value) return <span className="text-text-secondary">Unassigned</span>
        return (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{value.username}</span>
          </div>
        )
      },
    },
    {
      key: 'completed_at',
      title: 'Completed At',
      render: (value) => {
        if (!value) return <span className="text-text-secondary">-</span>
        return (
          <span className="text-sm">{new Date(value).toLocaleString()}</span>
        )
      },
    },
  ]

  const rowActions = [
    {
      label: 'View Details',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      onClick: (row) => openJobDetails(row),
    },
  ]

  const filterConfig = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'open', label: 'Open' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
      ],
    },
    {
      key: 'date',
      label: 'Work Date Range',
      type: 'date-range',
    },
  ]

  const LocationMapPreview = ({ lat, lng }) => {
    const { isLoaded, loadError } = useJsApiLoader({
      googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    })

    if (loadError) {
      return (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-text-secondary mb-1">Pinned Location</p>
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {lat.toFixed(6)}, {lng.toFixed(6)} — Open in Google Maps
          </a>
        </div>
      )
    }

    if (!isLoaded) {
      return (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-text-secondary">Loading map preview...</p>
        </div>
      )
    }

    return (
      <div className="mt-2">
        <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: '180px' }}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={{ lat, lng }}
            zoom={15}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
              gestureHandling: 'none',
            }}
          >
            <Marker position={{ lat, lng }} />
          </GoogleMap>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-text-secondary">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Open in Maps
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    )
  }

  const JobDetailsModal = () => {
    if (!showModal || !selectedJob) return null

    const assignedEmployee = selectedJob.assigned_to_details

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="bg-primary p-6 text-white flex justify-between items-center">
            <h2 className="text-2xl font-bold">Job #{selectedJob.id} Details</h2>
            <button onClick={closeModal} className="text-white hover:text-gray-200 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-light pb-2">
                Job Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary">Customer Name</label>
                  <p className="text-text-primary font-semibold">{selectedJob.customer_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">Phone Number</label>
                  <p className="text-text-primary">{selectedJob.phone_number}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-text-secondary">Location</label>
                  <p className="text-text-primary">{selectedJob.location}</p>
                  {selectedJob.latitude && selectedJob.longitude && (
                    <LocationMapPreview
                      lat={parseFloat(selectedJob.latitude)}
                      lng={parseFloat(selectedJob.longitude)}
                    />
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-text-secondary">Issue Description</label>
                  <p className="text-text-primary bg-gray-50 p-3 rounded-lg mt-1">{selectedJob.issue}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">Work Date</label>
                  <p className="text-text-primary">{selectedJob.work_date}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">Priority</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedJob.priority)}`}>
                    {selectedJob.priority}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">Status</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedJob.status)}`}>
                    {selectedJob.status}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-text-secondary">Created At</label>
                  <p className="text-text-primary">{new Date(selectedJob.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-light pb-2">
                Employee Information
              </h3>
              {assignedEmployee ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Assigned To</label>
                    <p className="text-text-primary font-semibold">{assignedEmployee.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Email</label>
                    <p className="text-text-primary">{assignedEmployee.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Role</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      assignedEmployee.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {assignedEmployee.role}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-text-secondary">Assigned At</label>
                    <p className="text-text-primary">
                      {selectedJob.assigned_at ? new Date(selectedJob.assigned_at).toLocaleString() : 'Not recorded'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-text-secondary">
                    {selectedJob.status === 'open'
                      ? 'This job has not been assigned to any employee yet.'
                      : 'This job was handled by a former employee (user no longer exists in the system).'}
                  </p>
                </div>
              )}
            </div>

            {selectedJob.status === 'completed' && (
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4 border-b border-border-light pb-2">
                  Completion Information
                </h3>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-800 mb-2">
                    This job has been completed by {assignedEmployee ? assignedEmployee.username : 'the assigned employee'}.
                  </p>
                  {selectedJob.completed_at && (
                    <p className="text-sm text-green-700">
                      <strong>Completed At:</strong> {new Date(selectedJob.completed_at).toLocaleString()}
                    </p>
                  )}
                  <p className="text-sm text-green-600 mt-2">Check the Submit Report section for detailed completion report.</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border-light bg-gray-50 flex justify-end">
            <button onClick={closeModal} className="btn-secondary px-6 py-2">
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 lg:p-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">Job History</h1>
              <p className="text-text-secondary">Loading job history...</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
          <div className="card p-6">
            <div className="animate-pulse">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-10 flex-1 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl animate-shimmer"></div>
                <div className="h-10 w-32 bg-gray-200 rounded-xl"></div>
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 mb-3 p-4 bg-gray-50/50 rounded-xl">
                  <div className="h-4 flex-1 bg-gray-200 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 lg:p-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">Job History</h1>
              <p className="text-text-secondary">View and manage all service jobs</p>
            </div>
          </div>
          <div className="card border border-red-200 bg-gradient-to-br from-red-50 to-white p-8">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-700 font-semibold mb-2">Failed to Load Job History</p>
              <p className="text-red-600/80 text-sm mb-6">{error}</p>
              <button onClick={fetchJobs} className="btn-primary px-8 py-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Job History</h1>
            <p className="text-text-secondary">View and manage all service jobs</p>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <div className="card p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{filteredJobs.length}</p>
                <p className="text-xs text-text-secondary font-medium">Total Jobs</p>
              </div>
            </div>
          </div>
        </div>

        {allJobs.length > 0 ? (
          <>
            <FilterPanel
              filters={filterConfig}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              activeFilters={activeFilters}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="card hover:shadow-medium transition-shadow duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-text-primary">Ongoing Jobs</h2>
                      <p className="text-sm text-text-secondary">{ongoingJobs.length} active jobs</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold">
                    {ongoingJobs.length}
                  </span>
                </div>
                {ongoingJobs.length > 0 ? (
                  <DataTable
                    data={ongoingJobs}
                    columns={tableColumns}
                    keyField="id"
                    searchable={false}
                    pagination={ongoingJobs.length > 5}
                    itemsPerPage={5}
                    onRowClick={openJobDetails}
                    rowActions={rowActions}
                  />
                ) : (
                  <EmptyState icon="job" title="No Ongoing Jobs" description="No jobs currently in progress." />
                )}
              </div>

              <div className="card hover:shadow-medium transition-shadow duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-text-primary">Open Jobs</h2>
                      <p className="text-sm text-text-secondary">{openJobs.length} waiting for assignment</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                    {openJobs.length}
                  </span>
                </div>
                {openJobs.length > 0 ? (
                  <DataTable
                    data={openJobs}
                    columns={tableColumns}
                    keyField="id"
                    searchable={false}
                    pagination={openJobs.length > 5}
                    itemsPerPage={5}
                    onRowClick={openJobDetails}
                    rowActions={rowActions}
                  />
                ) : (
                  <EmptyState icon="job" title="No Open Jobs" description="No jobs waiting to be assigned." />
                )}
              </div>
            </div>

            <div className="card hover:shadow-medium transition-shadow duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Completed Jobs</h2>
                    <p className="text-sm text-text-secondary">{completedJobs.length} finished jobs</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                  {completedJobs.length}
                </span>
              </div>
              {completedJobs.length > 0 ? (
                <DataTable
                  data={completedJobs}
                  columns={tableColumns}
                  keyField="id"
                  searchable={true}
                  searchPlaceholder="Search completed jobs..."
                  pagination={true}
                  itemsPerPage={10}
                  onRowClick={openJobDetails}
                  rowActions={rowActions}
                />
              ) : (
                <EmptyState icon="success" title="No Completed Jobs" description="No jobs have been completed yet." />
              )}
            </div>
          </>
        ) : (
          <EmptyState icon="job" title="No Jobs Found" description="No service jobs have been created yet." />
        )}

        <JobDetailsModal />
      </div>
    </div>
  )
}

export default JobHistory
