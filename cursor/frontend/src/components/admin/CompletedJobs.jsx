import { useState, useEffect } from 'react'
import { api, endpoints } from '../../services/api'
import Breadcrumbs from '../Breadcrumbs'
import DataTable from '../DataTable'

const CompletedJobs = () => {
  const [jobs, setJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedJob, setSelectedJob] = useState(null)
  const [selectedJobReport, setSelectedJobReport] = useState(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [dateFilter, setDateFilter] = useState('all')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  useEffect(() => {
    fetchJobs()
  }, [])

  useEffect(() => {
    filterJobsByDate()
  }, [jobs, dateFilter, customStart, customEnd])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.get(endpoints.jobs.list)
      const completedJobs = data.filter((job) => job.status === 'completed')
      completedJobs.sort((a, b) => {
        const dateA = new Date(a.completed_at || a.created_at)
        const dateB = new Date(b.completed_at || b.created_at)
        return dateB - dateA
      })
      setJobs(completedJobs)
    } catch (error) {
      console.error('Error fetching completed jobs:', error)
      setError(error.message || 'Failed to load completed jobs')
    } finally {
      setLoading(false)
    }
  }

  const filterJobsByDate = () => {
    const now = new Date()
    let startDate = new Date()

    if (dateFilter === '1d') {
      startDate.setDate(now.getDate() - 1)
    } else if (dateFilter === '1w') {
      startDate.setDate(now.getDate() - 7)
    } else if (dateFilter === '1m') {
      startDate.setMonth(now.getMonth() - 1)
    } else if (dateFilter === 'all') {
      startDate = new Date(2000, 0, 1)
    } else if (dateFilter === 'custom' && customStart && customEnd) {
      startDate = new Date(customStart)
      const endDate = new Date(customEnd)
      endDate.setHours(23, 59, 59, 999)
      const filtered = jobs.filter(job => {
        const jobDate = new Date(job.completed_at || job.created_at)
        return jobDate >= startDate && jobDate <= endDate
      })
      setFilteredJobs(filtered)
      return
    }

    const filtered = jobs.filter(job => {
      const jobDate = new Date(job.completed_at || job.created_at)
      return jobDate >= startDate
    })
    setFilteredJobs(filtered)
  }

  const openJobDetails = async (job) => {
    setSelectedJob(job)
    setSelectedJobReport(null)
    setShowModal(true)

    setLoadingReport(true)
    try {
      const reports = await api.get(endpoints.reports.byJob(job.id))
      if (reports && reports.length > 0) {
        setSelectedJobReport(reports[0])
      }
    } catch (error) {
      console.error('Error fetching job report:', error)
    } finally {
      setLoadingReport(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedJob(null)
    setSelectedJobReport(null)
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
      key: 'assigned_to_details',
      title: 'Completed By',
      render: (value) => {
        if (!value) return <span className="text-text-secondary">Unknown</span>
        return <span>{value.username}</span>
      },
    },
    {
      key: 'completed_at',
      title: 'Completed At',
      render: (value) => value ? new Date(value).toLocaleString() : '-',
    },
  ]

  const rowActions = [
    {
      label: 'View',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      onClick: (row) => openJobDetails(row),
    },
  ]

  const emptyState = (
    <div className="card text-center py-12">
      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 className="text-lg font-semibold text-text-primary mb-2">No Completed Jobs</h3>
      <p className="text-text-secondary">Completed jobs will appear here.</p>
    </div>
  )

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs />
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Completed Jobs</h1>
            <p className="text-sm text-text-secondary">View completed job history</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field py-2 text-sm"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="1w">Last 7 Days</option>
              <option value="1m">Last 30 Days</option>
              <option value="all">All Time</option>
              <option value="custom">Custom Range</option>
            </select>
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="input-field py-2 text-sm"
                />
                <span className="text-text-secondary">to</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="input-field py-2 text-sm"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mb-4 text-sm text-text-secondary">
          Showing {filteredJobs.length} of {jobs.length} completed jobs
        </div>

        {error ? (
          <div className="card border border-red-200 bg-gradient-to-br from-red-50 to-white">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-700 font-semibold mb-2">Unable to Load Jobs</p>
              <p className="text-red-600/80 text-sm mb-6">{error}</p>
              <button onClick={fetchJobs} className="btn-primary px-8 py-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <DataTable
            data={filteredJobs}
            columns={tableColumns}
            rowActions={rowActions}
            loading={loading}
            emptyState={emptyState}
            searchPlaceholder="Search completed jobs..."
          />
        )}

        {showModal && selectedJob && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-fade-in-up">
              <div className="bg-gradient-to-r from-green-600 to-green-500 p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Job #{selectedJob.id}</h2>
                    <p className="text-green-100 text-sm">Completed Job Details</p>
                  </div>
                </div>
                <button onClick={closeModal} className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <div className="mb-6">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Completed
                  </span>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-text-primary mb-4 border-b pb-2">
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
                      <label className="text-sm font-medium text-text-secondary">Created At</label>
                      <p className="text-text-primary">{new Date(selectedJob.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Completed At</label>
                      <p className="text-text-primary">{selectedJob.completed_at ? new Date(selectedJob.completed_at).toLocaleString() : 'Not recorded'}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-text-primary mb-4 border-b pb-2">
                    Completion Information
                  </h3>
                  {selectedJob.assigned_to_details ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Completed By</label>
                        <p className="text-text-primary font-semibold">{selectedJob.assigned_to_details.username}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Email</label>
                        <p className="text-text-primary">{selectedJob.assigned_to_details.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-text-secondary">Employee no longer exists</p>
                  )}
                </div>

                {selectedJobReport && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-text-primary mb-4 border-b pb-2">
                      Completion Report
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Company Name</label>
                        <p className="text-text-primary">{selectedJobReport.company_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Time Taken</label>
                        <p className="text-text-primary">{selectedJobReport.time_taken}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-text-secondary">Equipment Used</label>
                        <p className="text-text-primary">{selectedJobReport.equipment_used}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-text-secondary">Work Description</label>
                        <p className="text-text-primary bg-gray-50 p-3 rounded-lg mt-1">{selectedJobReport.work_description}</p>
                      </div>
                      {selectedJobReport.completion_photo && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-text-secondary">Completion Photo</label>
                          <img
                            src={selectedJobReport.completion_photo}
                            alt="Completion"
                            className="mt-2 max-w-full h-auto max-h-64 rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {loadingReport && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-text-secondary">Loading report...</span>
                  </div>
                )}

                {!loadingReport && !selectedJobReport && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-600">No completion report submitted.</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t bg-gray-50 flex justify-end">
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

export default CompletedJobs
