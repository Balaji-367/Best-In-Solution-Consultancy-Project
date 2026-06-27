import { useState, useEffect } from 'react'
import { api, endpoints, getToken } from '../../services/api'
import LocationPicker from './LocationPicker'

const PostJob = () => {
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    email: '',
    location: '',
    latitude: '',
    longitude: '',
    issue: '',
    workDate: '',
    priority: '',
  })
  const [aiAnalysis, setAiAnalysis] = useState({
    category: null,
    confidence: null,
    mlCategory: null,
    mlConfidence: null,
    intelligentCategory: null,
    intelligentConfidence: null,
    deepAnalysis: null,
    suggestedPriority: null,
    suggestedAssignee: null,
    timeEstimate: null,
    predictedTime: null,
    learnedTime: null,
    slaPrediction: null,
    employeeSuccessRate: null,
    checklist: [],
    suggestions: [],
    duplicates: [],
    detectedDevices: [],
    deviceHistory: [],
    customerHistory: null,
    learningStats: null,
    popularCategories: [],
    technicalTerms: [],
    needsManualReview: false,
    recommendations: [],
    loading: false,
    analyzingIssue: false,
  })
  const [showMapModal, setShowMapModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [createdJob, setCreatedJob] = useState(null)
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setSubmitError('')
    setSubmitSuccess(false)
    
    if (e.target.name === 'issue' && e.target.value.length > 10) {
      analyzeIssueWithAI(e.target.value)
    }
    
    if (e.target.name === 'customerName' && e.target.value.length > 2) {
      checkForDuplicates()
    }
  }

  const analyzeIssueWithAI = async (issue) => {
    if (!issue || issue.length < 10) return
    
    setAiAnalysis(prev => ({ ...prev, loading: true, analyzingIssue: true }))
    
    try {
      // 1. Basic classification
      const classification = await api.post(endpoints.ai.classify, { issue })
      
      // 2. ML classification (enhanced)
      const mlClassification = await api.post(endpoints.ai.mlClassify, { issue })
      
      // 3. Combined analysis
      if (classification?.category || mlClassification?.category) {
        setAiAnalysis(prev => ({
          ...prev,
          category: classification?.category,
          confidence: classification?.confidence,
          mlCategory: mlClassification?.category,
          mlConfidence: mlClassification?.confidence,
          analyzingIssue: false,
        }))
        
        // 4. Auto priority
        const priority = await api.post(endpoints.ai.autoPriority, { issue })
        if (priority?.suggested_priority && !formData.priority) {
          setAiAnalysis(prev => ({ ...prev, suggestedPriority: priority.suggested_priority }))
          setFormData(prev => ({ ...prev, priority: priority.suggested_priority }))
        }
        
        // 5. Time estimate
        const categoryForTime = mlClassification?.category || classification?.category
        const timeEstimate = await api.post(endpoints.ai.estimateTime, { 
          category: categoryForTime, 
          issue 
        })
        const predictedTime = await api.post(endpoints.ai.mlPredictTime, {
          ai_category: categoryForTime,
          priority: formData.priority || 'medium'
        })
        setAiAnalysis(prev => ({ ...prev, timeEstimate, predictedTime }))
        
        // 6. Employee assignment with success rate
        const assignment = await api.post(endpoints.ai.suggestAssignment, { issue })
        if (assignment?.suggestions?.[0]) {
          const topEmployee = assignment.suggestions[0]
          
          // Get employee success probability
          const successRate = await api.post(endpoints.ai.mlPredictSuccess, {
            employee_id: topEmployee.employee_id,
            job_data: { issue, category: categoryForTime }
          })
          
          setAiAnalysis(prev => ({ 
            ...prev, 
            suggestedAssignee: topEmployee,
            employeeSuccessRate: successRate,
          }))
        }
        
        // 7. Get checklist based on category
        const checklistData = await api.post(endpoints.ai.checklist, { category: categoryForTime })
        if (checklistData?.checklist) {
          setAiAnalysis(prev => ({ ...prev, checklist: checklistData.checklist }))
        }
        
        // 8. Get suggestions
        const suggestionsData = await api.post(endpoints.ai.suggestions, { issue, category: categoryForTime })
        if (suggestionsData?.suggestions) {
          setAiAnalysis(prev => ({ ...prev, suggestions: suggestionsData.suggestions }))
        }
        
        // 9. Detect devices from issue text
        const deviceData = await api.post(endpoints.ai.detectDevices, { text: issue })
        if (deviceData?.devices) {
          setAiAnalysis(prev => ({ ...prev, detectedDevices: deviceData.devices }))
        }
        
        // 10. Get enhanced AI (uses learned data)
        const enhancedData = await api.post(endpoints.ai.enhanced, { issue, category: categoryForTime })
        if (enhancedData) {
          setAiAnalysis(prev => ({ 
            ...prev, 
            learnedTime: enhancedData.learned_time_estimate,
            deviceHistory: enhancedData.device_suggestions,
          }))
        }
        
        // 11. Get learning stats
        const statsData = await api.get(endpoints.ai.learningStats)
        if (statsData) {
          setAiAnalysis(prev => ({ ...prev, learningStats: statsData }))
        }
        
        // 12. Get popular categories
        const popularData = await api.get(endpoints.ai.popularCategories)
        if (popularData?.popular_categories) {
          setAiAnalysis(prev => ({ ...prev, popularCategories: popularData.popular_categories }))
        }
        
        // 13. Intelligent classification (ChatGPT-like)
        const intelligentData = await api.post(endpoints.ai.intelligent, { 
          issue, 
          location: formData.location 
        })
        if (intelligentData) {
          setAiAnalysis(prev => ({ 
            ...prev, 
            intelligentCategory: intelligentData.category,
            intelligentConfidence: intelligentData.confidence,
            detectedDevices: intelligentData.detected_devices || [],
            technicalTerms: intelligentData.technical_terms || [],
            needsManualReview: intelligentData.needs_web_search || false,
          }))
        }
        
        // 14. Deep analysis (comprehensive)
        const deepData = await api.post(endpoints.ai.deepAnalyze, { 
          issue, 
          location: formData.location 
        })
        if (deepData) {
          setAiAnalysis(prev => ({ 
            ...prev, 
            deepAnalysis: deepData,
            recommendations: deepData.recommendations || [],
          }))
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error)
      setAiAnalysis(prev => ({ ...prev, loading: false, analyzingIssue: false }))
    }
  }

  const checkForDuplicates = async () => {
    if (!formData.customerName || formData.customerName.length < 3) return
    if (!formData.issue || formData.issue.length < 10) return
    
    try {
      // Check for duplicate jobs
      const result = await api.post(endpoints.ai.duplicates, {
        customer_name: formData.customerName,
        issue: formData.issue,
      })
      if (result?.duplicates) {
        setAiAnalysis(prev => ({ ...prev, duplicates: result.duplicates }))
      }
      
      // Check customer patterns (new enhancement)
      const customerPatterns = await api.get(endpoints.ai.customerPatterns)
      if (customerPatterns?.repeat_customers) {
        const customerHistory = customerPatterns.repeat_customers.find(
          c => c.customer_name?.toLowerCase() === formData.customerName.toLowerCase()
        )
        if (customerHistory) {
          setAiAnalysis(prev => ({ ...prev, customerHistory }))
        }
      }
    } catch (error) {
      console.error('Duplicate check error:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError('')
    setSubmitSuccess(false)

    const payload = {
      customer_name: formData.customerName,
      phone_number: formData.phoneNumber,
      email: formData.email,
      location: formData.location,
      latitude: formData.latitude ? parseFloat(parseFloat(formData.latitude).toFixed(6)) : null,
      longitude: formData.longitude ? parseFloat(parseFloat(formData.longitude).toFixed(6)) : null,
      issue: formData.issue,
      work_date: formData.workDate,
      priority: formData.priority,
      status: 'open',
    }

    try {
      const response = await api.post(endpoints.jobs.list, payload)
      setCreatedJob(response)
      setSubmitSuccess(true)

      setFormData({
        customerName: '',
        phoneNumber: '',
        email: '',
        location: '',
        latitude: '',
        longitude: '',
        issue: '',
        workDate: '',
        priority: '',
      })
    } catch (error) {
      console.error('Error posting job:', error)
      console.error('Response data:', error.responseData)
      const errorMsg = error.responseData 
        ? Object.entries(error.responseData).map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`).join(' | ')
        : error.message
      setSubmitError(errorMsg || 'Failed to post job. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateJobCode = () => {
    if (!createdJob?.work_date || !createdJob?.id) return ''
    const dateStr = createdJob.work_date.replace(/-/g, '')
    const idStr = String(createdJob.id).padStart(4, '0')
    return `JOB-${dateStr}-${idStr}`
  }

  const getFileName = () => {
    const customerName = (createdJob?.customer_name || 'unknown').replace(/\s+/g, '_')
    return `${customerName}_best_in_solution.pdf`
  }

   const downloadJobCard = async () => {
    if (!createdJob?.id) return
    
    try {
      const token = getToken()
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/jobs/${createdJob.id}/job-card/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = getFileName()
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error downloading job card:', error)
    }
  }

  const resetForm = () => {
    setSubmitSuccess(false)
    setCreatedJob(null)
  }

  const handleLocationSelect = ({ latitude, longitude }) => {
    setFormData((prev) => ({
      ...prev,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    }))
  }

  const openMapModal = () => {
    setShowMapModal(true)
  }

  const closeMapModal = () => {
    setShowMapModal(false)
  }

  const openGoogleMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
  }

  const clearLocation = () => {
    setFormData((prev) => ({
      ...prev,
      location: '',
      latitude: '',
      longitude: '',
    }))
  }

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Post Job</h1>
        <p className="text-text-secondary mb-8">Create a new service job request</p>

        {submitSuccess && createdJob && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">Job Posted Successfully!</h3>
                <p className="text-sm text-green-600">Job ID: #{createdJob.id}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Job Code:</strong> {generateJobCode()}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Customer:</strong> {createdJob.customer_name}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={downloadJobCard}
                className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </button>
            </div>

            <button
              onClick={resetForm}
              className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Post Another Job
            </button>
          </div>
        )}

        {submitError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-4">Customer Detail</h2>
          </div>

          <div>
            <label htmlFor="customerName" className="block text-sm font-semibold text-text-primary mb-2">
              Customers / Company name
            </label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="Enter customer or company name"
              className="input-field"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-semibold text-text-primary mb-2">
              Phone number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter phone number"
              className="input-field"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-text-primary mb-2">
              Email <span className="text-text-secondary font-normal">(optional - for job card delivery)</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="customer@email.com"
              className="input-field"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-semibold text-text-primary mb-2">
              Location
            </label>
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Enter location address"
                  className="input-field flex-1"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={openMapModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap touch-target"
                  disabled={isSubmitting}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Pick on Map
                </button>
              </div>

              {formData.latitude && formData.longitude && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-800">Location pinned</p>
                    <p className="text-xs text-green-600 truncate">
                      {parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openGoogleMaps(formData.latitude, formData.longitude)}
                    className="text-xs px-2 py-1 bg-white border border-green-300 text-green-700 rounded hover:bg-green-100 transition-colors flex-shrink-0"
                    title="Open in Google Maps"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={clearLocation}
                    className="text-green-600 hover:text-red-500 transition-colors flex-shrink-0"
                    title="Clear location"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

<div>
            <label htmlFor="issue" className="block text-sm font-semibold text-text-primary mb-2">
              Issue <span className="text-text-secondary font-normal text-xs">(AI analyzes)</span>
            </label>
            <textarea
              id="issue"
              name="issue"
              value={formData.issue}
              onChange={handleChange}
              placeholder="Describe the issue..."
              rows="3"
              className="input-field resize-y min-h-[80px]"
              required
              disabled={isSubmitting}
            />
            
            {aiAnalysis.loading && (
              <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                AI analyzing...
              </div>
            )}
            
            {aiAnalysis.category && !aiAnalysis.loading && (
              <div className="mt-3 space-y-2">
                {/* Compact AI Summary Bar */}
                <div className="flex flex-wrap items-center gap-2 p-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                  <span className="text-xs font-semibold text-blue-800">AI:</span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium truncate max-w-[120px]">
                    {aiAnalysis.intelligentCategory || aiAnalysis.mlCategory || aiAnalysis.category}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    aiAnalysis.suggestedPriority === 'high' ? 'bg-red-100 text-red-700' :
                    aiAnalysis.suggestedPriority === 'low' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {aiAnalysis.suggestedPriority?.toUpperCase() || 'MEDIUM'}
                  </span>
                  <span className="text-xs text-blue-600">
                    {Math.round((aiAnalysis.intelligentConfidence || aiAnalysis.mlConfidence || aiAnalysis.confidence || 0) * 100)}%
                  </span>
                  {aiAnalysis.needsManualReview && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Review</span>
                  )}
                  <button 
                    onClick={() => setShowAiSuggestions(!showAiSuggestions)}
                    className="ml-auto text-xs text-blue-600 hover:text-blue-800"
                  >
                    {showAiSuggestions ? '▲ Less' : '▼ More'}
                  </button>
                </div>
                
                {/* Expanded AI Details */}
                {showAiSuggestions && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded p-2 text-center">
                        <p className="text-xs text-gray-500">Time</p>
                        <p className="text-sm font-semibold text-blue-600">
                          {aiAnalysis.learnedTime || aiAnalysis.predictedTime?.predicted_minutes || aiAnalysis.deepAnalysis?.estimated_time?.estimated_minutes || 'N/A'}
                          {aiAnalysis.learnedTime && 'm'}
                        </p>
                      </div>
                      <div className="bg-white rounded p-2 text-center">
                        <p className="text-xs text-gray-500">Success</p>
                        <p className="text-sm font-semibold text-green-600">
                          {aiAnalysis.employeeSuccessRate?.probability || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-white rounded p-2 text-center">
                        <p className="text-xs text-gray-500">Devices</p>
                        <p className="text-sm font-semibold text-indigo-600">
                          {aiAnalysis.detectedDevices.length || '0'}
                        </p>
                      </div>
                    </div>
                    
                    {aiAnalysis.technicalTerms.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {aiAnalysis.technicalTerms.slice(0, 4).map((term, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{term}</span>
                        ))}
                      </div>
                    )}
                    
                    {(aiAnalysis.needsManualReview || aiAnalysis.deepAnalysis?.needs_external_help) && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">Review recommended</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
 
          <div>
            <label htmlFor="workDate" className="block text-sm font-semibold text-text-primary mb-2">
              Work date
            </label>
            <div className="date-input-wrapper">
              <input
                type="date"
                id="workDate"
                name="workDate"
                value={formData.workDate}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-semibold text-text-primary mb-2">
              Priority {aiAnalysis.suggestedPriority && !formData.priority && (
                <span className="text-xs text-green-600">(AI suggests: {aiAnalysis.suggestedPriority.toUpperCase()})</span>
              )}
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="input-field"
              required
              disabled={isSubmitting}
            >
              <option value="">Select priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex justify-center pt-4">
            <button
              type="submit"
              className="btn-primary px-8 py-3 flex items-center gap-2"
              disabled={isSubmitting || submitSuccess}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </button>
          </div>
        </form>

        {showMapModal && (
          <LocationPicker
            initialLat={formData.latitude || undefined}
            initialLng={formData.longitude || undefined}
            onLocationSelect={handleLocationSelect}
            onClose={closeMapModal}
          />
        )}
      </div>
    </div>
  )
}

export default PostJob