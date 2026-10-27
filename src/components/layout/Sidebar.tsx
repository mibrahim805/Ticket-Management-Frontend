import { useEffect, useState } from 'react'
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

export function Sidebar({ onHide }: { onHide?: () => void }) {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Project[]>([])

  useEffect(() => {
    let active = true
    void getProjects().then((response) => {
      if (active) setFavorites(response.projects.slice(0, 3))
    }).catch(() => undefined)
    return () => { active = false }
  }, [])

  const accountItems: NavigationItem[] = [
    ...(user?.role === 'super_admin' ? [{ label: 'Users', path: '/users', icon: 'users' as IconName }] : []),
    { label: 'Profile', path: '/profile', icon: 'profile' },
    { label: 'Settings', path: user?.role === 'super_admin' ? '/statuses' : '/profile', icon: 'settings' },
  ]

  return <aside className="sidebar" aria-label="Workspace navigation">
    <nav className="main-nav" aria-label="Main navigation">
      {[...workspaceItems, ...accountItems].map((item, index) => <NavLink
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        to={item.path}
        end={item.exact}
        key={`${item.label}-${item.path}`}
      >
        <Icon name={item.icon} />
        <span>{item.label}</span>
        {index === 0 && <span className="nav-active-dot" aria-hidden="true" />}
      </NavLink>)}
    </nav>

    <section className="favorites" aria-label="Favorite projects">
      <div className="sidebar-section-title"><Icon name="star" /><span>Favorites</span></div>
      <div className="favorite-list">
        {favorites.map((project, index) => <NavLink to={`/projects/${project._id}`} className="favorite-item" key={project._id}>
          <span className={`favorite-project-mark ${projectColors[index]}`}>{project.code.slice(0, 2).toUpperCase()}</span>
          <span>{project.name}</span>
          <Icon name="pin" />
        </NavLink>)}
        {!favorites.length && <span className="favorite-empty">Projects appear here</span>}
      </div>
    </section>

    <div className="sidebar-footer">
      <NavLink className="workspace-card" to="/profile">
        <span className="workspace-avatar">T</span>
        <span><strong>Taskline</strong><small>My workspace</small></span>
        <Icon name="arrow-right" />
      </NavLink>
      <button className="collapse-button" type="button" onClick={onHide}><Icon name="collapse" /> <span>Collapse</span></button>
    </div>
  </aside>
}
