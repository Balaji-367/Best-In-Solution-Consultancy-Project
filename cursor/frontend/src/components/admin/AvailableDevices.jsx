import { useState, useEffect, useRef } from 'react'
import { api, endpoints } from '../../services/api'
import Breadcrumbs from '../Breadcrumbs'

const AvailableDevices = () => {
  const [allDevices, setAllDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [activeMenu, setActiveMenu] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingDevice, setEditingDevice] = useState(null)
  const [editFormData, setEditFormData] = useState({
    deviceName: '',
    modelName: '',
    serialNumber: '',
    ram: '',
    memory: '',
    processor: '',
    devicePhoto: null
  })
  const [editPreview, setEditPreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingDeviceId, setDeletingDeviceId] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    fetchDevices()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.get(endpoints.devices.list)
      setAllDevices(data)
    } catch (error) {
      console.error('Error fetching devices:', error)
      setError(error.message || 'Failed to load devices')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    fetchDevices()
  }

  const openDeviceDetails = (device) => {
    setSelectedDevice(device)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedDevice(null)
  }

  const toggleMenu = (deviceId, e) => {
    e.stopPropagation()
    setActiveMenu(activeMenu === deviceId ? null : deviceId)
  }

  const handleEdit = (device, e) => {
    e.stopPropagation()
    setActiveMenu(null)
    setEditingDevice(device)
    setEditFormData({
      deviceName: device.device_name || '',
      modelName: device.model || '',
      serialNumber: device.serial_no || '',
      ram: device.ram || '',
      memory: device.memory || '',
      processor: device.processor || '',
      devicePhoto: null
    })
    setEditPreview(device.device_photo || null)
    setShowEditModal(true)
  }

  const handleDelete = (deviceId, e) => {
    e.stopPropagation()
    setActiveMenu(null)
    setDeletingDeviceId(deviceId)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    try {
      await api.delete(endpoints.devices.detail(deletingDeviceId))
      setAllDevices(prev => prev.filter(d => d.id !== deletingDeviceId))
      setShowDeleteConfirm(false)
      setDeletingDeviceId(null)
    } catch (error) {
      console.error('Error deleting device:', error)
      alert(error.message || 'Failed to delete device')
    }
  }

  const handleEditPhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setEditFormData({ ...editFormData, devicePhoto: file })
      setEditPreview(URL.createObjectURL(file))
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const formDataPayload = new FormData()
      formDataPayload.append('device_name', editFormData.deviceName)
      formDataPayload.append('model', editFormData.modelName)
      formDataPayload.append('serial_no', editFormData.serialNumber)
      formDataPayload.append('ram', editFormData.ram)
      formDataPayload.append('memory', editFormData.memory)
      formDataPayload.append('processor', editFormData.processor)
      if (editFormData.devicePhoto) {
        formDataPayload.append('device_photo', editFormData.devicePhoto)
      }
      const updated = await api.patch(endpoints.devices.detail(editingDevice.id), formDataPayload, true)
      setAllDevices(prev => prev.map(d => d.id === editingDevice.id ? updated : d))
      setShowEditModal(false)
      setEditingDevice(null)
    } catch (error) {
      console.error('Error updating device:', error)
      alert(error.message || 'Failed to update device')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getAvailabilityColor = (status) => {
    switch (status.toLowerCase()) {
      case 'available':
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Available' }
      case 'rented':
        return { bg: 'bg-red-100', text: 'text-red-700', label: 'Rented' }
      case 'maintenance':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Maintenance' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700', label: status }
    }
  }

  const filteredDevices = allDevices.filter((device) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      device.device_name?.toLowerCase().includes(searchLower) ||
      device.serial_no?.toLowerCase().includes(searchLower) ||
      device.model?.toLowerCase().includes(searchLower) ||
      device.ram?.toLowerCase().includes(searchLower) ||
      device.memory?.toLowerCase().includes(searchLower) ||
      device.processor?.toLowerCase().includes(searchLower)

    const matchesStatus = statusFilter === 'all' || device.availability === statusFilter

    return matchesSearch && matchesStatus
  })

  const availableDevices = allDevices.filter((d) => d.availability === 'available').length
  const rentedDevices = allDevices.filter((d) => d.availability === 'rented').length
  const maintenanceDevices = allDevices.filter((d) => d.availability === 'maintenance').length

  if (loading) {
    return (
      <div className="p-6 md:p-8 lg:p-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="h-48 bg-gray-200 animate-pulse"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
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
        <div className="max-w-7xl mx-auto">
          <div className="card border border-red-300 bg-red-50">
            <div className="flex flex-col items-center justify-center py-8">
              <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-700 mb-4">{error}</p>
              <button onClick={handleRetry} className="btn-primary px-6 py-2">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <Breadcrumbs />
        
        {/* Header - Mobile Friendly */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="mb-3 sm:mb-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Device Catalog</h1>
            <p className="text-xs sm:text-sm text-gray-500">Browse devices</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="px-3 py-1.5 bg-white rounded-lg shadow-sm text-center min-w-[60px]">
              <p className="text-lg sm:text-xl font-bold text-green-600">{availableDevices}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Available</p>
            </div>
            <div className="px-3 py-1.5 bg-white rounded-lg shadow-sm text-center min-w-[60px]">
              <p className="text-lg sm:text-xl font-bold text-red-600">{rentedDevices}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Rented</p>
            </div>
            <div className="px-3 py-1.5 bg-white rounded-lg shadow-sm text-center min-w-[60px]">
              <p className="text-lg sm:text-xl font-bold text-yellow-600">{maintenanceDevices}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">Maintenance</p>
            </div>
          </div>
        </div>

        {/* Search Bar - Compact Mobile */}
        <div className="bg-white rounded-lg shadow-sm p-2 sm:p-3 mb-4 border border-gray-200">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              />
            </div>
          </div>
          {/* Filter Buttons - Scrollable on Mobile */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                statusFilter === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                statusFilter === 'available'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setStatusFilter('rented')}
              className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                statusFilter === 'rented'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Rented
            </button>
            <button
              onClick={() => setStatusFilter('maintenance')}
              className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                statusFilter === 'maintenance'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Maintenance
            </button>
          </div>
        </div>

        {/* Product Grid - Compact Mobile Cards */}
        {filteredDevices.length > 0 ? (
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {filteredDevices.map((device) => {
              const status = getAvailabilityColor(device.availability)
              return (
                <div
                  key={device.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 overflow-hidden group"
                >
                  {/* Image Section */}
                  <div 
                    onClick={() => openDeviceDetails(device)}
                    className="relative aspect-square bg-gray-50 cursor-pointer overflow-hidden"
                  >
                    {device.device_photo ? (
                      <img
                        src={device.device_photo}
                        alt={device.device_name}
                        className="w-full h-full object-contain p-1 sm:p-2"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
                      <span className={`px-1 py-0.5 rounded text-[9px] sm:text-xs font-medium ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>
                    {/* Quick Actions */}
                    <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                      <div className="relative" ref={activeMenu === device.id ? menuRef : null}>
                        <button
                          onClick={(e) => toggleMenu(device.id, e)}
                          className="p-1 sm:p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                          </svg>
                        </button>
                        {activeMenu === device.id && (
                          <div className="absolute right-0 top-full mt-1 w-20 sm:w-28 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-20">
                            <button
                              onClick={(e) => handleEdit(device, e)}
                              className="w-full px-2 sm:px-3 py-1.5 text-left text-[10px] sm:text-xs text-gray-700 hover:bg-blue-50 flex items-center gap-1 sm:gap-2"
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span className="whitespace-nowrap">Edit</span>
                            </button>
                            <button
                              onClick={(e) => handleDelete(device.id, e)}
                              className="w-full px-2 sm:px-3 py-1.5 text-left text-[10px] sm:text-xs text-red-600 hover:bg-red-50 flex items-center gap-1 sm:gap-2"
                            >
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="whitespace-nowrap">Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Info Section - Compact */}
                  <div 
                    onClick={() => openDeviceDetails(device)}
                    className="p-1.5 sm:p-2 sm:p-3 cursor-pointer"
                  >
                    <h3 className="font-semibold text-[11px] sm:text-sm text-gray-900 line-clamp-2 leading-tight mb-0.5 sm:mb-1">
                      {device.device_name || 'Unnamed Device'}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate mb-1 sm:mb-2">{device.model}</p>
                    
                    {/* Specs - Hidden on very small screens */}
                    <div className="hidden xs:block space-y-0.5 mb-1 sm:mb-2">
                      {device.ram && (
                        <p className="text-[10px] sm:text-xs text-gray-600 truncate">
                          <span className="font-medium">RAM:</span> {device.ram}
                        </p>
                      )}
                      {device.memory && (
                        <p className="text-[10px] sm:text-xs text-gray-600 truncate">
                          <span className="font-medium">Storage:</span> {device.memory}
                        </p>
                      )}
                    </div>

                    {/* Serial */}
                    <p className="text-[9px] sm:text-xs text-gray-400 truncate font-mono">
                      {device.serial_no}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-base font-semibold text-gray-800 mb-1">No Devices Found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No devices in the inventory yet.'}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Device Details Modal */}
        {showModal && selectedDevice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-blue-600 p-6 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{selectedDevice.device_name || 'Unnamed Device'}</h2>
                  <p className="text-white text-opacity-90">Device Details</p>
                </div>
                <button onClick={closeModal} className="text-white hover:text-gray-200 transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-100 rounded-xl overflow-hidden">
                    {selectedDevice.device_photo ? (
                      <img
                        src={selectedDevice.device_photo}
                        alt={selectedDevice.device_name}
                        className="w-full h-64 object-contain"
                      />
                    ) : (
                      <div className="w-full h-64 flex items-center justify-center bg-gray-200">
                        <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-text-secondary">Status</label>
                      <div className="mt-1">
                        {(() => {
                          const status = getAvailabilityColor(selectedDevice.availability)
                          return (
                            <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${status.bg} ${status.text}`}>
                              {status.label}
                            </span>
                          )
                        })()}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-text-secondary">Model</label>
                      <p className="text-lg font-semibold text-text-primary">{selectedDevice.model || 'Unknown'}</p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-text-secondary">Serial Number</label>
                      <p className="text-lg font-semibold text-text-primary font-mono">{selectedDevice.serial_no}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-text-secondary">RAM</label>
                        <p className="text-text-primary font-medium">{selectedDevice.ram || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Storage</label>
                        <p className="text-text-primary font-medium">{selectedDevice.memory || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-text-secondary">Processor</label>
                        <p className="text-text-primary font-medium truncate" title={selectedDevice.processor}>{selectedDevice.processor || '-'}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-text-secondary">Added On</label>
                      <p className="text-text-primary">
                        {selectedDevice.created_at
                          ? new Date(selectedDevice.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button onClick={closeModal} className="btn-secondary px-6 py-2">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Device Modal */}
        {showEditModal && editingDevice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Edit Device</h2>
                  <p className="text-white text-opacity-90">Update device information</p>
                </div>
                <button onClick={() => setShowEditModal(false)} className="text-white hover:text-gray-200 transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Device Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.deviceName}
                    onChange={(e) => setEditFormData({ ...editFormData, deviceName: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Model Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.modelName}
                    onChange={(e) => setEditFormData({ ...editFormData, modelName: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    value={editFormData.serialNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, serialNumber: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      RAM
                    </label>
                    <input
                      type="text"
                      value={editFormData.ram}
                      onChange={(e) => setEditFormData({ ...editFormData, ram: e.target.value })}
                      placeholder="8GB"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      Memory
                    </label>
                    <input
                      type="text"
                      value={editFormData.memory}
                      onChange={(e) => setEditFormData({ ...editFormData, memory: e.target.value })}
                      placeholder="256GB SSD"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      Processor
                    </label>
                    <input
                      type="text"
                      value={editFormData.processor}
                      onChange={(e) => setEditFormData({ ...editFormData, processor: e.target.value })}
                      placeholder="Intel i5"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">
                    Device Photo <span className="text-text-secondary font-normal">(Optional)</span>
                  </label>
                  <input
                    type="file"
                    onChange={handleEditPhotoChange}
                    accept="image/*"
                    className="input-field"
                  />
                  {editPreview && (
                    <div className="mt-3">
                      <img src={editPreview} alt="Preview" className="w-full h-40 object-contain rounded-lg border border-gray-200" />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 btn-secondary py-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="bg-red-500 p-6 text-white flex justify-between items-center rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h2 className="text-xl font-bold">Confirm Delete</h2>
                </div>
                <button onClick={() => setShowDeleteConfirm(false)} className="text-white hover:text-gray-200 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <p className="text-text-primary mb-6">
                  Are you sure you want to delete this device? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 btn-secondary py-3"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    Delete Device
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

export default AvailableDevices
