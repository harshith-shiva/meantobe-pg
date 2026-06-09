import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { queryClient } from './lib/queryClient'

import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'

import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import PGsPage from './pages/pgs/PGsPage'
import PGFormPage from './pages/pgs/PGFormPage'
import PGDetailPage from './pages/pgs/PGDetailPage'
import LeadsPage from './pages/LeadsPage'
import BookingsPage from './pages/BookingsPage'
import RemindersPage from './pages/RemindersPage'
import UsersSettingsPage from './pages/settings/UsersSettingsPage'

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/pgs" element={<PGsPage />} />
                  <Route path="/pgs/new" element={<PGFormPage />} />
                  <Route path="/pgs/:id" element={<PGDetailPage />} />
                  <Route path="/pgs/:id/edit" element={<PGFormPage />} />
                  <Route path="/leads" element={<LeadsPage />} />
                  <Route path="/bookings" element={<BookingsPage />} />
                  <Route path="/reminders" element={<RemindersPage />} />
                  <Route path="/settings/users" element={<UsersSettingsPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>

          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                fontSize: '13px',
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
