import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProjectsPage } from '../features/projects/pages/ProjectsPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { element: <ProtectedRoute />, children: [{ element: <AppLayout />, children: [{ path: '/dashboard', element: <DashboardPage /> }, { path: '/projects', element: <ProjectsPage /> }, { path: '/', element: <Navigate to="/dashboard" replace /> }]}] },
  { path: '*', element: <NotFoundPage /> },
])
