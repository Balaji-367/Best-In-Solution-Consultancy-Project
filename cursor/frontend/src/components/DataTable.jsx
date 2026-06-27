import { useState, useMemo } from 'react'

const DataTable = ({
  data = [],
  columns = [],
  keyField = 'id',
  searchable = true,
  searchPlaceholder = 'Search...',
  pagination = true,
  itemsPerPage = 10,
  onRowClick = null,
  rowActions = [],
  emptyState = null,
  loading = false,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAllColumns, setShowAllColumns] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(null)

  // Define visible columns for mobile (first 2 columns only by default)
  const visibleColumns = showAllColumns ? columns : columns.slice(0, 2)
  const hiddenColumnsCount = columns.length - 2

  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
    setCurrentPage(1)
  }

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data]

    // Apply search filter
    if (searchQuery && searchable) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((row) =>
        columns.some((col) => {
          if (!col.searchable && col.searchable !== undefined) return false
          const value = getNestedValue(row, col.key)
          return value?.toString().toLowerCase().includes(query)
        })
      )
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aVal = getNestedValue(a, sortConfig.key)
        const bVal = getNestedValue(b, sortConfig.key)

        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1

        if (typeof aVal === 'string') {
          return sortConfig.direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        }

        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
      })
    }

    return filtered
  }, [data, searchQuery, sortConfig, columns, searchable])

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const paginatedData = pagination
    ? processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : processedData

  // Helper to get nested object values
  function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => acc?.[part], obj)
  }

  // Get sort icon
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-10 flex-1 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl animate-shimmer"></div>
            <div className="h-10 w-24 bg-gray-200 rounded-xl"></div>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 mb-3 p-4 bg-gray-50/50 rounded-xl">
              <div className="h-4 flex-1 bg-gray-200 rounded"></div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0 && emptyState) {
    return emptyState
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      {searchable && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1 max-w-lg">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="input-field pl-12 py-3.5 text-base shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-text-secondary hover:text-text-primary hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-border-light shadow-sm">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <span className="text-sm font-semibold text-text-primary">
              {processedData.length} <span className="text-text-secondary font-normal">{processedData.length === 1 ? 'item' : 'items'}</span>
            </span>
          </div>
        </div>
      )}

      {/* Mobile Column Toggle */}
      {columns.length > 2 && (
        <div className="lg:hidden">
          <button
            onClick={() => setShowAllColumns(!showAllColumns)}
            className="text-sm text-primary hover:text-primary-dark flex items-center gap-1 touch-target py-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            {showAllColumns ? 'Show Less' : `Show ${hiddenColumnsCount} More Columns`}
          </button>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-hidden rounded-xl border border-border-light shadow-sm bg-white">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-50/50 border-b border-border-light">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-5 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider ${
                    column.sortable !== false ? 'cursor-pointer hover:bg-gray-100/80 transition-colors' : ''
                  }`}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.title}
                    {column.sortable !== false && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              {rowActions.length > 0 && (
                <th className="px-5 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.map((row, index) => (
              <tr
                key={row[keyField] || index}
                className={`group transition-all duration-150 ${
                  onRowClick ? 'cursor-pointer hover:bg-primary/5 hover:shadow-sm' : ''
                }`}
                onClick={() => onRowClick && onRowClick(row)}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-5 py-4 text-sm text-text-primary">
                    {column.render
                      ? column.render(getNestedValue(row, column.key), row)
                      : getNestedValue(row, column.key)}
                  </td>
                ))}
                {rowActions.length > 0 && (
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {rowActions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation()
                            action.onClick(row)
                          }}
                          disabled={action.disabled?.(row)}
                          className={`p-2 rounded-lg transition-all duration-150 touch-target ${
                            action.className || 'text-text-secondary hover:text-primary hover:bg-primary/10'
                          } ${action.disabled?.(row) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={action.label}
                        >
                          {action.icon}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {paginatedData.map((row, index) => (
          <div
            key={row[keyField] || index}
            className={`card p-5 space-y-4 ${onRowClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}`}
            onClick={() => onRowClick && onRowClick(row)}
            style={{ animation: `fade-in-up 0.3s ease-out ${index * 50}ms forwards`, opacity: 0 }}
          >
            <div className="space-y-3">
              {/* Visible Columns */}
              {visibleColumns.map((column, idx) => (
                <div key={column.key} className={`flex justify-between items-start ${idx === 0 ? 'pb-3 border-b border-gray-100' : ''}`}>
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {column.title}
                  </span>
                  <span className={`text-sm text-text-primary text-right font-medium ${idx === 0 ? 'text-base font-bold text-primary' : ''}`}>
                    {column.render
                      ? column.render(getNestedValue(row, column.key), row)
                      : getNestedValue(row, column.key)}
                  </span>
                </div>
              ))}

              {/* Hidden Columns (collapsible) */}
              {!showAllColumns && hiddenColumnsCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowAllColumns(true)
                  }}
                  className="text-xs font-medium text-primary hover:text-primary-dark py-2 touch-target flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Show {hiddenColumnsCount} more details
                </button>
              )}

              {/* Actions */}
              {rowActions.length > 0 && (
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  {rowActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation()
                        action.onClick(row)
                      }}
                      disabled={action.disabled?.(row)}
                      className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-150 touch-target flex items-center justify-center gap-1.5 ${
                        action.className || 'text-primary bg-primary/10 hover:bg-primary/20'
                      } ${action.disabled?.(row) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-sm text-text-secondary order-2 sm:order-1">
            Showing <span className="font-semibold text-text-primary">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
            <span className="font-semibold text-text-primary">{Math.min(currentPage * itemsPerPage, processedData.length)}</span> of{' '}
            <span className="font-semibold text-text-primary">{processedData.length}</span>
          </div>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-4 py-2.5 text-sm font-semibold text-text-primary bg-white border-2 border-border rounded-xl hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page
                if (totalPages <= 5) {
                  page = i + 1
                } else if (currentPage <= 3) {
                  page = i + 1
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i
                } else {
                  page = currentPage - 2 + i
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[40px] h-10 rounded-xl font-semibold transition-all duration-150 ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-md shadow-primary/30'
                        : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
                    }`}
                  >
                    {page}
                  </button>
                )
              })}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="text-text-secondary px-1">...</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="min-w-[40px] h-10 rounded-xl font-semibold text-text-secondary hover:bg-gray-100 transition-colors"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-4 py-2.5 text-sm font-semibold text-text-primary bg-white border-2 border-border rounded-xl hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {processedData.length === 0 && data.length > 0 && (
        <div className="card text-center py-16 px-6">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-text-secondary font-medium">No items match your search criteria.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-3 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  )
}

export default DataTable
