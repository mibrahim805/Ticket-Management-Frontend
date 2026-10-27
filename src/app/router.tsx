import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { DashboardPage } from '../pages/DashboardPage'
import { AnalyticsPage } from '../pages/AnalyticsPage'
import { MyWorkPage } from '../pages/MyWorkPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { UnauthorizedPage } from '../pages/UnauthorizedPage'
import { ProjectsPage } from '../features/projects/pages/ProjectsPage'
import { ProjectPage } from '../features/projects/pages/ProjectPage'
import { ProjectSettingsPage } from '../features/projects/pages/ProjectSettingsPage'
import { CreateTicketPage } from '../features/tickets/pages/CreateTicketPage'
import { TicketsPage } from '../features/tickets/pages/TicketsPage'
import { TicketDetailPage } from '../features/tickets/pages/TicketDetailPage'
import { EpicPage } from '../features/tickets/pages/EpicPage'
import { WorkflowBoardPage } from '../features/workflow/pages/WorkflowBoardPage'
import { UserManagementPage } from '../pages/UserManagementPage'
import { RegistrationPage } from '../pages/RegistrationPage'
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../pages/ResetPasswordPage'
import { ProfilePage } from '../pages/ProfilePage'
import { StatusManagementPage } from '../features/statuses/pages/StatusManagementPage'
import { SprintsOverviewPage } from '../pages/SprintsOverviewPage'
import { useAuth } from '../features/auth/hooks/useAuth'

function SuperAdminRoute() {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user) return <main className="simple-page"><p>Loading account...</p></main>
  return user.role === 'super_admin' ? <Outlet /> : <Navigate to="/unauthorized" replace />
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegistrationPage /> },
  { path: '/setup-super-admin', element: <RegistrationPage superAdmin /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },
  { element: <ProtectedRoute />, children: [{ element: <AppLayout />, children: [{ path: '/dashboard', element: <DashboardPage /> }, { path: '/my-work', element: <MyWorkPage /> }, { path: '/projects', element: <ProjectsPage /> }, { path: '/projects/:projectId', element: <ProjectPage /> }, { path: '/projects/:projectId/settings', element: <ProjectSettingsPage /> }, { path: '/projects/:projectId/board', element: <WorkflowBoardPage /> }, { path: '/sprints', element: <SprintsOverviewPage /> }, { path: '/tickets', element: <TicketsPage /> }, { path: '/tickets/new', element: <CreateTicketPage /> }, { path: '/tickets/:ticketId', element: <TicketDetailPage /> }, { path: '/epics/:epicId', element: <EpicPage /> }, { path: '/analytics', element: <AnalyticsPage /> }, { path: '/profile', element: <ProfilePage /> }, { element: <SuperAdminRoute />, children: [{ path: '/users', element: <UserManagementPage /> }, { path: '/statuses', element: <StatusManagementPage /> }] }, { path: '/', element: <Navigate to="/dashboard" replace /> }]}] },
  { path: '*', element: <NotFoundPage /> },
])
