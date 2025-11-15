import { create } from 'zustand'
import { queryAPI } from '../services/api'

export interface Query {
  id: string
  channelId: string
  categoryId?: string
  subject?: string
  content: string
  senderName?: string
  senderEmail?: string
  senderPhone?: string
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
  intent?: string
  confidence?: number
  autoTags: string[]
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  isVip: boolean
  isUrgent: boolean
  receivedAt: string
  assignedAt?: string
  resolvedAt?: string
  closedAt?: string
  slaDueAt?: string
  createdAt: string
  updatedAt: string
  channel?: {
    id: string
    name: string
    type: string
  }
  category?: {
    id: string
    name: string
    color?: string
  }
  assignments?: Array<{
    id: string
    userId: string
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }>
}

interface QueryState {
  queries: Query[]
  selectedQuery: Query | null
  filters: {
    status?: string
    priority?: string
    channelId?: string
    categoryId?: string
  }
  pagination: {
    page: number
    limit: number
    total: number
  }
  isLoading: boolean
  error: string | null
  fetchQueries: () => Promise<void>
  fetchQueryById: (id: string) => Promise<void>
  updateQuery: (id: string, data: Partial<Query>) => Promise<void>
  assignQuery: (id: string, userId: string, notes?: string) => Promise<void>
  setFilters: (filters: Partial<QueryState['filters']>) => void
  setSelectedQuery: (query: Query | null) => void
}

export const useQueryStore = create<QueryState>((set, get) => ({
  queries: [],
  selectedQuery: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
  isLoading: false,
  error: null,

  fetchQueries: async () => {
    set({ isLoading: true, error: null })
    try {
      const { filters, pagination } = get()
      const response = await queryAPI.getQueries({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      })
      const data = response.data.data || response.data
      set({
        queries: data.queries || [],
        pagination: {
          ...pagination,
          total: data.pagination?.total || data.queries?.length || 0,
        },
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch queries',
        isLoading: false,
      })
    }
  },

  fetchQueryById: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await queryAPI.getQueryById(id)
      const data = response.data.data || response.data
      set({
        selectedQuery: data.query || data,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch query',
        isLoading: false,
      })
    }
  },

  updateQuery: async (id: string, data: Partial<Query>) => {
    set({ isLoading: true, error: null })
    try {
      await queryAPI.updateQuery(id, {
        status: data.status,
        priority: data.priority,
        categoryId: data.categoryId,
      })
      await get().fetchQueries()
      if (get().selectedQuery?.id === id) {
        await get().fetchQueryById(id)
      }
      set({ isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update query',
        isLoading: false,
      })
      throw error
    }
  },

  assignQuery: async (id: string, userId: string, notes?: string) => {
    set({ isLoading: true, error: null })
    try {
      await queryAPI.assignQuery(id, userId, notes)
      await get().fetchQueries()
      if (get().selectedQuery?.id === id) {
        await get().fetchQueryById(id)
      }
      set({ isLoading: false })
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to assign query',
        isLoading: false,
      })
      throw error
    }
  },

  setFilters: (filters: Partial<QueryState['filters']>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 },
    }))
    get().fetchQueries()
  },

  setSelectedQuery: (query: Query | null) => {
    set({ selectedQuery: query })
  },
}))

