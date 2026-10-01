import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProjectsPage } from '../features/projects/pages/ProjectsPage'
import { CreateTicketPage } from '../features/tickets/pages/CreateTicketPage'
import { TicketsPage } from '../features/tickets/pages/TicketsPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { element: <ProtectedRoute />, children: [{ element: <AppLayout />, children: [{ path: '/dashboard', element: <DashboardPage /> }, { path: '/projects', element: <ProjectsPage /> }, { path: '/tickets', element: <TicketsPage /> }, { path: '/tickets/new', element: <CreateTicketPage /> }, { path: '/', element: <Navigate to="/dashboard" replace /> }]}] },
  { path: '*', element: <NotFoundPage /> },
])
