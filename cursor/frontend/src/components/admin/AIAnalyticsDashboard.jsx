import { useState, useEffect } from 'react'
import { api, endpoints } from '../../services/api'

const AIAnalyticsDashboard = () => {
  const [trends, setTrends] = useState(null)
  const [staffPerformance, setStaffPerformance] = useState([])
  const [workload, setWorkload] = useState([])
  const [inventoryAlerts, setInventoryAlerts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState(30)
  const [activeTab, setActiveTab] = useState('trends')

  useEffect(() => {
    loadAnalytics()
  }, [selectedPeriod])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const [trendsData, staffData, workloadData, alertsData] = await Promise.all([
        api.get(`${endpoints.ai.trends}?days=${selectedPeriod}`),
        api.get(endpoints.ai.staffPerformance),
        api.get(endpoints.ai.workload),
        api.get(endpoints.ai.inventoryAlerts),
      ])
      
      setTrends(trendsData)
      setStaffPerformance(staffData.staff_performance || [])
      setWorkload(workloadData.workloads || [])
      setInventoryAlerts(alertsData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const getWorkloadColor = (status) => {
    switch (status) {
      case 'available': return 'text-gray-600 bg-gray-100'
      case 'light': return 'text-green-600 bg-green-100'
      case 'normal': return 'text-blue-600 bg-blue-100'
      case 'busy': return 'text-yellow-600 bg-yellow-100'
      case 'overloaded': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const tabs = [
    { id: 'trends', label: 'Trends', icon: '📊' },
    { id: 'performance', label: 'Staff Performance', icon: '👥' },
    { id: 'workload', label: 'Workload', icon: '⚖️' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
  ]

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary">AI Analytics</h1>
          <p className="text-text-secondary text-sm">AI powered insights</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="input-field text-sm py-2"
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
          <button
            onClick={loadAnalytics}
            className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center gap-1 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            <span className="text-xs sm:text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'trends' && trends && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 sm:p-4 text-center">
              <p className="text-blue-100 text-xs">Total Jobs</p>
              <p className="text-2xl sm:text-3xl font-bold truncate">{trends.total_jobs}</p>
              <p className="text-blue-200 text-xs truncate">{selectedPeriod} days</p>
            </div>
            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white p-3 sm:p-4 text-center">
              <p className="text-green-100 text-xs">Completion</p>
              <p className="text-2xl sm:text-3xl font-bold">{trends.completion_rate}%</p>
              <p className="text-green-200 text-xs truncate">{trends.completed_jobs} done</p>
            </div>
            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white p-3 sm:p-4 text-center">
              <p className="text-purple-100 text-xs">Avg/Day</p>
              <p className="text-2xl sm:text-3xl font-bold">{trends.avg_jobs_per_day}</p>
              <p className="text-purple-200 text-xs">daily</p>
            </div>
            <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white p-3 sm:p-4 text-center">
              <p className="text-orange-100 text-xs">Insights</p>
              <p className="text-2xl sm:text-3xl font-bold">{trends.insights?.length || 0}</p>
              <p className="text-orange-200 text-xs">AI recs</p>
            </div>
          </div>

          {trends.insights && trends.insights.length > 0 && (
            <div className="card bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
              <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Insights
              </h3>
              <ul className="space-y-2">
                {trends.insights.map((insight, i) => (
                  <li key={i} className="text-amber-700 flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-semibold text-text-primary mb-4">Jobs by Category</h3>
              <div className="space-y-3">
                {Object.entries(trends.by_category || {}).map(([category, count]) => (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">{category}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(count / trends.total_jobs) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {Object.keys(trends.by_category || {}).length === 0 && (
                  <p className="text-text-secondary text-sm">No category data available</p>
                )}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-text-primary mb-4">Jobs by Priority</h3>
              <div className="space-y-3">
                {Object.entries(trends.by_priority || {}).map(([priority, count]) => (
                  <div key={priority}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary capitalize">{priority}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          priority === 'high' ? 'bg-red-500' :
                          priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(count / trends.total_jobs) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'performance' && (
        <div className="card overflow-hidden">
          <h3 className="font-semibold text-text-primary mb-3 text-sm sm:text-base">Staff Performance</h3>
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 sm:px-4 font-semibold text-text-secondary text-xs">Employee</th>
                  <th className="text-center py-2 px-2 sm:px-4 font-semibold text-text-secondary text-xs">Total</th>
                  <th className="text-center py-2 px-2 sm:px-4 font-semibold text-text-secondary text-xs">Done</th>
                  <th className="text-center py-2 px-2 sm:px-4 font-semibold text-text-secondary text-xs">Active</th>
                  <th className="text-center py-2 px-2 sm:px-4 font-semibold text-text-secondary text-xs">Open</th>
                  <th className="text-center py-2 px-2 sm:px-4 font-semibold text-text-secondary text-xs">Time</th>
                </tr>
              </thead>
              <tbody>
                {staffPerformance.map((staff) => (
                  <tr key={staff.employee_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-2 sm:px-4">
                      <div>
                        <p className="font-medium text-text-primary text-sm truncate max-w-[120px] sm:max-w-none">{staff.employee_name}</p>
                        <p className="text-xs text-text-secondary hidden sm:block">{staff.email}</p>
                      </div>
                    </td>
                    <td className="text-center py-2 px-2 sm:px-4 text-sm">{staff.total_assigned}</td>
                    <td className="text-center py-2 px-2 sm:px-4 text-green-600 text-sm">{staff.completed}</td>
                    <td className="text-center py-2 px-2 sm:px-4 text-blue-600 text-sm">{staff.in_progress}</td>
                    <td className="text-center py-2 px-2 sm:px-4 text-yellow-600 text-sm">{staff.open}</td>
                    <td className="text-center py-2 px-2 sm:px-4 text-text-secondary text-sm">
                      {staff.avg_time_minutes ? `${staff.avg_time_minutes}m` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {staffPerformance.length === 0 && (
              <p className="text-center py-8 text-text-secondary">No staff data available</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'workload' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-text-secondary text-sm">Total Active</p>
              <p className="text-3xl font-bold text-text-primary">{workload.reduce((sum, w) => sum + w.total_active, 0)}</p>
            </div>
            <div className="card text-center">
              <p className="text-text-secondary text-sm">Available Staff</p>
              <p className="text-3xl font-bold text-green-600">
                {workload.filter(w => w.total_active === 0).length}
              </p>
            </div>
            <div className="card text-center">
              <p className="text-text-secondary text-sm">Overloaded</p>
              <p className="text-3xl font-bold text-red-600">
                {workload.filter(w => w.status === 'overloaded').length}
              </p>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-text-primary mb-4">Workload Distribution</h3>
            <div className="space-y-4">
              {workload.map((w) => (
                <div key={w.employee_id} className="flex items-center gap-4">
                  <div className="w-32">
                    <p className="font-medium text-text-primary truncate">{w.employee_name}</p>
                    <p className="text-xs text-text-secondary">{w.email}</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          w.status === 'available' ? 'bg-gray-400' :
                          w.status === 'light' ? 'bg-green-400' :
                          w.status === 'normal' ? 'bg-blue-400' :
                          w.status === 'busy' ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${w.workload_percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-40 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWorkloadColor(w.status)}`}>
                      {w.status}
                    </span>
                    <p className="text-xs text-text-secondary mt-1">
                      {w.total_active} active • {w.completed_this_week} this week
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && inventoryAlerts && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 sm:p-4 text-center">
              <p className="text-blue-100 text-xs">Total</p>
              <p className="text-2xl sm:text-3xl font-bold truncate">{inventoryAlerts.summary.total_devices}</p>
            </div>
            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white p-3 sm:p-4 text-center">
              <p className="text-green-100 text-xs">Available</p>
              <p className="text-2xl sm:text-3xl font-bold">{inventoryAlerts.summary.available}</p>
            </div>
            <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white p-3 sm:p-4 text-center">
              <p className="text-orange-100 text-xs">Rented</p>
              <p className="text-2xl sm:text-3xl font-bold">{inventoryAlerts.summary.rented}</p>
            </div>
            <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white p-3 sm:p-4 text-center">
              <p className="text-red-100 text-xs">Maintenance</p>
              <p className="text-2xl sm:text-3xl font-bold">{inventoryAlerts.summary.maintenance}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {inventoryAlerts.high_usage_alerts?.length > 0 && (
              <div className="card bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2 text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  High Usage
                </h3>
                <div className="space-y-2">
                  {inventoryAlerts.high_usage_alerts.map((device, i) => (
                    <div key={i} className="bg-white rounded-lg p-2 sm:p-3 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-amber-800 text-sm truncate">{device.device_name}</p>
                          <p className="text-xs text-amber-600 truncate">{device.serial_no}</p>
                        </div>
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs flex-shrink-0 ml-2">
                          {device.rental_count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inventoryAlerts.inactive_alerts?.length > 0 && (
              <div className="card bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  Inactive
                </h3>
                <div className="space-y-2">
                  {inventoryAlerts.inactive_alerts.map((device, i) => (
                    <div key={i} className="bg-white rounded-lg p-2 sm:p-3 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-800 text-sm truncate">{device.device_name}</p>
                          <p className="text-xs text-gray-600 truncate">{device.serial_no}</p>
                        </div>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs flex-shrink-0 ml-2">
                          {device.days_inactive}+d
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(inventoryAlerts.high_usage_alerts?.length === 0 && inventoryAlerts.inactive_alerts?.length === 0) && (
              <div className="card text-center py-6 sm:py-12">
                <svg className="w-8 h-8 sm:w-12 sm:h-12 text-green-500 mx-auto mb-2 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-text-primary font-medium text-sm">No alerts</p>
                <p className="text-text-secondary text-xs">All devices normal</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AIAnalyticsDashboard