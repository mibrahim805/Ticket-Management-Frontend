import type { Ticket } from '../types/ticket.types'

function formatDate(value?: string | null) { if (!value) return 'No due date'; return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) }
function label(value: string) { return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase()) }

export function TicketTable({ tickets }: { tickets: Ticket[] }) {
  if (!tickets.length) return <div className="panel tickets-empty"><div className="empty-icon">☷</div><h2>No tickets found</h2><p>Try changing your filters or create a new ticket.</p></div>
  return <div className="ticket-table-wrap"><table className="ticket-table"><thead><tr><th>Ticket</th><th>Project</th><th>Title</th><th>Status</th><th>Priority</th><th>Due date</th></tr></thead><tbody>{tickets.map((ticket) => <tr key={ticket._id}><td><span className="ticket-code">{ticket.ticket_code}</span><small>{label(ticket.issue_type)}</small></td><td><span className="project-pill">{ticket.project_key}</span></td><td><strong className="ticket-table-title">{ticket.title}</strong><small>{label(ticket.category)}</small></td><td><span className={`status-pill ${ticket.current_status_name?.toLowerCase().replaceAll(' ', '-') || 'open'}`}>{ticket.current_status_name || 'Open'}</span></td><td><span className={`priority-pill ${ticket.priority}`}>{label(ticket.priority)}</span></td><td className={ticket.is_overdue ? 'overdue-date' : ''}>{formatDate(ticket.due_date)}{ticket.is_overdue && <small>Overdue</small>}</td></tr>)}</tbody></table></div>
}
