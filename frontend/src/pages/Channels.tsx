import { useState, useEffect } from 'react'
import { channelAPI, integrationAPI } from '../services/api'
import {
  PlayIcon,
  StopIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface Channel {
  id: string
  name: string
  type: string
  isActive: boolean
  configuration?: Record<string, any>
  _count?: {
    queries: number
  }
}

interface IntegrationStatus {
  channelId: string
  isActive: boolean
  lastPollTime?: string
  configuration: string[]
}

const channelTypeLabels: Record<string, string> = {
  EMAIL: 'Email',
  TWITTER: 'Twitter',
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  DISCORD: 'Discord',
  SLACK: 'Slack',
  TEAMS: 'Microsoft Teams',
  WHATSAPP: 'WhatsApp',
  WEBSITE_CHAT: 'Website Chat',
}

export default function Channels() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [integrationStatuses, setIntegrationStatuses] = useState<Record<string, IntegrationStatus>>({})
  const [loading, setLoading] = useState(true)
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadChannels()
    loadIntegrationStatuses()

    const interval = setInterval(loadIntegrationStatuses, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadChannels = async () => {
    try {
      const response = await channelAPI.getChannels()
      setChannels(response.data.channels || [])
    } catch (error) {
      console.error('Error loading channels:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadIntegrationStatuses = async () => {
    try {
      const response = await integrationAPI.getAllIntegrationStatuses()
      const statusMap: Record<string, IntegrationStatus> = {}
      if (response.data?.integrations) {
        response.data.integrations.forEach((status: IntegrationStatus) => {
          statusMap[status.channelId] = status
        })
      }
      setIntegrationStatuses(statusMap)
    } catch (error) {
      console.error('Error loading integration statuses:', error)
    }
  }

  const handleStartIntegration = async (channelId: string) => {
    setActionLoading({ ...actionLoading, [channelId]: true })
    try {
      await integrationAPI.startIntegration(channelId)
      await loadIntegrationStatuses()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to start integration')
    } finally {
      setActionLoading({ ...actionLoading, [channelId]: false })
    }
  }

  const handleStopIntegration = async (channelId: string) => {
    setActionLoading({ ...actionLoading, [channelId]: true })
    try {
      await integrationAPI.stopIntegration(channelId)
      await loadIntegrationStatuses()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to stop integration')
    } finally {
      setActionLoading({ ...actionLoading, [channelId]: false })
    }
  }

  const handleTestConnection = async (channelId: string) => {
    setActionLoading({ ...actionLoading, [`test-${channelId}`]: true })
    try {
      const response = await integrationAPI.testConnection(channelId)
      if (response.data?.success) {
        alert('Connection test successful!')
      } else {
        alert(`Connection test failed: ${response.data?.message || 'Unknown error'}`)
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Connection test failed')
    } finally {
      setActionLoading({ ...actionLoading, [`test-${channelId}`]: false })
    }
  }

  const handleReloadIntegration = async (channelId: string) => {
    setActionLoading({ ...actionLoading, [`reload-${channelId}`]: true })
    try {
      await integrationAPI.reloadIntegration(channelId)
      await loadIntegrationStatuses()
      alert('Integration reloaded successfully')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reload integration')
    } finally {
      setActionLoading({ ...actionLoading, [`reload-${channelId}`]: false })
    }
  }

  const getIntegrationStatus = (channelId: string) => {
    return integrationStatuses[channelId]
  }

  const isIntegrationActive = (channelId: string) => {
    const status = getIntegrationStatus(channelId)
    return status?.isActive || false
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Channels & Integrations</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your communication channels and their integrations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {channels.map((channel) => {
          const status = getIntegrationStatus(channel.id)
          const isActive = isIntegrationActive(channel.id)
          const hasConfiguration = channel.configuration && Object.keys(channel.configuration).length > 0

          return (
            <div
              key={channel.id}
              className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{channel.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {channelTypeLabels[channel.type] || channel.type}
                  </p>
                </div>
                <div className="flex items-center">
                  {isActive ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <span className={isActive ? 'text-green-600 font-medium' : 'text-gray-500'}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Channel Status:</span>
                  <span className={channel.isActive ? 'text-green-600' : 'text-gray-500'}>
                    {channel.isActive ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                {channel._count && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Queries:</span>
                    <span className="text-gray-900 font-medium">{channel._count.queries}</span>
                  </div>
                )}
                {status?.lastPollTime && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Poll:</span>
                    <span className="text-gray-500 text-xs">
                      {new Date(status.lastPollTime).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              {!hasConfiguration && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                    <p className="text-sm text-yellow-800">
                      Configuration required
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {!isActive ? (
                  <button
                    onClick={() => handleStartIntegration(channel.id)}
                    disabled={actionLoading[channel.id] || !hasConfiguration}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                  >
                    <PlayIcon className="h-4 w-4 mr-1" />
                    {actionLoading[channel.id] ? 'Starting...' : 'Start'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleStopIntegration(channel.id)}
                    disabled={actionLoading[channel.id]}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                  >
                    <StopIcon className="h-4 w-4 mr-1" />
                    {actionLoading[channel.id] ? 'Stopping...' : 'Stop'}
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedChannel(channel)
                    setShowConfigModal(true)
                  }}
                  className="flex items-center justify-center px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                  title="Configure"
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                </button>

                <button
                  onClick={() => handleTestConnection(channel.id)}
                  disabled={actionLoading[`test-${channel.id}`] || !hasConfiguration}
                  className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                  title="Test Connection"
                >
                  {actionLoading[`test-${channel.id}`] ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <CheckCircleIcon className="h-4 w-4" />
                  )}
                </button>

                {isActive && (
                  <button
                    onClick={() => handleReloadIntegration(channel.id)}
                    disabled={actionLoading[`reload-${channel.id}`]}
                    className="flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                    title="Reload Integration"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {showConfigModal && selectedChannel && (
        <ChannelConfigModal
          channel={selectedChannel}
          onClose={() => {
            setShowConfigModal(false)
            setSelectedChannel(null)
          }}
          onSave={async () => {
            await loadChannels()
            setShowConfigModal(false)
            setSelectedChannel(null)
          }}
        />
      )}
    </div>
  )
}

interface ChannelConfigModalProps {
  channel: Channel
  onClose: () => void
  onSave: () => void
}

function ChannelConfigModal({ channel, onClose, onSave }: ChannelConfigModalProps) {
  const [config, setConfig] = useState<Record<string, any>>(channel.configuration || {})
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await channelAPI.updateChannel(channel.id, { configuration: config })
      onSave()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const getConfigFields = () => {
    const type = channel.type
    const fields: Record<string, { label: string; type: string; placeholder?: string }> = {}

    switch (type) {
      case 'EMAIL':
        fields.host = { label: 'IMAP Host', type: 'text', placeholder: 'imap.gmail.com' }
        fields.port = { label: 'Port', type: 'number', placeholder: '993' }
        fields.user = { label: 'Email/Username', type: 'text' }
        fields.password = { label: 'Password/App Password', type: 'password' }
        fields.tls = { label: 'Use TLS', type: 'checkbox' }
        fields.mailbox = { label: 'Mailbox', type: 'text', placeholder: 'INBOX' }
        fields.pollInterval = { label: 'Poll Interval (minutes)', type: 'number', placeholder: '5' }
        break
      case 'TWITTER':
        fields.bearerToken = { label: 'Bearer Token', type: 'password' }
        fields.apiKey = { label: 'API Key', type: 'text' }
        fields.apiSecret = { label: 'API Secret', type: 'password' }
        fields.accessToken = { label: 'Access Token', type: 'text' }
        fields.accessTokenSecret = { label: 'Access Token Secret', type: 'password' }
        fields.username = { label: 'Twitter Username', type: 'text' }
        break
      case 'FACEBOOK':
        fields.pageAccessToken = { label: 'Page Access Token', type: 'password' }
        fields.appSecret = { label: 'App Secret', type: 'password' }
        fields.pageId = { label: 'Page ID', type: 'text' }
        fields.webhookVerifyToken = { label: 'Webhook Verify Token', type: 'text' }
        break
      case 'INSTAGRAM':
        fields.accessToken = { label: 'Access Token', type: 'password' }
        fields.instagramBusinessAccountId = { label: 'Instagram Business Account ID', type: 'text' }
        fields.webhookVerifyToken = { label: 'Webhook Verify Token', type: 'text' }
        break
      case 'DISCORD':
        fields.botToken = { label: 'Bot Token', type: 'password' }
        fields.guildId = { label: 'Guild ID (optional)', type: 'text' }
        fields.channelIds = { label: 'Channel IDs (comma-separated, optional)', type: 'text' }
        break
      case 'SLACK':
        fields.botToken = { label: 'Bot Token', type: 'password' }
        fields.signingSecret = { label: 'Signing Secret', type: 'password' }
        fields.channelIds = { label: 'Channel IDs (comma-separated, optional)', type: 'text' }
        break
    }

    return fields
  }

  const configFields = getConfigFields()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Configure {channel.name}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {channelTypeLabels[channel.type] || channel.type} Integration Settings
          </p>
        </div>

        <div className="p-6 space-y-4">
          {Object.entries(configFields).map(([key, field]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              {field.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={config[key] || false}
                  onChange={(e) => setConfig({ ...config, [key]: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              ) : (
                <input
                  type={field.type}
                  value={config[key] || ''}
                  onChange={(e) => {
                    const value = field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value
                    setConfig({ ...config, [key]: value })
                  }}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>
          ))}

          {Object.keys(configFields).length === 0 && (
            <p className="text-sm text-gray-500">
              No specific configuration required for this channel type.
            </p>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  )
}

