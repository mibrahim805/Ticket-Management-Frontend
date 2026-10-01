import { NavLink } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'

export function Sidebar() {
  const { logout } = useAuth()
  const items = [['Dashboard', '/dashboard', '▦'], ['Projects', '/projects', '▱'], ['Tickets', '/tickets', '☷'], ['Sprints', '/sprints', '◷'], ['Reports', '/reports', '⌁']]
  return <aside className="sidebar">
    <div className="brand"><div className="brand-mark">T</div><span>Taskline</span></div>
    <p className="nav-label">Workspace</p>
    <nav className="main-nav" aria-label="Main navigation">{items.map(([label, path, icon]) => <NavLink className="nav-item" to={path} key={path}><span>{icon}</span>{label}</NavLink>)}</nav>
    <div className="sidebar-footer"><div className="user-card"><div className="avatar">SU</div><div><strong>Signed-in user</strong><small>Workspace member</small></div><button className="logout-button" onClick={logout} aria-label="Sign out">↪</button></div></div>
  </aside>
}
