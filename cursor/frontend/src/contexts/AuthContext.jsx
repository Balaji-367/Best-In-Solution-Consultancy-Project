import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import { setAuthToken as setApiAuthToken } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userId, setUserId] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [authToken, setAuthToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Initialize auth state - no persistence, always start at login
  useEffect(() => {
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }

      const data = await response.json()
      const { token, user: userData } = data

      console.log('Login response:', userData)
      
      const role = userData.role || 'employee'
      
      setUser(userData.email)
      setUserId(userData.id)
      setUserRole(role)
      setAuthToken(token)
      setApiAuthToken(token)

      return { success: true, role: role }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }, [setApiAuthToken])

  const logout = useCallback(() => {
    setUser(null)
    setUserId(null)
    setUserRole(null)
    setAuthToken(null)
    setApiAuthToken(null)
    navigate('/login', { replace: true })
  }, [navigate, setApiAuthToken])

  const isAuthenticated = !!authToken
  const isAdmin = userRole === 'admin'
  const isAdminLevel = userRole === 'admin'
  const isEmployee = userRole === 'employee'

  const value = {
    user,
    userId,
    userRole,
    authToken,
    loading,
    isAuthenticated,
    isAdmin,
    isAdminLevel,
    isEmployee,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
