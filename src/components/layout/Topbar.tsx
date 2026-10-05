import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useNotifications } from '../../features/notifications/hooks/useNotifications'
import type { Notification } from '../../features/notifications/types/notification.types'

const eventLabels: Record<string, string> = {
  ticket_created: 'A ticket was created',
  ticket_updated: 'A ticket was updated',
  ticket_assigned: 'A ticket was assigned to you',
  ticket_deleted: 'A ticket was deleted',
  ticket_transitioned: 'A ticket changed status',
  ticket_linked: 'A ticket link was added',
  comment_created: 'A comment was added',
  comment_updated: 'A comment was updated',
  comment_deleted: 'A comment was deleted',
  comment_mentioned: 'You were mentioned in a comment',
}

function notificationLabel(notification: Notification) {
  return eventLabels[notification.event_type] || notification.event_type.replaceAll('_', ' ')
}

function notificationDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
}

export function Topbar() {
  const navigate = useNavigate()
  const notificationMenu = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { notifications, unreadCount, isLoading, error, markAsRead, markAllAsRead } = useNotifications()

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!notificationMenu.current?.contains(event.target as Node)) setNotificationsOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = search.trim()
    navigate(query ? `/tickets?search=${encodeURIComponent(query)}` : '/tickets')
  }

  async function openNotification(notification: Notification) {
    if (!notification.is_read) {
      try { await markAsRead(notification._id) } catch { /* The destination is still useful if marking fails. */ }
    }
    setNotificationsOpen(false)
    navigate(`/tickets/${notification.ticket_id}`)
  }

  async function markEverythingRead() {
    try { await markAllAsRead() } catch { /* The provider restores state when the request fails. */ }
  }

  return <header className="topbar"><div className="topbar-left"><button className="menu-button" aria-label="Toggle navigation">☰</button><div className="topbar-brand"><span className="topbar-brand-mark">T</span><strong>Taskline</strong></div><nav className="topbar-nav" aria-label="Main navigation"><Link to="/projects">Projects</Link><Link to="/tickets">Tickets</Link><Link to="/analytics">Reports</Link></nav></div><div className="topbar-actions"><form className="search-box" onSubmit={submitSearch}><span>⌕</span><input aria-label="Search" placeholder="Search tickets" value={search} onChange={(event) => setSearch(event.target.value)} /></form><div className="notification-menu" ref={notificationMenu}><button className={`icon-button notification-button ${unreadCount ? 'has-unread' : ''}`} type="button" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`} aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((current) => !current)}>♢{unreadCount > 0 && <span className="notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}</button>{notificationsOpen && <div className="notification-popover" role="dialog" aria-label="Notifications"><div className="notification-heading"><div><strong>Notifications</strong><small>{unreadCount ? `${unreadCount} unread` : 'All caught up'}</small></div><button className="text-button" type="button" onClick={() => void markEverythingRead()} disabled={!unreadCount}>Mark all read</button></div>{error && <p className="notification-error">{error}</p>}{isLoading && <p className="notification-empty">Loading notifications...</p>}{!isLoading && notifications.length === 0 && <p className="notification-empty">No notifications yet.</p>}{notifications.length > 0 && <div className="notification-list">{notifications.slice(0, 20).map((notification) => <button className={`notification-item ${notification.is_read ? '' : 'unread'}`} type="button" key={notification._id} onClick={() => void openNotification(notification)}><span className="notification-dot" aria-hidden="true" /><span><strong>{notificationLabel(notification)}</strong><small>{notificationDate(notification.created_at)}</small></span></button>)}</div>}</div>}</div><div className="topbar-avatar">SU</div></div></header>
}
