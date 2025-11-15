import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryStore } from '../store/queryStore'
import { format } from 'date-fns'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { responseAPI } from '../services/api'

interface Response {
  id: string
  content: string
  isInternal: boolean
  sentAt: string
  user: {
    firstName: string
    lastName: string
  }
}

export default function QueryDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { selectedQuery, fetchQueryById, updateQuery, isLoading } =
    useQueryStore()
  const [responses, setResponses] = useState<Response[]>([])
  const [newResponse, setNewResponse] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      fetchQueryById(id)
      loadResponses()
    }
  }, [id, fetchQueryById])

  const loadResponses = async () => {
    if (!id) return
    try {
      const response = await responseAPI.getResponses(id)
      const data = response.data || response
      setResponses(data.responses || data || [])
    } catch (error) {
      console.error('Failed to load responses:', error)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!id) return
    try {
      await updateQuery(id, { status: status as any })
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handlePriorityChange = async (priority: string) => {
    if (!id) return
    try {
      await updateQuery(id, { priority: priority as any })
    } catch (error) {
      console.error('Failed to update priority:', error)
    }
  }

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !newResponse.trim()) return

    setIsSubmitting(true)
    try {
      await responseAPI.createResponse({
        queryId: id,
        content: newResponse,
        isInternal,
      })
      setNewResponse('')
      setIsInternal(false)
      await loadResponses()
      await fetchQueryById(id)
    } catch (error) {
      console.error('Failed to submit response:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !selectedQuery) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
      </div>
    )
  }

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

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <button
        onClick={() => navigate('/queries')}
        className="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-1" />
        Back to Queries
      </button>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {selectedQuery.subject || 'No Subject'}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Query ID: {selectedQuery.id}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(
                  selectedQuery.priority
                )}`}
              >
                {selectedQuery.priority}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  selectedQuery.status
                )}`}
              >
                {selectedQuery.status}
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Sender</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {selectedQuery.senderName || selectedQuery.senderEmail || 'Unknown'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Channel</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {selectedQuery.channel?.name || 'Unknown'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Received</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {format(new Date(selectedQuery.receivedAt), 'PPpp')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Category</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {selectedQuery.category?.name || 'Uncategorized'}
              </dd>
            </div>
            {selectedQuery.sentiment && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Sentiment</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {selectedQuery.sentiment}
                </dd>
              </div>
            )}
            {selectedQuery.assignments && selectedQuery.assignments.length > 0 && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {selectedQuery.assignments.map((a) => (
                    <span key={a.id}>
                      {a.user.firstName} {a.user.lastName}
                    </span>
                  ))}
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-6">
            <dt className="text-sm font-medium text-gray-500">Content</dt>
            <dd className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">
              {selectedQuery.content}
            </dd>
          </div>

          {
          <div className="mt-6 flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={selectedQuery.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
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
                value={selectedQuery.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Responses</h3>
        <div className="space-y-4">
          {responses.map((response) => (
            <div
              key={response.id}
              className={`bg-white shadow rounded-lg p-4 ${
                response.isInternal ? 'border-l-4 border-yellow-400' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900">
                    {response.user.firstName} {response.user.lastName}
                  </span>
                  {response.isInternal && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      Internal
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {format(new Date(response.sentAt), 'PPpp')}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {response.content}
              </p>
            </div>
          ))}
        </div>

        {
        <div className="mt-6 bg-white shadow rounded-lg p-4">
          <form onSubmit={handleSubmitResponse}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Response
              </label>
              <textarea
                rows={4}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Type your response here..."
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">Internal note</span>
              </label>
              <button
                type="submit"
                disabled={isSubmitting || !newResponse.trim()}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Response'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

