import { useState, useEffect, useMemo } from 'react'
import { api, endpoints } from '../../services/api'
import DataTable from '../DataTable'

const AdminSettings = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'employee',
    phone_number: '',
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.get(endpoints.users.list)
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
      setError(error.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!formData.username || !formData.email || !formData.password) {
      setFormError('Username, email, and password are required')
      return
    }

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters')
      return
    }

    try {
      setFormLoading(true)
      await api.post(endpoints.auth.register, formData)
      setShowAddModal(false)
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'employee',
        phone_number: '',
      })
      fetchUsers()
    } catch (error) {
      console.error('Error adding user:', error)
      setFormError(error.message || 'Failed to add user')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await api.delete(endpoints.users.delete(userId))
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user: ' + (error.message || 'Unknown error'))
    }
  }

  // Split users into admins and employees, sorted alphabetically
  const adminUsers = useMemo(() => {
    return users
      .filter(u => u.role === 'admin' && u.is_active)
      .sort((a, b) => a.username.localeCompare(b.username))
  }, [users])

  const employeeUsers = useMemo(() => {
    return users
      .filter(u => u.role === 'employee' && u.is_active)
      .sort((a, b) => a.username.localeCompare(b.username))
  }, [users])

  const tableColumns = [
    {
      key: 'username',
      title: 'Username',
      render: (value) => <span className="font-semibold text-text-primary">{value}</span>,
    },
    {
      key: 'email',
      title: 'Email',
      searchable: true,
    },
    {
      key: 'role',
      title: 'Role',
      render: (value) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          value === 'admin' 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : 'bg-blue-100 text-blue-700 border border-blue-200'
        }`}>
          {value === 'admin' ? 'Admin' : 'Employee'}
        </span>
      ),
    },
    {
      key: 'is_active',
      title: 'Status',
      render: (value) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'date_joined',
      title: 'Joined',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
  ]

  const rowActions = [
    {
      label: 'Delete',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      onClick: (row) => handleDeleteUser(row.id, row.username),
      className: 'text-red-600 hover:text-red-800 hover:bg-red-50',
      disabled: (row) => !row.is_active,
    },
  ]

  if (loading) {
    return (
      <div className="p-6 md:p-8 lg:p-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">Admin Settings</h1>
              <p className="text-text-secondary">Loading users...</p>
            </div>
          </div>
          <div className="card p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-xl">
                  <div className="h-4 flex-1 bg-gray-200 rounded"></div>
                  <div className="h-4 w-48 bg-gray-200 rounded"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Admin Settings</h1>
            <p className="text-text-secondary">Manage administrators and employees</p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0 flex-wrap">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add User
            </button>
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
              <p className="text-red-700 font-semibold mb-1">Failed to Load Users</p>
              <p className="text-red-600/80 text-sm mb-4">{error}</p>
              <button
                onClick={fetchUsers}
                className="btn-primary px-6 py-2.5 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card p-5 hover:shadow-medium transition-shadow duration-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-text-primary">{users.filter(u => u.is_active).length}</p>
                <p className="text-sm text-text-secondary font-medium">Active Users</p>
              </div>
            </div>
          </div>

          <div className="card p-5 hover:shadow-medium transition-shadow duration-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-.654 15.254M15 3.004V1m0 2v2m0-2h2m-2 0h-2" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-text-primary">{users.filter(u => u.role === 'admin' && u.is_active).length}</p>
                <p className="text-sm text-text-secondary font-medium">Administrators</p>
              </div>
            </div>
          </div>

          <div className="card p-5 hover:shadow-medium transition-shadow duration-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-3xl font-bold text-text-primary">{users.filter(u => u.role === 'employee' && u.is_active).length}</p>
                <p className="text-sm text-text-secondary font-medium">Employees</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admins Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Administrators ({adminUsers.length})
          </h2>
          <DataTable
            data={adminUsers}
            columns={tableColumns}
            keyField="id"
            searchPlaceholder="Search admins by email..."
            pagination={true}
            itemsPerPage={10}
            rowActions={rowActions}
            emptyState={
              <div className="text-center py-8 px-6">
                <p className="text-text-secondary">No administrators found.</p>
              </div>
            }
          />
        </div>

        {/* Employees Section */}
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Employees ({employeeUsers.length})
          </h2>
          <DataTable
            data={employeeUsers}
            columns={tableColumns}
            keyField="id"
            searchPlaceholder="Search employees by email..."
            pagination={true}
            itemsPerPage={10}
            rowActions={rowActions}
            emptyState={
              <div className="text-center py-8 px-6">
                <p className="text-text-secondary">No employees found.</p>
              </div>
            }
          />
        </div>

        {/* Add User Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in-up">
              <div className="bg-gradient-to-r from-primary to-primary-light p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Add New User</h2>
                      <p className="text-primary-light text-sm">Create admin or employee account</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddUser} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-700 text-sm font-medium">{formError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                    className="input-field py-3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    className="input-field py-3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Minimum 8 characters"
                    className="input-field py-3"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="input-field py-3"
                  >
                    <option value="employee">Employee</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    className="input-field py-3"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 btn-secondary py-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                  >
                    {formLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Adding...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminSettings



