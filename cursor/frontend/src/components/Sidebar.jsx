import { NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

const Sidebar = ({ user, userRole, onLogout, onClose }) => {
  const location = useLocation()
  const isAdminLevel = userRole === 'admin'
  const isEmployee = userRole === 'employee'
  
  // Theme colors based on user role
  const theme = isEmployee ? {
    primary: 'green',
    primaryLight: 'green-600',
    primaryDark: 'green-700',
    bgGradient: 'from-green-500 to-green-600',
    bgGradientLight: 'from-green-400 to-green-500',
    shadowColor: 'green-500/20',
    activeBg: 'bg-green-500',
    activeText: 'text-green-500',
    hoverText: 'hover:text-green-600',
  } : {
    primary: 'primary',
    primaryLight: 'primary-light',
    primaryDark: 'primary-dark',
    bgGradient: 'from-primary to-primary-light',
    bgGradientLight: 'from-primary to-primary-light',
    shadowColor: 'primary/20',
    activeBg: 'bg-primary',
    activeText: 'text-primary',
    hoverText: 'hover:text-primary',
  }
  
  const [expandedMenus, setExpandedMenus] = useState(() => {
    const saved = localStorage.getItem('sidebarExpandedMenus')
    return saved ? JSON.parse(saved) : { jobs: false, rentals: false }
  })
  
  useEffect(() => {
    localStorage.setItem('sidebarExpandedMenus', JSON.stringify(expandedMenus))
  }, [expandedMenus])

  const toggleMenu = (menuName) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }))
  }

  const isChildActive = (paths) => {
    return paths.some(path => location.pathname.startsWith(path))
  }

  const adminMenuStructure = [
    { 
      type: 'item', 
      path: '/admin/dashboard', 
      label: 'Dashboard', 
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' 
    },
    { 
      type: 'item', 
      path: '/admin/post-job', 
      label: 'Post Job', 
      icon: 'M12 4v16m8-8H4',
      requires: 'admin'
    },
    {
      type: 'submenu',
      key: 'jobs',
      label: 'JOBS',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      childPaths: ['/admin/jobs'],
      requires: 'admin',
      children: [
        { path: '/admin/jobs/ongoing', label: 'Ongoing Jobs', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
        { path: '/admin/jobs/open', label: 'Open Jobs', icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 00-.707.293h-3.172a1 1 0 00-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' },
        { path: '/admin/jobs/completed', label: 'Completed Jobs', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      ]
    },
    { 
      type: 'item', 
      path: '/admin/rental-product', 
      label: 'Product Rental', 
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      requires: 'admin'
    },
    {
      type: 'submenu',
      key: 'rentals',
      label: 'RENTALS',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      childPaths: ['/admin/rentals'],
      requires: 'admin',
      children: [
        { path: '/admin/rentals/ongoing', label: 'Ongoing Rentals', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        { path: '/admin/rentals/completed', label: 'Completed Rentals', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      ]
    },
    { 
      type: 'item', 
      path: '/admin/available-devices', 
      label: 'Available Device', 
      icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
      requires: 'admin'
    },
    { 
      type: 'item', 
      path: '/admin/ai-analytics', 
      label: 'AI Analytics', 
      icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' 
    },
    { 
      type: 'item', 
      path: '/admin/add-device', 
      label: 'Add Devices', 
      icon: 'M12 4v16m8-8H4',
      requires: 'admin'
    },
    { 
      type: 'item', 
      path: '/admin/settings', 
      label: 'Settings', 
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543.826 3.31 2.37 2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      requires: 'admin'
    },
  ]

  const employeeMenuItems = [
    { path: '/employee/available-jobs', label: 'Available Jobs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { path: '/employee/ongoing-job', label: 'On going Job', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { path: '/employee/recently-completed', label: 'Recently Completed Job', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { path: '/employee/submit-report', label: 'Submit Report', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  ]

  const roleLabels = {
    'admin': { label: 'Admin', subtext: 'Administrator' },
    'employee': { label: 'Staff', subtext: 'Employee' },
  }

  const getFilteredMenu = (menu) => {
    return menu.filter(item => {
      if (!item.requires) return true
      if (item.requires === 'admin') return isAdminLevel
      return true
    }).map(item => {
      if (item.children) {
        return {
          ...item,
          children: item.children.filter(child => {
            if (!child.requires) return true
            if (child.requires === 'admin') return isAdminLevel
            return true
          })
        }
      }
      return item
    })
  }

  const menuItems = userRole === 'employee' 
    ? employeeMenuItems 
    : getFilteredMenu(adminMenuStructure)

  const roleInfo = roleLabels[userRole] || roleLabels['employee']

  const renderMenuItem = (item, index) => {
    if (item.type === 'submenu') {
      const isExpanded = expandedMenus[item.key]
      const isChildActiveState = isChildActive(item.childPaths)
      
      return (
        <div key={item.key} className="space-y-1">
          {/* Parent Menu Button */}
          <button
            onClick={() => toggleMenu(item.key)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group bg-transparent ${
              isChildActiveState
                ? `${theme.activeText} font-semibold`
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg 
                className={`w-5 h-5 transition-colors duration-200 ${
                  isChildActiveState ? theme.activeText : `text-text-secondary group-hover:text-text-primary`
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <svg 
              className={`w-4 h-4 transition-transform duration-300 ease-in-out ${
                isExpanded ? 'rotate-180' : 'rotate-0'
              } ${isChildActiveState ? theme.activeText : 'text-text-secondary'}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Submenu Items */}
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="pl-4 space-y-1 border-l-2 border-border-light ml-6">
              {item.children.map((child) => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                      isActive
                        ? `${theme.activeBg} text-white shadow-sm`
                        : 'bg-transparent text-text-secondary hover:text-text-primary'
                    }`
                  }
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={child.icon} />
                  </svg>
                  <span className="font-medium">{child.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )
    }
    
    return (
      <NavLink
        key={item.path}
        to={item.path}
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            isActive
              ? `${theme.activeBg} text-white shadow-sm`
              : 'bg-transparent text-text-secondary hover:text-text-primary'
          }`
        }
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
        </svg>
        <span className="text-sm font-medium">{item.label}</span>
      </NavLink>
    )
  }

  return (
    <div className="h-full bg-background-grey flex flex-col border-r border-border-light">
      {/* Logo Section */}
      <div className="p-4 lg:p-6 border-b border-border-light flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-r ${theme.bgGradient} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-${theme.shadowColor}`}>
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-text-primary truncate">Best In Solutions</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-background-light active:bg-gray-200 transition-colors touch-target"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border-light flex-shrink-0">
        <div className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-background-light transition-colors" onClick={onLogout}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 ${isEmployee ? 'bg-green-500' : 'bg-red-500'} rounded-full flex items-center justify-center`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{roleInfo.label}</p>
              <p className="text-xs text-text-secondary">{roleInfo.subtext}</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
