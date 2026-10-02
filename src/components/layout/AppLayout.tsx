import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const { pathname } = useLocation()
  const isProjectsDirectory = pathname === '/projects'

  return <div className={isProjectsDirectory ? 'app-frame project-directory-frame' : 'app-frame'}>
    <Topbar />
    <div className="app-shell">
      <Sidebar />
      <main className="content"><Outlet /></main>
    </div>
  </div>
}
