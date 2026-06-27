import { API_BASE_URL } from '../config'

/**
 * Centralized API Service with automatic authentication handling
 * All API calls go through this service to ensure consistent auth headers and error handling
 */

// In-memory token storage (not persisted to localStorage)
let authToken = null

// Set auth token (called from AuthContext)
export const setAuthToken = (token) => {
  authToken = token
}

// Get auth token from memory
export const getToken = () => authToken

// Get default headers with auth token
const getHeaders = (isJson = true) => {
  const headers = {}
  const token = getToken()

  if (token) {
    headers['Authorization'] = `Token ${token}`
  }

  if (isJson) {
    headers['Content-Type'] = 'application/json'
  }

  return headers
}

// Handle API response
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = Object.entries(errorData)
      .map(([key, value]) => Array.isArray(value) ? `${key}: ${value.join(', ')}` : `${key}: ${value}`)
      .join(' | ') || errorData.detail || `Request failed with status ${response.status}`
    const error = new Error(errorMessage)
    error.responseData = errorData
    error.status = response.status
    throw error
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return null
  }

  return response.json()
}

// HTTP methods
export const api = {
  // GET request
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
    })
    return handleResponse(response)
  },

  // POST request (authenticated)
  post: async (endpoint, data, isFormData = false) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(!isFormData),
      body: isFormData ? data : JSON.stringify(data),
    })
    return handleResponse(response)
  },

  // POST request (public - no auth)
  postPublic: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || errorData.detail || `Request failed with status ${response.status}`)
    }
    return response.json()
  },

  // PATCH request
  patch: async (endpoint, data, isFormData = false) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getHeaders(!isFormData),
      body: isFormData ? data : JSON.stringify(data),
    })
    return handleResponse(response)
  },

  // DELETE request
  delete: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    return handleResponse(response)
  },
}

// API Endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/api/auth/login/',
    register: '/api/auth/register/',
    profile: '/api/auth/profile/',
  },

  // Dashboard
  dashboard: {
    stats: '/api/dashboard/stats/',
  },

  // Jobs
  jobs: {
    list: '/api/jobs/',
    detail: (id) => `/api/jobs/${id}/`,
  },

  // Rentals
  rentals: {
    list: '/api/rentals/',
    detail: (id) => `/api/rentals/${id}/`,
    return: (id) => `/api/rentals/${id}/return/`,
  },

  // Devices
  devices: {
    list: '/api/devices/',
    detail: (id) => `/api/devices/${id}/`,
    bySerial: (serial) => `/api/devices/?serial_no=${serial}`,
  },

  // Reports
  reports: {
    list: '/api/reports/',
    detail: (id) => `/api/reports/${id}/`,
    byJob: (jobId) => `/api/reports/?job=${jobId}`,
  },

  // Users
  users: {
    list: '/api/users/',
    register: '/api/auth/register/',
    delete: (id) => `/api/users/${id}/delete/`,
  },

  // AI Features
  ai: {
    classify: '/api/ai/classify/',
    autoPriority: '/api/ai/auto-priority/',
    duplicates: '/api/ai/duplicates/',
    suggestAssignment: '/api/ai/suggest-assignment/',
    workload: '/api/ai/workload/',
    suggestions: '/api/ai/suggestions/',
    estimateTime: '/api/ai/estimate-time/',
    optimizeRoute: '/api/ai/optimize-route/',
    checklist: '/api/ai/checklist/',
    assistReport: '/api/ai/assist-report/',
    trends: '/api/ai/trends/',
    staffPerformance: '/api/ai/staff-performance/',
    inventoryAlerts: '/api/ai/inventory-alerts/',
    // ML endpoints
    mlClassify: '/api/ai/ml/classify/',
    mlPredictTime: '/api/ai/ml/predict-time/',
    mlPredictSuccess: '/api/ai/ml/predict-success/',
    // Predictive endpoints
    forecast: '/api/ai/forecast/',
    customerPatterns: '/api/ai/customer-patterns/',
    predictSla: '/api/ai/sla/',
    employeeMetrics: '/api/ai/employee-metrics/',
    // Learning endpoints
    learn: '/api/ai/learn/',
    enhanced: '/api/ai/enhanced/',
    deviceInsights: '/api/ai/device-insights/',
    popularCategories: '/api/ai/popular-categories/',
    detectDevices: '/api/ai/detect-devices/',
    learningStats: '/api/ai/learning-stats/',
    // Intelligent classifier
    intelligent: '/api/ai/intelligent/',
    deepAnalyze: '/api/ai/deep-analyze/',
  },
}

export default api
