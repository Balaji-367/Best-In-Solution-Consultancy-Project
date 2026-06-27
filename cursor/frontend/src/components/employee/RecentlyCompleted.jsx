import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { api, endpoints } from '../../services/api'

const RecentlyCompleted = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { userId } = useAuth()

  useEffect(() => {
    fetchCompletedJobs()
  }, [userId])

  const fetchCompletedJobs = async () => {
    setLoading(true)
    try {
      const [data, reportsData] = await Promise.all([
        api.get(endpoints.jobs.list),
        api.get(endpoints.reports.list)
      ])
      
       // Only show jobs completed by the current employee
       const completed = data.filter(job => 
         job.status === 'completed' && 
         job.assigned_to === userId
       )
       
       // Sort by completed_at descending (most recently completed first)
       completed.sort((a, b) => {
         const dateA = new Date(a.completed_at || a.updated_at || a.created_at)
         const dateB = new Date(b.completed_at || b.updated_at || b.created_at)
         return dateB - dateA
       })
       
       const jobsWithReports = completed.map(job => {
        const report = reportsData.find(r => r.job === job.id)
        return {
          id: job.id,
          customer: report ? report.company_name : job.customer_name,
          workDescription: report ? report.work_description : 'No description available',
          timeTaken: report ? report.time_taken : null,
          equipmentUsed: report ? report.equipment_used : null,
        }
      })
      
      setJobs(jobsWithReports)
      setError(null)
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setError(error.message || 'Failed to load completed jobs')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-green-600 mb-2">Recently Completed</h1>
              <p className="text-text-secondary">Loading your completed jobs...</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
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
            <h1 className="text-3xl font-bold text-green-600 mb-2">Recently Completed</h1>
            <p className="text-text-secondary">View your recently completed jobs</p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="card p-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{jobs.length}</p>
                <p className="text-xs text-text-secondary font-medium">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="card border border-red-200 bg-gradient-to-br from-red-50 to-white p-6 mb-6">
            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-red-700 font-semibold mb-1">Failed to Load Jobs</p>
              <p className="text-red-600/80 text-sm mb-4">{error}</p>
              <button 
                onClick={fetchCompletedJobs}
                className="btn-green px-6 py-2.5 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job, index) => (
            <div key={job.id} className="card p-6 hover:shadow-medium transition-all duration-300" style={{ animation: `fade-in-up 0.3s ease-out ${index * 75}ms forwards`, opacity: 0 }}>
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-green-600">Job #{job.id}</h3>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full shadow-sm">Completed</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Company/Customer</label>
                  <p className="text-green-600 font-semibold mt-1">{job.customer}</p>
                </div>
                {job.timeTaken && (
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Time Taken</label>
                    <p className="text-green-600 mt-1 font-medium">{job.timeTaken}</p>
                  </div>
                )}
                {job.equipmentUsed && (
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Equipment Used</label>
                    <p className="text-green-600 mt-1">{job.equipmentUsed}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Work Description</label>
                  <p className="text-green-600 mt-1 text-sm leading-relaxed">{job.workDescription}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {jobs.length === 0 && !error && (
          <div className="card text-center py-16 px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-text-secondary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <p className="text-green-600 font-semibold text-lg mb-2">No completed jobs yet</p>
            <p className="text-text-secondary text-sm">Your completed jobs will appear here.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecentlyCompleted



