import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProjects } from '../features/projects/api/projectApi'
import { getTickets } from '../features/tickets/api/ticketApi'
import type { Ticket, TicketFilters } from '../features/tickets/types/ticket.types'
import './analytics.css'

const filters: TicketFilters = { page: 1, page_size: 100, search: '', priority: '', category: '', issue_type: '', overdue_only: false, sort_by: 'created_at', sort_order: 'desc' }
const completed = (ticket: Ticket) => /done|closed|resolved/i.test(ticket.current_status_name || '')
const label = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())

async function loadTickets() {
  const first = await getTickets(filters)
  if (first.pagination.total_pages < 2) return first.data
  const pages = await Promise.all(Array.from({ length: first.pagination.total_pages - 1 }, (_, index) => getTickets({ ...filters, page: index + 2 })))
  return first.data.concat(...pages.map((page) => page.data))
}

export function AnalyticsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [projectCount, setProjectCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    void Promise.all([loadTickets(), getProjects()]).then(([items, projects]) => { setTickets(items); setProjectCount(projects.projects.length) }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Unable to load analytics.')).finally(() => setLoading(false))
  }, [])
  const total = tickets.length
  const done = tickets.filter(completed).length
  const open = total - done
  const urgent = tickets.filter((ticket) => ticket.priority === 'urgent' || ticket.priority === 'high').length
  const types = ['bug', 'task', 'story', 'support'].map((type) => ({ type, count: tickets.filter((ticket) => ticket.issue_type === type || ticket.category === type).length })).filter((item) => item.count)
  const projects = Object.entries(tickets.reduce<Record<string, number>>((counts, ticket) => { counts[ticket.project_key] = (counts[ticket.project_key] || 0) + 1; return counts }, {})).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (6 - index)); const key = date.toDateString(); return { name: date.toLocaleDateString(undefined, { weekday: 'short' }), count: tickets.filter((ticket) => ticket.due_date && new Date(ticket.due_date).toDateString() === key).length } })
  const maxDay = Math.max(...days.map((day) => day.count), 1)
  return <div className="page-content analytics-page">
    <section className="analytics-heading"><div><p className="eyebrow">Workspace reports</p><h1>Analytics</h1><p className="subtle">A clear view of throughput, workload, and team momentum.</p></div><Link className="secondary-button" to="/tickets">Browse tickets →</Link></section>
    {error && <div className="analytics-panel">{error}</div>}
    {loading ? <div className="analytics-loading">Loading workspace analytics...</div> : <>
      <section className="analytics-grid"><article className="analytics-card"><p>Total issues</p><strong>{total}</strong><small>Across {projectCount} projects</small></article><article className="analytics-card"><p>Completed</p><strong>{done}</strong><small>{total ? Math.round(done / total * 100) : 0}% of all issues</small></article><article className="analytics-card"><p>In progress</p><strong>{open}</strong><small>Open and active work</small></article><article className="analytics-card"><p>High priority</p><strong>{urgent}</strong><small>Needs focused attention</small></article></section>
      <div className="analytics-layout"><section className="analytics-panel"><h2>Activity & throughput</h2><p>Issues with due dates over the last seven days.</p><div className="throughput">{days.map((day) => <div className="throughput-day" key={day.name}><span className="throughput-value">{day.count}</span><span className="throughput-bar" style={{ height: `${Math.max(day.count / maxDay * 100, 4)}%` }} /><span>{day.name}</span></div>)}</div></section><section className="analytics-panel"><h2>Issue type breakdown</h2><p>Distribution of work in your workspace.</p>{types.length ? types.map((item) => <div className="breakdown-row" key={item.type}><span>{label(item.type)}</span><div className="breakdown-track"><span style={{ width: `${item.count / Math.max(total, 1) * 100}%` }} /></div><b>{item.count}</b></div>) : <div className="analytics-loading">No issue data yet.</div>}</section></div>
      <div className="analytics-bottom"><section className="analytics-panel"><h2>Top projects</h2><p>Projects with the most visible issues.</p>{projects.length ? projects.map(([name, count]) => <div className="ranking-row" key={name}><strong>{name}</strong><span>{count} issues</span></div>) : <div className="analytics-loading">No projects found.</div>}</section><section className="analytics-panel"><h2>Team performance</h2><p>Workload grouped by assignee.</p>{Object.entries(tickets.reduce<Record<string, number>>((counts, ticket) => { const owner = ticket.assigned_agent || 'Unassigned'; counts[owner] = (counts[owner] || 0) + 1; return counts }, {})).slice(0, 4).map(([name, count]) => <div className="team-row" key={name}><span>{name}</span><div className="team-track"><span style={{ width: `${count / Math.max(total, 1) * 100}%` }} /></div><b>{count}</b></div>)}</section></div>
    </>}
  </div>
}
