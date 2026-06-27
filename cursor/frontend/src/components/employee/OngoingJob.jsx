import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, endpoints } from '../../services/api'

const OngoingJob = () => {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOngoingJobs = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await api.get(endpoints.jobs.list)

        // Filter only in_progress jobs
        const ongoing = data
          .filter((job) => job.status === 'in_progress')
          // Sort by assigned_at descending (most recently assigned/updated first)
          .sort((a, b) => {
            const dateA = new Date(a.assigned_at || a.updated_at || a.created_at)
            const dateB = new Date(b.assigned_at || b.updated_at || b.created_at)
            return dateB - dateA
          })
          .map((job) => ({
            id: job.id,
            customer: job.customer_name,
            location: job.location,
            latitude: job.latitude,
            longitude: job.longitude,
            issue: job.issue,
            startedDate: job.work_date,
            priority: job.priority,
          }))

        setJobs(ongoing)
      } catch (err) {
        console.error('Error fetching ongoing jobs:', err)
        setError(err.message || 'Failed to load ongoing jobs from server.')
      } finally {
        setLoading(false)
      }
    }

    fetchOngoingJobs()
  }, [])

  const handleFinished = (jobId) => {
    // Navigate to report form with job ID – report page will also update DB
    navigate(`/employee/submit-report?jobId=${jobId}`)
  }

  const getPriorityBadge = (priority) => {
    const colors = {
      high: 'bg-priority-high',
      medium: 'bg-priority-medium',
      low: 'bg-priority-low',
    }
    return colors[priority] || 'bg-text-secondary'
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-green-600 mb-2">Ongoing Jobs</h1>
              <p className="text-text-secondary">Loading your ongoing jobs...</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-3 flex-1">
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="h-10 w-24 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-green-600 mb-2">Ongoing Jobs</h1>
              <p className="text-text-secondary">View and manage your ongoing jobs</p>
            </div>
          </div>
          <div className="card border border-red-200 bg-gradient-to-br from-red-50 to-white p-8">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-700 font-semibold mb-2">Failed to Load Jobs</p>
              <p className="text-red-600/80 text-sm mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="btn-green px-8 py-3 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
    <div className="p-6 md:p-8 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">Ongoing Jobs</h1>
            <p className="text-text-secondary">View and manage your ongoing jobs</p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="card p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{jobs.length}</p>
                <p className="text-xs text-text-secondary font-medium">Active Jobs</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="card text-center py-16 px-6">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-text-secondary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <p className="text-green-600 font-semibold text-lg mb-2">No ongoing jobs at the moment</p>
              <p className="text-text-secondary text-sm">Accepted jobs will appear here. Go to Available Jobs to accept new work.</p>
            </div>
          ) : (
            jobs.map((job, index) => (
              <div key={job.id} className="card p-6 hover:shadow-medium transition-all duration-300" style={{ animation: `fade-in-up 0.3s ease-out ${index * 50}ms forwards`, opacity: 0 }}>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-green-600">Job #{job.id}</h3>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold text-white ${getPriorityBadge(job.priority)}`}>
                        {job.priority.charAt(0).toUpperCase() + job.priority.slice(1)} Priority
                      </span>
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-yellow-500 to-yellow-400 shadow-sm">
                        In Progress
                      </span>
                    </div>

                    <div className="space-y-3 bg-gray-50/50 rounded-xl p-4">
                      <div className="flex items-center gap-3 text-green-600">
                        <svg className="w-5 h-5 text-green-600/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">{job.customer}</span>
                      </div>
                      <div className="flex items-center gap-3 text-green-600">
                        <svg className="w-5 h-5 text-green-600/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{job.location}</span>
                        {job.latitude && job.longitude && (
                          <a
                            href={`https://www.google.com/maps?q=${job.latitude},${job.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1 transition-colors"
                            title="Open in Google Maps"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Maps
                          </a>
                        )}
                      </div>
                      <div className="flex items-start gap-3 text-green-600">
                        <svg className="w-5 h-5 text-green-600/60 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-sm">{job.issue}</span>
                      </div>
                      <div className="flex items-center gap-3 text-text-secondary text-sm">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Started: <span className="font-medium text-green-600">{job.startedDate}</span></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleFinished(job.id)}
                    className="btn-green flex items-center gap-2 whitespace-nowrap shadow-lg shadow-primary/30"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Finish Job
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default OngoingJob
