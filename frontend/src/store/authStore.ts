import { create } from 'zustand'
import { authAPI } from '../services/api'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'MANAGER' | 'AGENT'
  department?: string
  isActive: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true })
    try {
      const response = await authAPI.login(email, password)
      console.log('Login response:', response)
      // API service returns response.data, which is { status, message, data: { user, token } }
      const { token, user } = response.data
      if (!token || !user) {
        console.error('Missing token or user in response:', response)
        throw new Error('Invalid response from server: missing token or user')
      }
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      set({ user, token, isAuthenticated: true, isLoading: false })
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
      })
      set({ isLoading: false })
      throw error
    }
  },

  register: async (data) => {
    set({ isLoading: true })
    try {
      const response = await authAPI.register(data)
      console.log('Register response:', response)
      // API service returns response.data, which is { status, message, data: { user, token } }
      const { token, user } = response.data
      if (!token || !user) {
        console.error('Missing token or user in response:', response)
        throw new Error('Invalid response from server: missing token or user')
      }
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      set({ user, token, isAuthenticated: true, isLoading: false })
    } catch (error: any) {
      console.error('Register error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code,
      })
      set({ isLoading: false })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ isAuthenticated: false, user: null })
      return
    }

    try {
      const response = await authAPI.getCurrentUser()
      // API service returns response.data, which is { status, data: { user } }
      const user = response.data?.user
      if (user) {
        set({ user, isAuthenticated: true })
        localStorage.setItem('user', JSON.stringify(user))
      }
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      set({ user: null, token: null, isAuthenticated: false })
    }
  },
}))

// Initialize auth state from localStorage
const storedUser = localStorage.getItem('user')
if (storedUser) {
  useAuthStore.setState({ user: JSON.parse(storedUser) })
}

