import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import debounce from 'lodash/debounce';
import { DateRangePicker } from './DateRangePicker';

export function TaskSearch() {
  const {
    taskFilters,
    setTaskFilters,
    searchQuery,
    setSearchQuery,
    categories,
  } = useStore();

  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounce search to avoid too many state updates
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  // Update search when typing
  useEffect(() => {
    debouncedSearch(localSearch);
  }, [localSearch, debouncedSearch]);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          id="search-input"
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder="Search tasks..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-800 placeholder:text-gray-500"
        />
        {localSearch && (
          <button
            onClick={() => setLocalSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
          showFilters
            ? 'bg-blue-100 text-blue-600'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        <FunnelIcon className="h-4 w-4" />
        Filters
      </button>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border space-y-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={taskFilters.status}
              onChange={(e) =>
                setTaskFilters({ status: e.target.value as typeof taskFilters.status })
              }
              className="form-select w-full"
            >
              <option value="all">All Tasks</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={taskFilters.priority || ''}
              onChange={(e) =>
                setTaskFilters({
                  priority: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="form-select w-full"
            >
              <option value="">Any Priority</option>
              <option value="4">Urgent</option>
              <option value="3">High</option>
              <option value="2">Medium</option>
              <option value="1">Low</option>
              <option value="0">None</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() =>
                    setTaskFilters({
                      categories: taskFilters.categories.includes(category.id)
                        ? taskFilters.categories.filter((id) => id !== category.id)
                        : [...taskFilters.categories, category.id],
                    })
                  }
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    taskFilters.categories.includes(category.id)
                      ? 'shadow-sm'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: taskFilters.categories.includes(category.id)
                      ? `${category.color}20`
                      : `${category.color}10`,
                    color: category.color,
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date Range
            </label>
            <DateRangePicker
              startDate={taskFilters.dateRange.start}
              endDate={taskFilters.dateRange.end}
              onChange={(start, end) =>
                setTaskFilters({
                  dateRange: { start, end },
                })
              }
            />
          </div>

          {/* Clear Filters */}
          <button
            onClick={() =>
              setTaskFilters({
                status: 'all',
                priority: null,
                categories: [],
                dateRange: { start: null, end: null },
              })
            }
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
} 