import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { getNotification } from '../../features/notifications/api/notificationApi'
import { useNotifications } from '../../features/notifications/hooks/useNotifications'
import { useCreateTicketDrawer } from '../../features/tickets/components/createTicketDrawerContext'
import type { Notification } from '../../features/notifications/types/notification.types'
import { Icon } from '../ui/Icon'
import { ThemeToggle } from '../ui/ThemeToggle'

const eventLabels: Record<string, string> = {
  ticket_created: 'A ticket was created', ticket_updated: 'A ticket was updated',
  ticket_assigned: 'A ticket was assigned to you', ticket_deleted: 'A ticket was deleted',
  ticket_transitioned: 'A ticket changed status', ticket_linked: 'A ticket link was added',
  comment_created: 'A comment was added', comment_updated: 'A comment was updated',
  comment_deleted: 'A comment was deleted', comment_mentioned: 'You were mentioned in a comment',
}

function notificationLabel(notification: Notification) {
  return eventLabels[notification.event_type] || notification.event_type.replaceAll('_', ' ')
}

function notificationDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
}

export function Topbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const navigate = useNavigate()
  const { openCreateTicket } = useCreateTicketDrawer()
  const { user, logout } = useAuth()
  const searchInput = useRef<HTMLInputElement>(null)
  const notificationMenu = useRef<HTMLDivElement>(null)
  const profileMenu = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { notifications, unreadCount, isLoading, error, markAsRead, markAllAsRead } = useNotifications()

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      const target = event.target as Node
      if (!notificationMenu.current?.contains(target)) setNotificationsOpen(false)
      if (!profileMenu.current?.contains(target)) setProfileOpen(false)
    }
    function focusSearch(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInput.current?.focus()
      }
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    window.addEventListener('keydown', focusSearch)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      window.removeEventListener('keydown', focusSearch)
    }
  }, [])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = search.trim()
    navigate(query ? `/tickets?search=${encodeURIComponent(query)}` : '/tickets')
  }

  async function openNotification(notification: Notification) {
    let selected = notification
    try { selected = await getNotification(notification._id) } catch { /* Existing notification data still has the destination. */ }
    if (!selected.is_read) {
      try { await markAsRead(selected._id) } catch { /* Navigation remains available. */ }
    }
    setNotificationsOpen(false)
    navigate(`/tickets/${selected.ticket_id}`)
  }

  const displayName = user?.username || user?.email?.split('@')[0] || 'User'
  const role = user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Administrator' : 'Member'

  return <header className="topbar">
    <div className="topbar-brand-area">
      <button className="mobile-menu-button" type="button" onClick={onToggleSidebar} aria-label="Toggle navigation"><Icon name="menu" /></button>
      <Link className="topbar-brand" to="/dashboard"><span className="topbar-brand-mark">T</span><strong>Taskline</strong></Link>
    </div>

    <form className="search-box" onSubmit={submitSearch}>
      <Icon name="search" />
      <input ref={searchInput} aria-label="Search tickets, projects, or people" placeholder="Search tickets, projects, or people..." value={search} onChange={(event) => setSearch(event.target.value)} />
      <kbd>Ctrl&nbsp; K</kbd>
    </form>

    <div className="topbar-actions">
      <button className="create-ticket-button" type="button" onClick={() => openCreateTicket()}><Icon name="plus" /> <span>Create ticket</span></button>
      <ThemeToggle />
      <div className="notification-menu" ref={notificationMenu}>
        <button className={`topbar-icon-button ${unreadCount ? 'has-unread' : ''}`} type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((current) => !current); setProfileOpen(false) }}><Icon name="bell" />{unreadCount > 0 && <span className="notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}</button>
        {notificationsOpen && <div className="notification-popover" role="dialog" aria-label="Notifications">
          <div className="notification-heading"><div><strong>Notifications</strong><small>{unreadCount ? `${unreadCount} unread` : 'All caught up'}</small></div><button type="button" onClick={() => void markAllAsRead()} disabled={!unreadCount}>Mark all read</button></div>
          {error && <p className="notification-error">{error}</p>}
          {isLoading && <p className="notification-empty">Loading notifications...</p>}
          {!isLoading && !notifications.length && <p className="notification-empty">No notifications yet.</p>}
          {!!notifications.length && <div className="notification-list">{notifications.slice(0, 20).map((notification) => <button className={`notification-item ${notification.is_read ? '' : 'unread'}`} type="button" key={notification._id} onClick={() => void openNotification(notification)}><span className="notification-dot" /><span><strong>{notificationLabel(notification)}</strong><small>{notificationDate(notification.created_at)}</small></span></button>)}</div>}
        </div>}
      </div>
      <Link className="topbar-icon-button help-button" to="/analytics" aria-label="Help and reports"><Icon name="help" /></Link>
      <div className="profile-menu" ref={profileMenu}>
        <button className="profile-trigger" type="button" aria-expanded={profileOpen} onClick={() => { setProfileOpen((current) => !current); setNotificationsOpen(false) }}>
          <span className="topbar-avatar">{initials(displayName)}</span>
          <span className="profile-copy"><strong>{displayName}</strong><small>{role}</small></span>
          <Icon name="chevron-down" />
        </button>
        {profileOpen && <div className="profile-popover"><Link to="/profile" onClick={() => setProfileOpen(false)}>View profile</Link>{user?.role === 'super_admin' && <Link to="/users" onClick={() => setProfileOpen(false)}>Manage users</Link>}<button type="button" onClick={logout}>Sign out</button></div>}
      </div>
    </div>
  </header>
}
