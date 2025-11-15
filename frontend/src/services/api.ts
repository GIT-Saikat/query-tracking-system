import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },
  register: async (data: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => {
    const response = await api.post('/auth/register', data)
    return response.data
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
}

export const queryAPI = {
  getQueries: async (params?: {
    status?: string
    priority?: string
    channelId?: string
    categoryId?: string
    page?: number
    limit?: number
  }) => {
    const response = await api.get('/queries', { params })
    return response.data
  },
  getQueryById: async (id: string) => {
    const response = await api.get(`/queries/${id}`)
    return response.data
  },
  createQuery: async (data: {
    channelId: string
    content: string
    subject?: string
    senderName?: string
    senderEmail?: string
  }) => {
    const response = await api.post('/queries', data)
    return response.data
  },
  updateQuery: async (id: string, data: {
    status?: string
    priority?: string
    categoryId?: string
  }) => {
    const response = await api.put(`/queries/${id}`, data)
    return response.data
  },
  assignQuery: async (id: string, userId: string, notes?: string) => {
    const response = await api.post(`/queries/${id}/assign`, { userId, notes })
    return response.data
  },
  deleteQuery: async (id: string) => {
    const response = await api.delete(`/queries/${id}`)
    return response.data
  },
}

export const channelAPI = {
  getChannels: async () => {
    const response = await api.get('/channels')
    return response.data
  },
  getChannelById: async (id: string) => {
    const response = await api.get(`/channels/${id}`)
    return response.data
  },
  createChannel: async (data: {
    name: string
    type: string
    isActive?: boolean
    configuration?: Record<string, any>
  }) => {
    const response = await api.post('/channels', data)
    return response.data
  },
  updateChannel: async (id: string, data: {
    name?: string
    isActive?: boolean
    configuration?: Record<string, any>
  }) => {
    const response = await api.put(`/channels/${id}`, data)
    return response.data
  },
  deleteChannel: async (id: string) => {
    const response = await api.delete(`/channels/${id}`)
    return response.data
  },
}

export const integrationAPI = {
  startIntegration: async (channelId: string) => {
    const response = await api.post(`/integrations/${channelId}/start`)
    return response.data
  },
  stopIntegration: async (channelId: string) => {
    const response = await api.post(`/integrations/${channelId}/stop`)
    return response.data
  },
  testConnection: async (channelId: string) => {
    const response = await api.post(`/integrations/${channelId}/test`)
    return response.data
  },
  getIntegrationStatus: async (channelId: string) => {
    const response = await api.get(`/integrations/${channelId}/status`)
    return response.data
  },
  getAllIntegrationStatuses: async () => {
    const response = await api.get('/integrations/status')
    return response.data
  },
  reloadIntegration: async (channelId: string) => {
    const response = await api.post(`/integrations/${channelId}/reload`)
    return response.data
  },
}

export const categoryAPI = {
  getCategories: async () => {
    const response = await api.get('/categories')
    return response.data
  },
  getCategoryById: async (id: string) => {
    const response = await api.get(`/categories/${id}`)
    return response.data
  },
}

export const responseAPI = {
  getResponses: async (queryId: string) => {
    const response = await api.get(`/responses/query/${queryId}`)
    return response.data
  },
  createResponse: async (data: {
    queryId: string
    content: string
    isInternal?: boolean
  }) => {
    const response = await api.post('/responses', data)
    return response.data
  },
}

export default api

