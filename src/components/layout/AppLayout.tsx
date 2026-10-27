import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false)

  return <div className={`app-frame ${isSidebarHidden ? 'sidebar-is-hidden' : ''}`}>
    <Topbar onToggleSidebar={() => setIsSidebarHidden((current) => !current)} />
    <div className="app-shell">
      {!isSidebarHidden && <Sidebar onHide={() => setIsSidebarHidden(true)} />}
      <main className="content"><Outlet /></main>
    </div>
  </div>
}
