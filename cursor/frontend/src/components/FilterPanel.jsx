import { useState } from 'react'

const FilterPanel = ({
  filters = [],
  onFilterChange,
  onClearFilters,
  activeFilters = {},
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasActiveFilters = Object.keys(activeFilters).some(
    (key) => activeFilters[key] && activeFilters[key] !== 'all'
  )

  return (
    <div className="card mb-6 hover:shadow-medium transition-shadow duration-300">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isExpanded ? 'bg-primary/10' : 'bg-gray-100'
          }`}>
            <svg className={`w-4 h-4 ${isExpanded ? 'text-primary' : 'text-text-secondary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <span className="font-bold text-text-primary">Filters</span>
          {hasActiveFilters && (
            <span className="px-3 py-1 bg-gradient-to-r from-primary to-primary-light text-white text-xs font-bold rounded-full shadow-sm shadow-primary/20">
              {Object.keys(activeFilters).filter(k => activeFilters[k] && activeFilters[k] !== 'all').length} Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClearFilters()
              }}
              className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors px-3 py-1 hover:bg-primary/10 rounded-lg"
            >
              Clear All
            </button>
          )}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
            isExpanded ? 'bg-primary/10 rotate-180' : 'bg-gray-100'
          }`}>
            <svg className={`w-4 h-4 ${isExpanded ? 'text-primary' : 'text-text-secondary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-border-light">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider">
                  {filter.label}
                </label>
                {filter.type === 'select' && (
                  <select
                    value={activeFilters[filter.key] || 'all'}
                    onChange={(e) => onFilterChange(filter.key, e.target.value)}
                    className="input-field py-2.5 text-sm"
                  >
                    <option value="all">All {filter.label}</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                {filter.type === 'date-range' && (
                  <div className="date-range-wrapper">
                    <div className="date-input-wrapper">
                      <input
                        type="date"
                        value={activeFilters[`${filter.key}_from`] || ''}
                        onChange={(e) => onFilterChange(`${filter.key}_from`, e.target.value)}
                        placeholder="From"
                      />
                    </div>
                    <span className="date-range-separator text-text-secondary text-sm font-medium">to</span>
                    <div className="date-input-wrapper">
                      <input
                        type="date"
                        value={activeFilters[`${filter.key}_to`] || ''}
                        onChange={(e) => onFilterChange(`${filter.key}_to`, e.target.value)}
                        placeholder="To"
                      />
                    </div>
                  </div>
                )}
                {filter.type === 'search' && (
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/60"
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
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) => onFilterChange(filter.key, e.target.value)}
                      placeholder={filter.placeholder || `Search ${filter.label}...`}
                      className="input-field pl-10 py-2.5 text-sm"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FilterPanel
