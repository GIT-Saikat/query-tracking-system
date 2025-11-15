import { useEffect, useState } from 'react'
import { useQueryStore } from '../store/queryStore'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline'

export default function QueryList() {
  const { queries, filters, isLoading, fetchQueries, setFilters } = useQueryStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchQueries()
  }, [fetchQueries])

  const filteredQueries = queries.filter((query) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        query.content.toLowerCase().includes(searchLower) ||
        query.subject?.toLowerCase().includes(searchLower) ||
        query.senderName?.toLowerCase().includes(searchLower) ||
        query.senderEmail?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800'
      case 'ASSIGNED':
        return 'bg-purple-100 text-purple-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return 'text-green-600'
      case 'NEGATIVE':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Queries</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage and track all incoming queries
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mt-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Search queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 bg-white p-4 rounded-md shadow border border-gray-200">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={filters.status || ''}
                  onChange={(e) =>
                    setFilters({ status: e.target.value || undefined })
                  }
                >
                  <option value="">All Statuses</option>
                  <option value="NEW">New</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Priority
                </label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={filters.priority || ''}
                  onChange={(e) =>
                    setFilters({ priority: e.target.value || undefined })
                  }
                >
                  <option value="">All Priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilters({})
                    setSearchTerm('')
                  }}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Query List */}
      <div className="mt-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : filteredQueries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No queries found</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {filteredQueries.map((query) => (
                <li key={query.id}>
                  <Link
                    to={`/queries/${query.id}`}
                    className="block hover:bg-gray-50"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                                query.priority
                              )}`}
                            >
                              {query.priority}
                            </span>
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {query.subject || 'No Subject'}
                            </p>
                            <p className="mt-1 text-sm text-gray-500 truncate">
                              {query.senderName || query.senderEmail || 'Unknown'}
                              {query.channel && ` • ${query.channel.name}`}
                            </p>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0 flex flex-col items-end">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              query.status
                            )}`}
                          >
                            {query.status}
                          </span>
                          <p className="mt-1 text-xs text-gray-500">
                            {format(new Date(query.receivedAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {query.content}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center gap-4">
                        {query.sentiment && (
                          <span
                            className={`text-xs font-medium ${getSentimentColor(
                              query.sentiment
                            )}`}
                          >
                            {query.sentiment}
                          </span>
                        )}
                        {query.category && (
                          <span className="text-xs text-gray-500">
                            {query.category.name}
                          </span>
                        )}
                        {query.isVip && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            VIP
                          </span>
                        )}
                        {query.isUrgent && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

