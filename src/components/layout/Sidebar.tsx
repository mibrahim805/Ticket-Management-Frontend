import { NavLink } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'

export function Sidebar({ onResizeStart, onHide }: { onResizeStart?: () => void; onHide?: () => void }) {
  const { logout, user } = useAuth()
  const items = [
    ['Dashboard', '/dashboard', '▦'],
    ['My work', '/my-work', '♙'],
    ['Projects', '/projects', '▱'],
    ['Tickets', '/tickets', '☷'],
    ['Sprints', '/sprints', '◷'],
    ['Reports', '/analytics', '⌁'],
  ]

  return <aside className="sidebar">
    <div className="brand">
      <div className="brand-mark">T</div>
      <span>Taskline</span>
      <button className="sidebar-hide-button" type="button" onClick={onHide} aria-label="Hide sidebar">‹</button>
    </div>

    <button className="sidebar-workspace">
      <span className="workspace-icon">◈</span>
      <span>My workspace</span>
      <span className="workspace-chevron">⌄</span>
    </button>

    <p className="nav-label">Workspace</p>
    <nav className="main-nav" aria-label="Main navigation">
      {items.map(([label, path, icon]) => <NavLink className="nav-item" to={path} key={path}>
        <span aria-hidden="true">{icon}</span>
        <b>{label}</b>
      </NavLink>)}

      {user?.role === 'super_admin' && <NavLink className="nav-item" to="/users">
        <span aria-hidden="true">♙</span>
        <b>Users</b>
      </NavLink>}
    </nav>

    <div className="sidebar-footer">
      <div className="user-card">
        <div className="avatar">{user?.username?.charAt(0).toUpperCase() || 'U'}</div>
        <div>
          <strong>{user?.username || 'User'}</strong>
          <small>Workspace member</small>
        </div>
        <button className="logout-button" onClick={logout} aria-label="Sign out">↪</button>
      </div>
    </div>

    <div
      className="sidebar-resize-handle"
      role="separator"
      aria-label="Resize sidebar"
      aria-orientation="vertical"
      onPointerDown={onResizeStart}
    />
  </aside>
}
