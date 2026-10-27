import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false)
  const location = useLocation()

  return <div className={`app-frame ${isSidebarHidden ? 'sidebar-is-hidden' : ''}`}>
    <Topbar onToggleSidebar={() => setIsSidebarHidden((current) => !current)} />
    <div className="app-shell">
      {!isSidebarHidden && <Sidebar onHide={() => setIsSidebarHidden(true)} />}
      <main className="content">
        <div className="route-transition" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  </div>
}
