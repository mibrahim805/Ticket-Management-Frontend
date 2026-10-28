import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { CreateTicketDrawerProvider } from '../../features/tickets/components/CreateTicketDrawer'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const location = useLocation()
  const toggleSidebar = () => setIsSidebarCollapsed((current) => !current)

  return <CreateTicketDrawerProvider><div className={`app-frame ${isSidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
    <Topbar isSidebarCollapsed={isSidebarCollapsed} onToggleSidebar={toggleSidebar} />
    <div className="app-shell">
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <main className="content">
        <div className="route-transition" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  </div></CreateTicketDrawerProvider>
}
