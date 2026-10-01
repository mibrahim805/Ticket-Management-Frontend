import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { DashboardPage } from '../pages/DashboardPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProjectsPage } from '../features/projects/pages/ProjectsPage'
import { ProjectPage } from '../features/projects/pages/ProjectPage'
import { CreateTicketPage } from '../features/tickets/pages/CreateTicketPage'
import { TicketsPage } from '../features/tickets/pages/TicketsPage'
import { WorkflowBoardPage } from '../features/workflow/pages/WorkflowBoardPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { element: <ProtectedRoute />, children: [{ element: <AppLayout />, children: [{ path: '/dashboard', element: <DashboardPage /> }, { path: '/projects', element: <ProjectsPage /> }, { path: '/projects/:projectId', element: <ProjectPage /> }, { path: '/projects/:projectId/board', element: <WorkflowBoardPage /> }, { path: '/tickets', element: <TicketsPage /> }, { path: '/tickets/new', element: <CreateTicketPage /> }, { path: '/', element: <Navigate to="/dashboard" replace /> }]}] },
  { path: '*', element: <NotFoundPage /> },
])
