import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import QueryList from './pages/QueryList'
import QueryDetail from './pages/QueryDetail'
import Channels from './pages/Channels'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="queries" element={<QueryList />} />
          <Route path="queries/:id" element={<QueryDetail />} />
          <Route path="channels" element={<Channels />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App

