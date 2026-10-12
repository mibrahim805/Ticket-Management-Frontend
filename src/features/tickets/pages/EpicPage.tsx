import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TicketTable } from '../components/TicketTable'
import { getEpic } from '../api/ticketApi'
import type { EpicDetails } from '../types/ticket.types'
import './tickets.css'

export function EpicPage() {
  const { epicId } = useParams<{ epicId: string }>()
  const [details, setDetails] = useState<EpicDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!epicId) return
    let current = true
    void getEpic(epicId).then((response) => { if (current) { setDetails(response); setError('') } }).catch((requestError) => {
      if (current) setError(requestError instanceof Error ? requestError.message : 'Unable to load the epic.')
    }).finally(() => { if (current) setIsLoading(false) })
    return () => { current = false }
  }, [epicId])

  if (isLoading) return <div className="page-content"><div className="panel loading-state"><span className="spinner" />Loading epic...</div></div>
  if (error || !details) return <div className="page-content"><div className="inline-error"><span>{error || 'Epic not found.'}</span><Link to="/tickets">Back to tickets</Link></div></div>

  const { epic, issues, progress } = details
  const percent = progress.total ? Math.round(progress.done / progress.total * 100) : 0
  return <div className="page-content epic-page">
    <div className="ticket-breadcrumb"><Link to="/tickets">Tickets</Link><span>/</span><span>{epic.ticket_code}</span></div>
    <section className="epic-heading"><div><p className="eyebrow">Epic · {epic.project_key}</p><h1>{epic.title}</h1><p>{epic.description || 'No description provided.'}</p></div><Link className="secondary-button" to={`/tickets/${epic._id}`}>Open ticket details</Link></section>
    <section className="panel epic-progress"><div><strong>{progress.done} of {progress.total}</strong><span>issues completed</span></div><div className="epic-progress-track"><span style={{ width: `${percent}%` }} /></div><b>{percent}%</b></section>
    <section><div className="epic-issues-heading"><div><h2>Issues in this epic</h2><p>{issues.length} linked issues</p></div></div><TicketTable tickets={issues} /></section>
  </div>
}
