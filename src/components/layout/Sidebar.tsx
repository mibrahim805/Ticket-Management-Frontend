import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { getProjects } from '../../features/projects/api/projectApi'
import type { Project } from '../../features/projects/types/project.types'
import { Icon, type IconName } from '../ui/Icon'

type NavigationItem = { label: string; path: string; icon: IconName; exact?: boolean }

const workspaceItems: NavigationItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
  { label: 'My work', path: '/my-work', icon: 'work' },
  { label: 'Projects', path: '/projects', icon: 'projects', exact: true },
  { label: 'Tickets', path: '/tickets', icon: 'tickets' },
  { label: 'Sprints', path: '/sprints', icon: 'sprints' },
  { label: 'Reports', path: '/analytics', icon: 'reports' },
]

const projectColors = ['blue', 'violet', 'green']

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

export function Sidebar({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const { user, logout } = useAuth()
  const [favorites, setFavorites] = useState<Project[]>([])
  const [accountOpen, setAccountOpen] = useState(false)
  const accountMenu = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    void getProjects().then((response) => {
      if (active) setFavorites(response.projects.slice(0, 3))
    }).catch(() => undefined)
    return () => { active = false }
  }, [])

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!accountMenu.current?.contains(event.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  const accountItems: NavigationItem[] = [
    ...(user?.role === 'super_admin' ? [{ label: 'Users', path: '/users', icon: 'users' as IconName }] : []),
    ...(user?.role === 'super_admin' ? [{ label: 'Settings', path: '/statuses', icon: 'settings' as IconName }] : []),
  ]
  const displayName = user?.username || user?.email?.split('@')[0] || 'User'

  return <aside className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`} aria-label="Workspace navigation">
    <nav className="main-nav workspace-nav" aria-label="Workspace navigation">
      {workspaceItems.map((item) => <NavLink
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        to={item.path}
        end={item.exact}
        key={`${item.label}-${item.path}`}
        title={isCollapsed ? item.label : undefined}
        aria-label={isCollapsed ? item.label : undefined}
      >
        <Icon name={item.icon} />
        <span>{item.label}</span>
      </NavLink>)}
    </nav>

    <nav className="main-nav account-nav" aria-label="Account and administration">
      {accountItems.map((item) => <NavLink
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        to={item.path}
        end={item.exact}
        key={`${item.label}-${item.path}`}
        title={isCollapsed ? item.label : undefined}
        aria-label={isCollapsed ? item.label : undefined}
      >
        <Icon name={item.icon} />
        <span>{item.label}</span>
      </NavLink>)}
    </nav>

    <section className="favorites" aria-label="Favorite projects">
      <div className="sidebar-section-title"><Icon name="star" /><span>Favorites</span></div>
      <div className="favorite-list">
        {favorites.map((project, index) => <NavLink to={`/projects/${project._id}`} className="favorite-item" key={project._id} title={isCollapsed ? project.name : undefined} aria-label={isCollapsed ? project.name : undefined}>
          <span className={`favorite-project-mark ${projectColors[index]}`}>{project.code.slice(0, 2).toUpperCase()}</span>
          <span>{project.name}</span>
          <Icon name="pin" />
        </NavLink>)}
        {!favorites.length && <span className="favorite-empty">Projects appear here</span>}
      </div>
    </section>

    <div className="sidebar-footer">
      <div className={`sidebar-account ${accountOpen ? 'is-open' : ''}`} ref={accountMenu}>
        <button className="sidebar-account-trigger" type="button" onClick={() => setAccountOpen((current) => !current)} aria-expanded={accountOpen} aria-haspopup="menu" title={isCollapsed ? displayName : undefined}>
          <span className="sidebar-account-avatar">{initials(displayName)}</span>
          <span className="sidebar-account-copy"><strong>{displayName}</strong></span>
        </button>
        {accountOpen && <div className="sidebar-account-menu" role="menu" aria-label="Account options">
          <NavLink to="/profile" role="menuitem" onClick={() => setAccountOpen(false)}>Profile</NavLink>
          <button type="button" role="menuitem" onClick={() => { setAccountOpen(false); logout() }}>Logout</button>
        </div>}
      </div>
    </div>
  </aside>
}
