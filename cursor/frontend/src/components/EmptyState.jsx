const EmptyState = ({
  title = 'No Data Found',
  description = 'There are no items to display at the moment.',
  icon = 'default',
  action = null,
  actionLabel = '',
  onAction = () => {},
}) => {
  const icons = {
    default: {
      path: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
      color: 'text-gray-300',
      bg: 'bg-gray-100',
    },
    rental: {
      path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      color: 'text-blue-400',
      bg: 'bg-blue-50',
    },
    job: {
      path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
      color: 'text-purple-400',
      bg: 'bg-purple-50',
    },
    device: {
      path: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      color: 'text-green-400',
      bg: 'bg-green-50',
    },
    user: {
      path: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      color: 'text-orange-400',
      bg: 'bg-orange-50',
    },
    search: {
      path: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      color: 'text-gray-400',
      bg: 'bg-gray-50',
    },
    success: {
      path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
  }

  const selectedIcon = icons[icon] || icons.default
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className={`w-20 h-20 ${selectedIcon.bg} rounded-full flex items-center justify-center mb-6`}>
        <div className={`w-10 h-10 ${selectedIcon.color}`}>
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={selectedIcon.path} />
          </svg>
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-text-primary mb-2">
        {title}
      </h3>
      
      <p className="text-text-secondary max-w-md mb-8 text-sm leading-relaxed">
        {description}
      </p>
      
      {action && (
        <button
          onClick={onAction}
          className="btn-primary px-6 py-2.5 flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState
